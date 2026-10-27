# GESCA · Gestión de Espacios en Sede Cata

Sistema de reserva y administración de espacios físicos (auditorios, salas de cómputo, canchas,
laboratorios y espacios compartidos) de la I.U. Pascual Bravo.

| Capa | Tecnología |
|---|---|
| App (web + Android + iOS) | React Native con Expo y Expo Router, en TypeScript |
| Backend | Supabase: Postgres, Auth, Edge Functions |
| Arquitectura | Microservicios ligeros: un esquema de Postgres por dominio y una Edge Function por servicio |

## Estructura: un microservicio por dominio

Cada dominio del negocio es un microservicio. Tiene su propio esquema en Postgres, sus reglas en la
base de datos, su Edge Function cuando necesita lógica de servidor y su propio módulo en la app.

| Microservicio | Base de datos | Edge Function | Módulo de la app |
|---|---|---|---|
| Usuarios | esquema `usuarios` + Supabase Auth | (usa Auth directo) | `app/src/microservicios/usuarios/` |
| Espacios | esquema `espacios` | (lectura directa con RLS) | `app/src/microservicios/espacios/` |
| Reservas | esquema `reservas` | `svc-reservas` | `app/src/microservicios/reservas/` |

```
app/                              App Expo (web, Android, iOS)
  src/app/                        Rutas: solo unen un hook con una vista
  src/microservicios/
    usuarios/                     Ingreso con contraseña, código al correo, sesión
      usuarios.api.ts             DATOS: único archivo que habla con Supabase
      usuarios.reglas.ts          Reglas que se validan en pantalla
      usuarios.tipos.ts           Tipos del dominio
      index.ts                    Lo que este microservicio ofrece a los demás
      pantallas/<pantalla>/
        Pantalla.view.tsx         ESTRUCTURA (qué se muestra y dónde)
        Pantalla.styles.ts        DISEÑO (colores, tamaños, márgenes)
        usePantalla.ts            FUNCIONALIDAD (datos, validaciones, navegación)
    espacios/                     Catálogo y disponibilidad (misma forma)
    reservas/                     Solicitudes de reserva (misma forma)
  src/compartido/                 Lo que usan todos: cliente Supabase, tema, logo, errores
  Dockerfile, nginx.conf          Imagen de la app web
supabase/
  migrations/                     Un archivo por esquema: usuarios, espacios, reservas
  functions/svc-reservas/         Edge Function del microservicio de reservas
  tests/usuarios/                 Prueba de acceso contra Supabase local
  tests/reservas/                 Reglas RN01 a RN06 (pgTAP) y concurrencia
  templates/                      Correo con el código de acceso
  seed.sql                        Espacios de ejemplo
docs/                             Arquitectura, plan de desarrollo y análisis del stack
docker-compose.yml                Levanta la app web en Docker
```

ESLint (`app/eslint.config.js`) vigila dos reglas y el CI falla si se rompen:

1. **Fronteras entre microservicios.** Un microservicio solo usa a otro a través de su `index.ts`.
   Por ejemplo, `espacios` puede importar `@/microservicios/usuarios`, pero no `@/microservicios/usuarios/usuarios.api`.
2. **Estructura, diseño y funcionalidad separados.** Una vista que llame a un `*.api.ts` o use estilos
   en línea, o un hook que importe colores, no pasa.

Más detalle en [docs/arquitectura.md](docs/arquitectura.md).

## Reglas de negocio en la base de datos

| Regla | Dónde |
|---|---|
| RN01: cero solapamiento | Restricción `sin_solapamiento` (exclusión GiST) |
| RN03: mantenimiento bloquea reservas | Trigger `al_radicar` |
| RN04: justificación al rechazar o cancelar | `check justificacion_obligatoria` |
| RN05: laboratorios, espacios compartidos y correos externos van al Coordinador | Trigger `al_radicar` (columna `bandeja`) |
| RN06: máx. 2 h, máx. 15 días, cancelar ≥ 24 h | `check duracion_maxima` y triggers |
| RF04: cada bandeja la decide su rol | Trigger `al_cambiar_estado` y RLS |
| Auditoría | Tabla `reservas.historial` |

## Desarrollo local

