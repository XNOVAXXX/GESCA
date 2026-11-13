# Calidad del código con SonarQube

SonarQube revisa el código de GESCA y muestra bugs, vulnerabilidades, código duplicado,
"code smells" y la cobertura de las pruebas unitarias. Hay dos formas de usarlo.

## Opción 1 · SonarQube Cloud (recomendada, gratis para repos públicos)

Se configura una sola vez y después analiza solo cada PR y cada push a `develop` y `main`.

1. Entra a https://sonarcloud.io y dale **Log in with GitHub** con la cuenta dueña del repo (XNOVAXXX).
2. **+ → Analyze new project** → elige la organización `xnovaxxx` (créala si te la pide, plan *Free*)
   → marca el repo **GESCA** → **Set up**.
3. Cuando pregunte por el método de análisis, elige **With GitHub Actions** (no "Automatic Analysis").
   Te muestra un token: cópialo.
4. En GitHub: **GESCA → Settings → Secrets and variables → Actions → New repository secret**
   - Name: `SONAR_TOKEN`
   - Secret: el token que copiaste
5. Haz cualquier push. El job **SonarQube (calidad del código)** del CI sube el análisis y el
   resultado aparece en SonarQube Cloud y como comentario en el PR.

Si la organización o la clave del proyecto que te asigna SonarQube Cloud son distintas a
`xnovaxxx` / `XNOVAXXX_GESCA`, cámbialas en `sonar-project.properties`.

Mientras no exista el secreto `SONAR_TOKEN`, el job se salta solo y el CI sigue en verde.

## Opción 2 · SonarQube local con Docker

Sirve para revisar el código en tu PC sin crear cuentas. Necesita Docker Desktop y unos 2 GB de RAM libres.

```
docker compose --profile calidad up -d sonarqube
```

1. Abre http://localhost:9000 (tarda un par de minutos la primera vez) y entra con `admin` / `admin`;
   te pide cambiar la contraseña.
2. **Create a local project** → Project key `XNOVAXXX_GESCA` → rama `develop` → **Locally**
   → genera un token y cópialo.
3. Genera la cobertura y corre el escáner desde la carpeta `GESCA` (en PowerShell):

```
cd app
npm.cmd run test:coverage
cd ..
docker run --rm -e SONAR_HOST_URL=http://host.docker.internal:9000 -e SONAR_TOKEN=EL_TOKEN -v "${PWD}:/usr/src" sonarsource/sonar-scanner-cli -Dsonar.organization=
```

Al terminar, el resultado aparece en http://localhost:9000.

Para apagarlo: `docker compose --profile calidad down`.

## Qué analiza

| Qué | Dónde |
|---|---|
| App (TypeScript / React Native) | `app/src` |
| Base de datos (SQL) | `supabase/migrations` |
| Edge Functions | `supabase/functions` |
| Cobertura de pruebas unitarias | `app/coverage/lcov.info` (la genera `npm run test:coverage`) |

La cobertura no cuenta las vistas, los estilos ni las rutas, porque solo conectan piezas; se mide
sobre los hooks, las reglas y los `*.api.ts`, que es donde está la lógica.
