# GESCA: opinión sobre el cambio de stack

Cambio propuesto: **Frontend** HTML, CSS, JS y React Native · **Backend** Supabase · **Arquitectura** microservicios.
Base del análisis: Acta de Inicio del Proyecto (13/09/2026, 14 páginas), leída completa.

## Resumen

| Decisión | Veredicto | Por qué en una línea |
|---|---|---|
| Supabase | **Sí, es una mejora clara** | Postgres resuelve el cero-solapamiento (RN01/RNF04) mejor que MySQL y trae Auth, RLS y API listas. |
| HTML/CSS/JS para web | **Sí** | Encaja con RNF05/RNF06 y con lo que el equipo ya planeó. |
| React Native | **Sí, pero con alcance acotado** | Dos frontends completos en 14 semanas con 3 personas es el mayor riesgo de cronograma. |
| Microservicios "puros" | **No para el MVP** | Rompen la atomicidad que exige el acta y multiplican el trabajo operativo. Recomiendo una versión ligera (ver sección 4). |

---

## 1. Supabase como backend: buen encaje

**Lo que gana el proyecto**

- **RN01 / RNF04 (cero cruces, atómico, sin deadlocks)**: en Postgres esto se resuelve con una *restricción de exclusión* sobre un rango de tiempo:

  ```sql
  create extension if not exists btree_gist;
  alter table reservas add constraint sin_solapamiento
    exclude using gist (espacio_id with =, franja with &&)
    where (estado in ('pendiente','aprobada'));
  ```

  La base de datos rechaza la segunda reserva aunque lleguen dos en el mismo milisegundo. Es más robusto y más simple que el "SELECT ... FOR UPDATE + validar en PHP" que planteaba el acta con MySQL, y elimina gran parte del riesgo R03.
- **RN06 (máx. 2 h, máx. 15 días, cancelación ≥ 24 h)** y **RN04 (justificación obligatoria)**: se pueden poner como `CHECK` y triggers en la base de datos, así se cumplen sin importar si la petición viene de la web o de la app móvil.
- **RN03 (mantenimiento bloquea reservas)**: trigger o política RLS que impide insertar si el espacio está "En mantenimiento".
- **RNF02 (contraseñas cifradas)**: Supabase Auth ya las guarda con hash; se elimina el trabajo de `password_hash` y manejo de sesiones de las semanas 5–7.
- **Roles (Admin, Coordinador, Logística)**: tabla de perfiles + políticas RLS por rol.
- **RF02 (disponibilidad en tiempo real)**: Supabase Realtime puede refrescar el calendario cuando otro usuario reserva.

**Puntos a vigilar**

- **Plan gratuito pausa el proyecto tras ~1 semana sin actividad.** Choca con RNF07 (99 % de disponibilidad) y, sobre todo, es un riesgo el día de la sustentación. Mitigación: tarea programada que haga una consulta diaria, o revisar el proyecto antes de cada demo.
- **RNF02 (sesión expira a los 15 min de inactividad)**: el *inactivity timeout* nativo de Supabase Auth no está en el plan gratuito (verificarlo en el plan que usen). Alternativa: implementarlo en el cliente (temporizador que hace `signOut()`) con JWT de vida corta.
- **Solicitantes sin cuenta (RNF01)**: si cualquiera puede insertar reservas sin autenticarse, también puede **escribir un correo @pascualbravo.edu.co falso** y saltarse la aprobación especial de RN05. Recomiendo que el solicitante se identifique con un **enlace mágico / código OTP al correo** (Supabase lo trae): no crea contraseña, cumple el espíritu de RNF01 y hace que el dominio del correo sea verificable. Esto requiere ajustar RNF01 en el acta.
- **RNF08 (MVC)** deja de aplicar tal cual: no hay "controladores PHP". Hay que reescribirlo como separación por capas (cliente / API / reglas en base de datos y funciones).

## 2. Frontend: HTML/CSS/JS + React Native

> **Decisión de Julian (11/10/2026): React Native como framework para toda la aplicación** (opción 3: Expo + react-native-web, un solo código para web y móvil). HTML/CSS/JS quedan como la salida web que genera React Native, no como un frontend aparte; Bootstrap se reemplaza por una librería de componentes de React Native con la paleta institucional.

El acta exige en **RNF06** que la aplicación sea "100 % web con diseño adaptativo mediante Bootstrap". Agregar React Native significa **una segunda aplicación** (otro lenguaje de UI, otro build, Expo, pruebas en dispositivos) que comparte el backend pero no el código de interfaz.

Opciones, de menos a más trabajo:

1. **Solo web (HTML/CSS/JS + Bootstrap + `supabase-js`)**, responsiva para móvil. Cumple el acta sin cambiarla. React Native queda para Fase 2.
2. **Web para todo + app React Native solo para el Solicitante** (consultar disponibilidad, pedir reserva, ver estado, cancelar). Los paneles de Admin y Coordinador quedan solo en web. **← Mi recomendación si React Native es obligatorio o lo quieren aprender.**
3. **React Native con Expo para todo, exportado también a web (react-native-web)**: un solo código, pero entonces HTML/CSS/JS "puro" sobra y Bootstrap no aplica.

Dato a favor de React Native a futuro: el **Supervisor (check-in/check-out)** y **Logística** son los actores que más se benefician de una app móvil (inspección en sitio, fotos de daños). Ambos están fuera del MVP, así que la app móvil tiene un papel natural más fuerte en Fase 2.

Importante: con dos clientes, **las reglas de negocio deben vivir en la base de datos o en funciones del backend, nunca solo en el frontend**, o la web y la app terminarán validando distinto.

## 3. Microservicios: mi opinión honesta

