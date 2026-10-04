export interface CalendarEvent {
  id: string;
  start: Date;
  end: Date;
  title: string;
  description: string;
  location: string;
}

const KYIV = 'Europe/Kyiv';

function unescapeIcal(value: string): string {
  return value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();
}

function parseIcalDate(value: string): Date | null {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!match) return null;
  const [, y, m, d, h, min, sec, z] = match;
  if (z === 'Z') return new Date(Date.UTC(+y, +m - 1, +d, +h, +min, +sec));
  return new Date(+y, +m - 1, +d, +h, +min, +sec);
}

export function parseCalendar(text: string): CalendarEvent[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const blocks = unfolded.split('BEGIN:VEVENT').slice(1);
  const events: CalendarEvent[] = [];
  for (const block of blocks) {
    const values = new Map<string, string>();
    for (const line of block.split(/\r?\n/)) {
      const colon = line.indexOf(':');
      if (colon < 0) continue;
      values.set(line.slice(0, colon).split(';')[0].toUpperCase(), line.slice(colon + 1));
    }
    const start = parseIcalDate(values.get('DTSTART') ?? '');
    const end = parseIcalDate(values.get('DTEND') ?? '');
    if (!start || !end) continue;
    events.push({
      id: values.get('UID') ?? `${start.toISOString()}-${events.length}`,
      start,
      end,
      title: unescapeIcal(values.get('SUMMARY') ?? 'Без названия'),
      description: unescapeIcal(values.get('DESCRIPTION') ?? ''),
      location: unescapeIcal(values.get('LOCATION') ?? ''),
    });
  }
  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function kyivDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: KYIV, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function twoWeekDateKeys(now: Date): string[] {
  const today = kyivDateKey(now);
  const [year, month, day] = today.split('-').map(Number);
  const pseudoToday = new Date(Date.UTC(year, month - 1, day));
  const mondayOffset = (pseudoToday.getUTCDay() + 6) % 7;
  const monday = new Date(pseudoToday);
  monday.setUTCDate(monday.getUTCDate() - mondayOffset);
  return Array.from({ length: 14 }, (_, index) => {
    const value = new Date(monday);
    value.setUTCDate(value.getUTCDate() + index);
    return value.toISOString().slice(0, 10);
  });
}

export function formatCalendarTime(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', { timeZone: KYIV, hour: '2-digit', minute: '2-digit' }).format(date);
}

export function formatDayLabel(key: string): { weekday: string; date: string } {
  const date = new Date(`${key}T12:00:00Z`);
  return {
    weekday: new Intl.DateTimeFormat('ru-RU', { weekday: 'long', timeZone: 'UTC' }).format(date),
    date: new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(date),
  };
}
