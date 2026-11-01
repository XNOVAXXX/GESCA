-- Fija el search_path de la función de trigger (advertencia 0011 del linter de Supabase).
alter function espacios.marcar_actualizado() set search_path = '';
