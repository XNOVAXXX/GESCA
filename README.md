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
```

Todo cambio a la base de datos se hace con una migración nueva (`supabase migration new <nombre>`),
nunca desde el panel web.

## Ramas

`main` es lo que se demuestra, `develop` es la integración y `feature/HUxx-descripcion` es el trabajo
de cada historia. Todo entra por PR con revisión de otro integrante.
