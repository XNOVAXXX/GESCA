// Prueba de extremo a extremo del acceso (INSOFT-23 y INSOFT-24) contra el Supabase local.
// Uso (desde app/, para tener @supabase/supabase-js):
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... node ../supabase/tests/usuarios/acceso.test.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// supabase-js se toma de app/node_modules (el directorio desde donde se ejecuta).
const { createClient } = createRequire(`${process.cwd()}/`)('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(url && anonKey && serviceKey, 'Faltan SUPABASE_URL, SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY');

const sinSesion = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, sinSesion);
const cliente = () => createClient(url, anonKey, sinSesion);
const sufijo = Date.now();

let fallos = 0;
async function prueba(nombre, fn) {
  try {
    await fn();
    console.log(`ok - ${nombre}`);
  } catch (e) {
    fallos++;
    console.log(`not ok - ${nombre}\n  ${e.message}`);
  }
}

async function perfilPropio(c) {
  const { data: u } = await c.auth.getUser();
  const { data, error } = await c.schema('usuarios').from('perfiles').select('nombre, correo, rol').eq('id', u.user.id).single();
  assert.ifError(error);
  return data;
}

// --- INSOFT-23: Administrador con contraseña ---------------------------------------------
const correoAdmin = `admin.${sufijo}@pascualbravo.edu.co`;
const contrasena = 'Clave-segura-123';

await prueba('crear un administrador (Auth + rol en usuarios.perfiles)', async () => {
  const { data, error } = await admin.auth.admin.createUser({
    email: correoAdmin,
    password: contrasena,
    email_confirm: true,
    user_metadata: { nombre: 'Admin de Prueba' },
  });
  assert.ifError(error);
  const { error: e2 } = await admin.schema('usuarios').from('perfiles').update({ rol: 'admin' }).eq('id', data.user.id);
  assert.ifError(e2);
});

await prueba('contraseña incorrecta: rechazada sin decir qué dato falló', async () => {
  const { error } = await cliente().auth.signInWithPassword({ email: correoAdmin, password: 'otra-clave' });
  assert.ok(error, 'debía fallar');
  assert.equal(error.code, 'invalid_credentials');
});

await prueba('correo inexistente: mismo error que contraseña incorrecta', async () => {
  const { error } = await cliente().auth.signInWithPassword({ email: `nadie.${sufijo}@pascualbravo.edu.co`, password: contrasena });
  assert.ok(error, 'debía fallar');
  assert.equal(error.code, 'invalid_credentials');
});

await prueba('credenciales válidas: sesión con rol admin', async () => {
  const c = cliente();
  const { error } = await c.auth.signInWithPassword({ email: correoAdmin, password: contrasena });
  assert.ifError(error);
  const p = await perfilPropio(c);
  assert.equal(p.rol, 'admin');
  assert.equal(p.nombre, 'Admin de Prueba');
});

// --- INSOFT-24: Solicitante con código de 6 dígitos ---------------------------------------
const correoExterno = `visitante.${sufijo}@gmail.com`;

await prueba('solicitante nuevo: el código de 6 dígitos abre sesión como solicitante', async () => {
  const { error: e1 } = await admin.auth.admin.createUser({
    email: correoExterno,
    email_confirm: true,
    user_metadata: { nombre: 'Visitante Externo' },
  });
  assert.ifError(e1);

  const { data, error: e2 } = await admin.auth.admin.generateLink({ type: 'magiclink', email: correoExterno });
  assert.ifError(e2);
  const codigo = data.properties.email_otp;
  assert.match(codigo, /^\d{6}$/);

  const c = cliente();
  const { error: e3 } = await c.auth.verifyOtp({ email: correoExterno, token: codigo, type: 'email' });
  assert.ifError(e3);
  const p = await perfilPropio(c);
  assert.equal(p.rol, 'solicitante');
  assert.equal(p.correo, correoExterno);
  assert.equal(p.nombre, 'Visitante Externo');
});

await prueba('código incorrecto: no abre sesión', async () => {
  const { error } = await cliente().auth.verifyOtp({ email: correoExterno, token: '000000', type: 'email' });
  assert.ok(error, 'debía fallar');
});

await prueba('un solicitante no puede subirse de rol', async () => {
  const { data } = await admin.auth.admin.generateLink({ type: 'magiclink', email: correoExterno });
  const c = cliente();
  await c.auth.verifyOtp({ email: correoExterno, token: data.properties.email_otp, type: 'email' });
  const { data: u } = await c.auth.getUser();
  await c.schema('usuarios').from('perfiles').update({ rol: 'admin' }).eq('id', u.user.id);
  const p = await perfilPropio(c);
  assert.equal(p.rol, 'solicitante');
});

console.log(fallos === 0 ? '\nTodas las pruebas de acceso pasaron.' : `\n${fallos} prueba(s) fallaron.`);
process.exit(fallos === 0 ? 0 : 1);
