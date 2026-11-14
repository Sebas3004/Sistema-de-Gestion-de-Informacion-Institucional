import { defaults, types } from 'pg';

/* =========================================================
   FECHAS EN UTC CON EL DRIVER pg

   Las columnas son "timestamp without time zone". La
   convención del sistema es guardarlas SIEMPRE en UTC:

   - now() (CreateDateColumn/UpdateDateColumn) usa la zona
     de la sesión, que se fija en UTC (extra.options en la
     configuración de TypeORM).
   - Por defecto, pg interpreta esas columnas en la zona
     horaria del proceso Node y serializa los Date en esa
     misma zona. Con Node en America/Costa_Rica (backend
     local en Windows) eso desfasaba 6 horas las fechas
     generadas por la base respecto de las generadas por la
     aplicación (p. ej. closedAt = new Date()).

   Este módulo hace que pg lea y escriba esas columnas en
   UTC sin importar la zona de la máquina. En Docker (Node
   en UTC) el comportamiento no cambia.

   Debe importarse antes de abrir cualquier conexión
   (primera línea de main.ts y seed.ts).
========================================================= */

/* OID de "timestamp without time zone" */
const TIMESTAMP_OID = 1114;

const TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?$/;

export const POSTGRES_UTC_SESSION = '-c TimeZone=UTC';

types.setTypeParser(TIMESTAMP_OID, (value: string) => {
  const match = TIMESTAMP_PATTERN.exec(value);

  /* infinity, fechas BC, etc.: se devuelven tal cual */
  if (!match) {
    return value;
  }

  const [, year, month, day, hour, minute, second, fraction = '0'] = match;

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Math.floor(Number(fraction.padEnd(6, '0')) / 1000),
    ),
  );
});

/* Los Date enviados como parámetros se serializan en UTC */
defaults.parseInputDatesAsUTC = true;
