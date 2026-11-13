# Arquitectura de GESCA: microservicios ligeros sobre Supabase

GESCA se divide en tres microservicios, uno por dominio del negocio. Cada uno es dueño de sus datos
(su propio esquema en Postgres) y de sus reglas. Ninguno escribe en las tablas de otro.

```mermaid
flowchart LR
  subgraph App["App Expo (web, Android, iOS)"]
    U[microservicios/usuarios]
    E[microservicios/espacios]
    R[microservicios/reservas]
    C[compartido: cliente Supabase, tema, logo]
  end

  subgraph Supabase
    AUTH[Supabase Auth]
    SU[(esquema usuarios)]
    SE[(esquema espacios)]
    SR[(esquema reservas)]
    FR[Edge Function svc-reservas]
  end

  U -- usuarios.api.ts --> AUTH
  U -- usuarios.api.ts --> SU
  E -- espacios.api.ts --> SE
  R -- reservas.api.ts --> FR
  FR --> SR
  E -. usa la sesión vía index.ts .-> U
  R -. usa la sesión vía index.ts .-> U
```

## Los tres microservicios

| | Usuarios | Espacios | Reservas |
|---|---|---|---|
| Responsabilidad | Quién es el usuario y qué rol tiene | Catálogo de espacios y su estado | Solicitudes, aprobación y cancelación |
| Esquema Postgres | `usuarios` (`perfiles`) | `espacios` (`espacios`, `items`) | `reservas` (`reservas`, `historial`) |
| Migración | `*_usuarios.sql` | `*_espacios.sql` | `*_reservas.sql` |
| Lógica de servidor | Supabase Auth | Lectura con RLS | Edge Function `svc-reservas` |
| Módulo en la app | `app/src/microservicios/usuarios/` | `app/src/microservicios/espacios/` | `app/src/microservicios/reservas/` |
| Pruebas | `supabase/tests/usuarios/`, `usuarios.*.test.ts` | | `supabase/tests/reservas/`, `reservas.*.test.ts` |

## Forma de cada módulo en la app

Todos los microservicios tienen la misma forma, para que cualquier integrante sepa dónde buscar:

```
microservicios/<dominio>/
  <dominio>.api.ts        DATOS: el único archivo que habla con Supabase
  <dominio>.reglas.ts     Reglas que se validan en pantalla antes de enviar (la base de datos tiene la última palabra)
  <dominio>.tipos.ts      Tipos del dominio
  index.ts                Contrato público: lo único que otros microservicios pueden importar
  pantallas/<pantalla>/
    Pantalla.view.tsx     ESTRUCTURA
    Pantalla.styles.ts    DISEÑO
    usePantalla.ts        FUNCIONALIDAD
```

Flujo de una pantalla: la ruta (`src/app/...`) une el hook con la vista; la vista solo dibuja; el hook
valida con `*.reglas.ts` y llama a `*.api.ts`; el `*.api.ts` habla con Supabase.

## Reglas que vigila el CI

| Regla | Cómo se comprueba |
|---|---|
| Un microservicio no entra a los archivos internos de otro | ESLint `import/no-restricted-paths` |
| Solo los `*.api.ts` usan Supabase | ESLint `no-restricted-imports` |
| Las vistas no tienen estilos en línea ni colores sueltos | ESLint `react-native/no-inline-styles`, `no-color-literals` |
| Los hooks no conocen el diseño | ESLint `no-restricted-imports` |
| Las reglas de negocio se cumplen en la base de datos | Pruebas pgTAP en `supabase/tests/reservas/` |
| La imagen Docker se construye | Job "Docker" del CI |

## Despliegue

- **App web:** imagen Docker (`app/Dockerfile`): Node genera la web con Expo y Nginx la sirve.
  `docker compose up --build` la deja en http://localhost:8080.
- **Backend:** Supabase en la nube. En local, `npx supabase start` levanta los mismos servicios en Docker.
