# GESCA: plan de desarrollo

Stack aprobado por Julian (11/10/2026):
- **Frontend:** React Native con Expo para toda la aplicación. Corre en web (react-native-web), Android e iOS desde un solo código.
- **Backend:** Supabase (Postgres, Auth, Realtime, Edge Functions).
- **Arquitectura:** microservicios ligeros. Hay un esquema de Postgres por dominio y una Edge Function por servicio. Las reglas críticas viven en la base de datos.
- **Lenguaje:** TypeScript en todo el proyecto. Las Edge Functions ya lo usan, y los tipos de la base de datos se generan automáticamente para la app.

El acta inició el 13/09, así que **hoy (11/10) empieza la semana 5**. Quedan 10 semanas.

---

## 1. Estructura del repositorio (un solo repo en GitHub)

La estructura actual del repositorio está en [arquitectura.md](arquitectura.md) y en el README.
La idea original era esta:

```
gesca/
├── app/                        # Expo (React Native) → web + Android + iOS
│   ├── app/                    # Rutas (expo-router), solo conectan con features/
│   ├── features/               # Pantallas: .view.tsx + .styles.ts + use*.ts
│   │   ├── (publico)/          # Solicitante: calendario, solicitar, mis reservas
│   │   ├── (admin)/            # Admin de Espacios: espacios, ítems, bandeja
│   │   └── (coordinador)/      # Coordinador/Laboratorista: bandeja especial
│   ├── components/             # UI con la paleta institucional (RNF05)
│   ├── services/               # Cliente de cada microservicio (espacios, reservas…)
│   └── theme/                  # Colores y tipografía Pascual Bravo
├── supabase/
│   ├── migrations/             # SQL versionado: esquemas, tablas, reglas, RLS
│   ├── functions/
│   │   ├── svc-espacios/
│   │   ├── svc-reservas/
│   │   ├── svc-aprobaciones/
│   │   └── svc-notificaciones/
│   ├── seed.sql                # Datos de prueba (espacios reales de la sede)
│   └── tests/                  # Pruebas pgTAP de las reglas de negocio
├── docs/                       # Acta actualizada, diagramas, manuales
└── postman/                    # Colección de pruebas de la API
```

### Separación de estructura, diseño y funcionalidad (pedido por Julian, 11/10/2026)

Cada pantalla vive en `app/features/<dominio>/<pantalla>/` con tres archivos:

| Archivo | Contiene | No puede contener |
|---|---|---|
| `Pantalla.view.tsx` | Estructura: componentes y su orden, recibe datos y funciones por props | Llamadas a Supabase, cálculos, estilos en línea |
| `Pantalla.styles.ts` | Diseño: `StyleSheet` usando los tokens de `theme/` | Lógica |
| `usePantalla.ts` | Funcionalidad: estado, validaciones, llamadas a `services/` | JSX o estilos |

- `theme/`: paleta institucional, tipografía y espaciados (un cambio aquí afecta toda la app).
- `services/`: único punto que habla con Supabase y las Edge Functions.
- Las reglas se hacen cumplir con ESLint (`no-restricted-imports` para que `.view` no importe `services`/Supabase, `react-native/no-inline-styles`) y corren en el CI.

## 2. Microservicios y su dueño

| Servicio | Esquema Postgres | Qué hace | Requisitos |
|---|---|---|---|
| **svc-usuarios** (Supabase Auth + tabla `perfiles`) | `usuarios` | Login de Admin y Coordinador, roles, código OTP al correo para solicitantes | RNF01, RNF02, RN05 (dominio verificado) |
| **svc-espacios** | `espacios` | CRUD de espacios, capacidad, ítems/mobiliario, estado Activo/En mantenimiento | RF01, RN03, HU02 |
| **svc-reservas** | `reservas` | Disponibilidad, radicar solicitud, validar límites, cancelar con justificación | RF02, RF03, RF05, RN01, RN06, HU01 |
| **svc-aprobaciones** | `reservas` (tabla `decisiones`) | Enrutar a la bandeja correcta, aprobar o rechazar con motivo | RF04, RN04, RN05, HU03 |
| **svc-notificaciones** | — | Correos de "solicitud recibida / aprobada / rechazada / cancelada" | Trazabilidad |

### Reglas que viven en la base de datos (no se pueden saltar desde ningún cliente)

