// Texto que se le muestra al usuario cuando algo falla.
export function mensajeDe(error: unknown, porDefecto: string): string {
  return error instanceof Error ? error.message : porDefecto;
}
