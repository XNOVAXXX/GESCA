# GESCA · Gestión de Espacios en Sede Cata

Sistema de reserva y administración de espacios físicos (auditorios, salas de cómputo, canchas,
laboratorios y espacios compartidos) de la I.U. Pascual Bravo.

| Capa | Tecnología |
|---|---|
| App (web + Android + iOS) | React Native con Expo y Expo Router, en TypeScript |
| Backend | Supabase: Postgres, Auth, Edge Functions |
| Arquitectura | Microservicios ligeros: un esquema de Postgres por dominio y una Edge Function por servicio |

## Estructura

```
app/                          App Expo
  src/app/                    Rutas: solo unen un hook con una vista
  src/features/<dominio>/<pantalla>/
    Pantalla.view.tsx         ESTRUCTURA (qué se muestra y dónde)
    Pantalla.styles.ts        DISEÑO (colores, tamaños, márgenes)
    usePantalla.ts            FUNCIONALIDAD (datos, validaciones, navegación)
  src/services/               Único punto que habla con Supabase
  src/theme/                  Paleta institucional y tipografía
  src/domain/                 Tipos y reglas de negocio para validar en pantalla
supabase/
  migrations/                 Esquemas usuarios, espacios y reservas, con sus reglas
  functions/svc-reservas/     Microservicio de reservas
  tests/                      Pruebas de las reglas (pgTAP) y de concurrencia
  seed.sql                    Espacios de ejemplo
docs/                         Plan de desarrollo y análisis del stack
```

La separación entre estructura, diseño y funcionalidad la vigila ESLint (`app/eslint.config.js`).
Por ejemplo, una vista que importe un servicio o use estilos en línea no pasa el CI.

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
# Base de datos y servicios
supabase start             # levanta Postgres, Auth y Edge Functions, aplica migraciones y seed
supabase test db           # pruebas de reglas de negocio
./supabase/tests/concurrencia.sh

# App
cd app
cp .env.example .env       # pegar la URL y la llave anon que imprime `supabase start`
npm install
npm run web                # o: npm run android / npm run ios
npm run lint && npm run typecheck
npm test                   # pruebas unitarias (Jest)
```

Todo cambio a la base de datos se hace con una migración nueva (`supabase migration new <nombre>`),
nunca desde el panel web.

## Pruebas unitarias

Se escriben con Jest junto al archivo que prueban (`archivo.test.ts`) y corren con `npm test` dentro de `app/`.

| Archivo | Pruebas |
|---|---|
| `src/domain/reglas.test.ts` | 1. Rechaza más de 2 horas · 2. Rechaza más de 15 días de anticipación · 3. No cancela con menos de 24 horas · 4. Correo externo va a Coordinación |
| `src/services/auth.service.test.ts` | 5. Contraseña incorrecta da un error genérico · 6. El código correcto abre sesión como solicitante |

GitHub Actions las corre en cada push y PR (job "App" del CI).

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

La prueba `supabase/tests/acceso.test.mjs` revisa ambos ingresos contra el Supabase local y corre en el CI.

## Ramas

`main` es lo que se demuestra, `develop` es la integración y `feature/HUxx-descripcion` es el trabajo
de cada historia. Todo entra por PR con revisión de otro integrante.