Para este MVP (3 módulos, 3 personas, 14 semanas, un solo cliente institucional) los microservicios clásicos traen más costo que beneficio:

- **Atomicidad**: crear una reserva necesita, en la misma transacción, saber si el espacio está activo (RN03), si hay cruce (RN01) y si el correo es externo (RN05). Si Espacios, Reservas y Usuarios son servicios con bases de datos separadas, esa validación deja de ser atómica y RNF04 se vuelve difícil de garantizar (habría que usar sagas o compensaciones).
- **Supabase es una sola base de datos Postgres** por proyecto. "Un microservicio por base de datos" implicaría varios proyectos Supabase, varias autenticaciones y sincronización entre ellos.
- **Carga operativa**: despliegues, comunicación entre servicios, trazas, versionado de contratos. El propio acta justificó el monolito para evitar "la sobrecarga operativa de una API desacoplada en esta primera fase".
- **Riesgo R04 (curva de aprendizaje)** crece mucho.

## 4. Arquitectura recomendada

**Monolito modular sobre Supabase, con servicios por dominio en Edge Functions.** Es decir, microservicios "ligeros" que respetan la frontera de cada dominio sin partir la base de datos:

```
            ┌───────────── Web (HTML/CSS/JS + Bootstrap) ──── Admin, Coordinador, Solicitante
 Clientes ──┤
            └───────────── App React Native (Expo) ────────── Solicitante (MVP) · Supervisor (Fase 2)
                                    │
                         supabase-js (Auth + REST + Realtime)
                                    │
 Supabase ─┬─ Auth (roles: admin, coordinador, logistica · OTP para solicitantes)
           ├─ Edge Functions por dominio:
           │     • svc-espacios      (CRUD espacios, ítems, estado mantenimiento)
           │     • svc-reservas      (radicar, cancelar, enrutar aprobación RF04/RN05)
           │     • svc-aprobaciones  (aprobar/rechazar con motivo)
           │     • svc-notificaciones (correo al aprobar/rechazar; Fase 2 reportes)
           └─ Postgres, un esquema por dominio: espacios · reservas · usuarios
                 + exclusion constraint, CHECKs, triggers y RLS (las reglas viven aquí)
```

Por qué así:
- Cada dominio tiene su código, su esquema y su función, se puede asignar a un integrante y desplegar por separado. Eso permite **defender "arquitectura orientada a servicios" ante el docente** con argumentos.
- La regla crítica (cero solapamiento) queda en la base de datos, atómica, igual para web y app.
- Si en Fase 2 un dominio crece (por ejemplo, reportes o supervisión), se puede extraer a un servicio independiente con su propia base sin reescribir lo demás.

Si el curso **exige** microservicios con bases separadas, propondría como máximo separar **Notificaciones/Reportes** (que no necesitan atomicidad con reservas) y mantener Espacios + Reservas + Usuarios juntos.

## 5. Inconsistencias del acta que conviene corregir ya

Independientes del stack, pero las encontré al leerla completa:

1. **Enrutamiento por correo externo**: está en "fuera de alcance" (Fase 2), pero RF04, RN05 y el escenario 1 de HU03 lo exigen. Hay que decidir si va en el MVP.
2. **Solicitante con o sin login**: RNF01 dice que no necesita cuenta, pero el escenario 1 de HU01 dice "solicitante autenticado". (La propuesta de OTP de la sección 1 resuelve ambas.)
3. **Roles del MVP**: el alcance dice "Solicitante y Administrador", pero RF04 necesita al Coordinador. RNF01 pide login para Logística, que está fuera de alcance.
4. **RF06 (check-in/out) y RF07 (reportes)** aparecen como requerimientos y criterios (HU04, HU05) pero están excluidos del MVP. Marcarlos explícitamente como Fase 2.
5. **Estados del espacio**: "Disponible / No disponible / En mantenimiento" en el alcance vs. "Activo / En mantenimiento" en RF01.
6. **Estados de la reserva**: el ciclo de vida tiene 4 estados, pero HU04 usa "Finalizada - Conforme", que no existe en la lista.
7. **Rendimiento**: RNF03 dice 3 s, los criterios de éxito dicen 2 s.

## 6. Secciones del acta que cambian con el nuevo stack

- **Tecnología propuesta**: PHP → Supabase (Postgres, Auth, Edge Functions en TypeScript/Deno); MySQL → PostgreSQL; agregar React Native (Expo). Git/GitHub y Postman siguen igual (Postman sirve para la API REST de Supabase y las Edge Functions).
- **Arquitectura**: reemplazar "monolito MVC en PHP" por la de la sección 4.
- **RNF06**: dejar de decir "100 % web" si entra la app móvil.
- **RNF08**: reescribir sin MVC/PHP/MySQL.
- **Riesgos**: actualizar R03 (ahora Postgres) y R04 (curva de Supabase, React Native y Edge Functions); agregar riesgo de pausa del plan gratuito y de dos frontends.
- **Cronograma**: semanas 3–4 (modelo en Postgres, políticas RLS), 5–7 (se acorta: Auth ya viene hecho, ese tiempo se puede pasar a la app móvil).
- **Criterios de éxito**: "algoritmo en PHP/MySQL", "patrón MVC" y "DDL MySQL con InnoDB" deben cambiar a Postgres/Supabase.

## 7. Siguiente paso sugerido

1. Decidir el alcance de React Native (recomiendo opción 2: solo flujo del Solicitante).
2. Confirmar con el docente si "monolito modular + Edge Functions por dominio" satisface el requisito de microservicios.
3. Ajustar el acta (secciones 5 y 6).
4. Empezar por el modelo de datos en Postgres con la restricción de exclusión, que es el corazón del sistema.
