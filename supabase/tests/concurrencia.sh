#!/usr/bin/env bash
# RNF04: dos solicitudes simultáneas para la misma franja; solo una debe quedar registrada.
# Uso: ./concurrencia.sh "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
set -euo pipefail
DB="${1:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
PSQL=(psql "$DB" -v ON_ERROR_STOP=1 -q -t -A)

"${PSQL[@]}" <<'SQL'
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000c0c0', 'concurrencia@pascualbravo.edu.co')
  on conflict do nothing;
insert into espacios.espacios (id, nombre, tipo, capacidad_max)
  values ('c0000000-0000-0000-0000-00000000c0c0', 'Prueba de concurrencia', 'auditorio', 10)
  on conflict do nothing;
delete from reservas.reservas where espacio_id = 'c0000000-0000-0000-0000-00000000c0c0';
SQL

radicar() {
  "${PSQL[@]}" <<'SQL' 2>&1 || true
begin;
insert into reservas.reservas (espacio_id, responsable_id, franja, motivo_uso)
values ('c0000000-0000-0000-0000-00000000c0c0', '00000000-0000-0000-0000-00000000c0c0',
        tstzrange(date_trunc('hour', now()) + interval '2 days', date_trunc('hour', now()) + interval '2 days 1 hour'),
        'Concurrencia');
select pg_sleep(2);  -- ambas transacciones quedan abiertas al mismo tiempo
commit;
SQL
}

radicar > /tmp/gesca_conc_1.log & radicar > /tmp/gesca_conc_2.log & wait

TOTAL=$("${PSQL[@]}" -c "select count(*) from reservas.reservas where espacio_id = 'c0000000-0000-0000-0000-00000000c0c0'")
"${PSQL[@]}" -c "delete from reservas.reservas where espacio_id = 'c0000000-0000-0000-0000-00000000c0c0';
                 delete from espacios.espacios where id = 'c0000000-0000-0000-0000-00000000c0c0';
                 delete from auth.users where id = '00000000-0000-0000-0000-00000000c0c0';"

cat /tmp/gesca_conc_1.log /tmp/gesca_conc_2.log | grep -i "error" || true
if [ "$TOTAL" = "1" ]; then
  echo "OK: de 2 solicitudes simultáneas solo 1 quedó registrada."
else
  echo "FALLO: quedaron $TOTAL reservas en la misma franja." && exit 1
fi
