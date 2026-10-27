// Reglas de arquitectura (decisión del equipo, 11/10/2026). Si una se rompe, el CI falla.
//
// 1. Microservicios: cada carpeta de src/microservicios/ es un dominio (usuarios, espacios, reservas)
//    con su propio esquema en Postgres. Un microservicio solo usa a otro a través de su index.ts.
//
// 2. Separación dentro de cada pantalla:
//    *.view.tsx   → ESTRUCTURA: solo componentes; sin datos, sin estilos en línea, sin colores sueltos
//    *.styles.ts  → DISEÑO: StyleSheet con tokens de compartido/tema; sin lógica
//    use*.ts      → FUNCIONALIDAD: estado, validaciones, navegación y llamadas a *.api.ts; sin diseño
//    *.api.ts     → DATOS: el único lugar que habla con Supabase
//    src/app/**   → RUTAS: solo unen hook + vista
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactNative = require('eslint-plugin-react-native');

const MICROSERVICIOS = ['usuarios', 'espacios', 'reservas'];

const sinDatos = [
  { group: ['**/*.api', '@/compartido/supabase'], message: 'Solo los hooks (use*.ts) llaman a los *.api.ts.' },
  { group: ['@supabase/*'], message: 'Solo los archivos *.api.ts usan Supabase.' },
];

const sinDiseno = [{ group: ['**/*.styles', '@/compartido/tema', '@/compartido/tema/*'], message: 'La funcionalidad no conoce el diseño.' }];

// Ningún microservicio entra a las carpetas internas de otro: solo a su index.ts.
const fronteras = {
  files: ['src/**/*.{ts,tsx}'],
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        zones: MICROSERVICIOS.flatMap((propio) =>
          MICROSERVICIOS.filter((otro) => otro !== propio).map((otro) => ({
            target: `./src/microservicios/${propio}`,
            from: `./src/microservicios/${otro}`,
            except: ['./index.ts'],
            message: `Usa '@/microservicios/${otro}' (su index.ts), no sus archivos internos.`,
          })),
        ),
      },
    ],
  },
};

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', '.expo/*'] },
  fronteras,
  {
    files: ['src/**/*.view.tsx'],
    plugins: { 'react-native': reactNative },
    rules: {
      'react-native/no-inline-styles': 'error',
      'react-native/no-color-literals': 'error',
      'no-restricted-imports': ['error', { patterns: [...sinDatos, { group: ['expo-router'], message: 'La navegación va en el hook.' }] }],
    },
  },
  {
    files: ['src/**/*.styles.ts', 'src/compartido/tema/**/*.ts'],
    plugins: { 'react-native': reactNative },
    rules: {
      'react-native/no-color-literals': 'error',
      'no-restricted-imports': ['error', { patterns: [...sinDatos, { group: ['react', 'expo-router'], message: 'Los estilos no llevan lógica.' }] }],
    },
  },
  {
    files: ['src/**/use*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [...sinDiseno, { group: ['@supabase/*', '@/compartido/supabase'], message: 'Los hooks usan los *.api.ts, no Supabase directo.' }] }],
    },
  },
  {
    files: ['src/app/**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', { patterns: sinDatos }],
    },
  },
  {
    files: ['src/**/*.api.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [...sinDiseno, { group: ['**/pantallas/*', 'react', 'react-native', 'expo-router'], message: 'Los *.api.ts no conocen la interfaz.' }] }],
    },
  },
]);
