// Reglas de separación (decisión del equipo, 11/10/2026):
//   *.view.tsx   → ESTRUCTURA: solo componentes; sin servicios, sin estilos en línea, sin colores sueltos
//   *.styles.ts  → DISEÑO: StyleSheet con tokens de src/theme; sin lógica ni servicios
//   use*.ts      → FUNCIONALIDAD: estado y llamadas a servicios; sin estilos ni tema
//   src/app/**   → RUTAS: solo unen hook + vista
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactNative = require('eslint-plugin-react-native');

const sinDatos = [
  { group: ['@/services/*', '**/services/*'], message: 'Solo los hooks (use*.ts) hablan con los servicios.' },
  { group: ['@supabase/*'], message: 'Solo src/services usa Supabase.' },
];

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', '.expo/*'] },
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
    files: ['src/**/*.styles.ts'],
    plugins: { 'react-native': reactNative },
    rules: {
      'react-native/no-color-literals': 'error',
      'no-restricted-imports': ['error', { patterns: [...sinDatos, { group: ['react', 'expo-router'], message: 'Los estilos no llevan lógica.' }] }],
    },
  },
  {
    files: ['src/**/use*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['**/*.styles', '@/theme', '@/theme/*'], message: 'La funcionalidad no conoce el diseño.' }] }],
    },
  },
  {
    files: ['src/app/**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', { patterns: sinDatos }],
    },
  },
  {
    files: ['src/services/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['@/features/*', '@/theme', '@/theme/*', 'react-native'], message: 'Los servicios no conocen la interfaz.' }] }],
    },
  },
]);