Requisitos: Node 22, Docker y el [CLI de Supabase](https://supabase.com/docs/guides/cli).

```bash
# Backend: Postgres, Auth y Edge Functions en contenedores Docker
npx supabase start         # aplica migraciones y seed
npx supabase test db       # pruebas de reglas de negocio
./supabase/tests/reservas/concurrencia.sh

# App
cd app
cp .env.example .env       # pegar la URL y la llave anon (de `supabase start` o del panel de Supabase)
npm install
npm run web                # o: npm run android / npm run ios
npm run lint && npm run typecheck
npm test                   # pruebas unitarias (Jest)
```

En Windows con PowerShell, usar `npm.cmd` en lugar de `npm` (por ejemplo `npm.cmd run web`).

Todo cambio a la base de datos se hace con una migración nueva (`supabase migration new <nombre>`),
nunca desde el panel web.

## Docker

La app web corre en un contenedor con Nginx. Solo hace falta Docker Desktop.

```bash
cp app/.env.example app/.env     # llenar URL y llave anon de Supabase
docker compose up --build        # abre http://localhost:8080
docker compose down              # detener
```

La imagen se construye en dos etapas: Node genera la versión web con Expo y Nginx la sirve
(la imagen final pesa unos 75 MB y no lleva Node). Los valores de `app/.env` quedan incrustados al
construir, así que después de cambiarlos hay que volver a correr `docker compose up --build`.

El backend no va en este `docker-compose.yml`: en local, `npx supabase start` ya levanta Postgres,
Auth y las Edge Functions en sus propios contenedores Docker, y en la nube corre en Supabase.

## Pruebas unitarias

Se escriben con Jest junto al archivo que prueban (`archivo.test.ts`) y corren con `npm test` dentro de `app/`.

Son 6 pruebas, 2 por integrante. Cada uno sube las suyas en su propio commit.

| Integrante | Archivo | Pruebas |
|---|---|---|
| Julián Buitrago | `src/microservicios/usuarios/usuarios.api.test.ts` | 1. Contraseña incorrecta da un error genérico · 2. El código correcto abre sesión como solicitante |
| John García | `src/microservicios/reservas/reservas.reglas.test.ts` | 3. Rechaza más de 2 horas · 4. Rechaza más de 15 días de anticipación |
| Juan Ocampo | `src/microservicios/reservas/reservas.api.test.ts` | 5. Un cruce de horario muestra un mensaje claro |
| Juan Ocampo | `src/microservicios/usuarios/usuarios.reglas.test.ts` | 6. Correo externo va a Coordinación |

Cada prueba cubre algo que ya usa una pantalla de la app.

GitHub Actions las corre en cada push y PR (job "App" del CI). El job "Docker" comprueba que la imagen se construye.

## Acceso de usuarios

| Quién | Cómo entra | Pantalla |
|---|---|---|
| Administrador de Espacios y Coordinador | Correo y contraseña | `/acceso/ingresar` |
| Solicitante (estudiante, docente o externo) | Código de 6 dígitos al correo, sin contraseña | `/acceso/verificar` (también se abre al radicar sin sesión) |

Todo usuario nuevo queda como `solicitante`. Para el proyecto en la nube:

1. **Exponer los esquemas**: Project Settings → Data API → Exposed schemas: `usuarios`, `espacios`, `reservas`.
2. **Código en vez de enlace**: Authentication → Emails → plantillas *Confirm signup* y *Magic Link*: pegar
   `supabase/templates/codigo-acceso.html` (usa `{{ .Token }}`).
3. **Crear un administrador o coordinador**: Authentication → Users → Add user (con contraseña y
   *Auto Confirm User*), y luego en SQL Editor:
   `update usuarios.perfiles set rol = 'admin' where correo = 'correo@pascualbravo.edu.co';`
   (o `'coordinador'`).
4. **Correos a cualquier persona**: el servidor de correo incluido en Supabase solo envía a los miembros
   del equipo del proyecto y unos pocos por hora. Para la demo con otros correos hay que configurar SMTP
   propio en Authentication → Emails → SMTP Settings.

La prueba `supabase/tests/usuarios/acceso.test.mjs` revisa ambos ingresos contra el Supabase local y corre en el CI.

## Ramas

`main` es lo que se demuestra, `develop` es la integración y `feature/HUxx-descripcion` es el trabajo
de cada historia. Todo entra por PR con revisión de otro integrante.
