export const ISTANBUL_TZ = 'Europe/Istanbul';

const dtf = new Intl.DateTimeFormat('en-CA', {
  timeZone: ISTANBUL_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** YYYY-MM-DD for the given instant in Europe/Istanbul. */
export function istanbulLocalDate(at: Date | number): string {
  return dtf.format(typeof at === 'number' ? new Date(at) : at);
}

export const iso = (d: Date | number | null | undefined): string | null =>
  d == null ? null : new Date(d).toISOString();