| Regla | Implementación |
|---|---|
| RN01 cero solapamiento | `EXCLUDE USING gist (espacio_id WITH =, franja WITH &&)` sobre reservas Pendiente/Aprobada |
| RN06 máx. 2 h | `CHECK (upper(franja) - lower(franja) <= interval '2 hours')` |
| RN06 máx. 15 días | Trigger al insertar: `lower(franja) <= now() + interval '15 days'` |
| RN06 cancelar ≥ 24 h antes | Trigger al cambiar a Cancelada |
| RN03 mantenimiento | Trigger: rechaza la reserva si el espacio no está Activo |
| RN04 justificación | `CHECK` (estado Rechazada/Cancelada exige `motivo` no vacío) |
| RN05 aprobación especial | Al insertar, se calcula `bandeja = 'coordinador'` si el espacio es Laboratorio/Compartido o el correo no es @pascualbravo.edu.co |
| Auditoría | Tabla `historial_reserva` llenada por trigger en cada cambio de estado (quién, cuándo, de qué estado a cuál, motivo) |

### Modelo de datos inicial

- `usuarios.perfiles`: id (= auth.users), nombre, correo, rol (admin, coordinador, solicitante)
- `espacios.tipos`: Auditorio, Sala de cómputo, Cancha, Laboratorio, Espacio compartido
- `espacios.espacios`: nombre, tipo, capacidad_max, estado, motivo_estado
- `espacios.items`: espacio_id, nombre, cantidad
- `reservas.reservas`: espacio_id, responsable_id, franja (tstzrange), motivo_uso, estado, bandeja, motivo_decision
- `reservas.reserva_items`: reserva_id, item_id, cantidad
- `reservas.historial_reserva`: reserva_id, estado_anterior, estado_nuevo, actor_id, motivo, fecha

## 3. Cronograma (semanas 5 a 14)

| Semana | Entregable | Qué se construye |
|---|---|---|
| **5** | Base lista | Repo y ramas, proyecto Supabase, Expo creado, tablero Jira con las épicas. Acta actualizada al nuevo stack. |
| **6** | Modelo de datos | Migraciones de los esquemas, reglas de la tabla anterior, `seed.sql` con espacios reales y primeras pruebas pgTAP del no-solapamiento. |
| **7** | Usuarios y acceso | Login de Admin y Coordinador, OTP del solicitante, roles con RLS, cierre de sesión a los 15 min de inactividad (RNF02). Tema institucional y navegación por rol. |
| **8–9** | Épica 01: Espacios | svc-espacios y pantallas de CRUD de espacios e ítems, cambio a "En mantenimiento" con motivo (HU02). |
| **10–11** | Épica 02: Reservas | Calendario de disponibilidad con filtros y actualización en tiempo real (RF02), formulario de solicitud con selección de recursos (HU01), "Mis reservas" y cancelación. |
| **12** | Épica 03: Aprobaciones | Bandejas de Admin y Coordinador, aprobar o rechazar con motivo obligatorio (HU03), correos de notificación. |
| **13** | Pruebas | Pruebas pgTAP de todas las reglas, prueba de concurrencia (dos reservas simultáneas en la misma franja), colección Postman, revisión en celular y escritorio. |
| **14** | Cierre | Web publicada (Netlify o Vercel), APK de Android con EAS, manuales, ensayo de la demo de extremo a extremo y sustentación. |

Fase 2, fuera del MVP: check-in/check-out del Supervisor (HU04), Logística y reportes (HU05).

## 4. Reparto sugerido para 3 personas

| Integrante | Foco principal | También |
|---|---|---|
| A | Base de datos: migraciones, reglas, RLS, pruebas pgTAP | svc-espacios |
| B | Edge Functions: svc-reservas, svc-aprobaciones, svc-notificaciones | Colección Postman |
| C | App Expo: tema, navegación, pantallas, calendario | Publicación web y APK |

Todos revisan los PR de los demás (compromiso R04 del acta). Cada historia de Jira se resuelve en una rama `feature/HUxx-descripcion` con su PR.

## 5. Forma de trabajo

- **Ramas:** `main` (lo que se demuestra), `develop` (integración) y `feature/*`.
- **Entornos:** Supabase local con `supabase start` (Docker) para desarrollar, y un proyecto en la nube para la demo. La regla es que nadie cambia la base de datos desde el panel web: todo cambio es una migración en el repo.
- **CI en GitHub Actions:** en cada PR se corren las migraciones contra un Postgres limpio, las pruebas pgTAP y el lint y los tipos de la app.
- **Riesgo de la demo:** el plan gratuito de Supabase pausa el proyecto tras ~7 días sin uso. Se agrega una tarea programada que lo mantenga activo y se revisa el día antes de cada entrega.

## 6. Qué hace falta para arrancar

1. Repositorio en GitHub (nuevo o existente) donde subir el esqueleto.
2. Cuenta de Supabase (gratuita) para el proyecto en la nube. Puedo dejar todo listo localmente sin ella.
3. La paleta institucional de Pascual Bravo (códigos de color y logo) para el tema.
