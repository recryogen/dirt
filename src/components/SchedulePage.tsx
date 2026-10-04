import { useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../services/database';
import type { UserCalendar } from '../types';
import { formatCalendarTime, formatDayLabel, kyivDateKey, parseCalendar, twoWeekDateKeys } from '../utils/ical';

interface Props { now: Date; onError: (message: string) => void; }

export default function SchedulePage({ now, onError }: Props) {
  const [calendar, setCalendar] = useState<UserCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void api.loadCalendar().then(setCalendar).catch(() => onError('Не удалось загрузить расписание.')).finally(() => setLoading(false));
  }, [onError]);

  const events = useMemo(() => calendar ? parseCalendar(calendar.ics_text) : [], [calendar]);
  const days = useMemo(() => twoWeekDateKeys(now), [now]);
  const today = kyivDateKey(now);
  const visibleEvents = useMemo(() => {
    const visibleDays = new Set(days);
    return events.filter((event) => visibleDays.has(kyivDateKey(event.start)));
  }, [days, events]);
  const timeSlots = useMemo(() => [...new Set(visibleEvents.map((event) => formatCalendarTime(event.start)))].sort(), [visibleEvents]);
  const weeks = useMemo(() => [days.slice(0, 7), days.slice(7, 14)], [days]);

  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.ics') || file.size > 2_000_000) {
      onError('Нужен файл .ics размером не больше 2 МБ.');
      return;
    }
    const text = await file.text();
    if (!text.includes('BEGIN:VCALENDAR') || !text.includes('BEGIN:VEVENT')) {
      onError('Файл не похож на календарь iCalendar.');
      return;
    }
    setSaving(true);
    try {
      await api.saveCalendar(file.name, text);
      setCalendar(await api.loadCalendar());
    } catch {
      onError('Не удалось сохранить расписание.');
    } finally {
      setSaving(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    if (!window.confirm('Удалить ваше расписание?')) return;
    setSaving(true);
    try { await api.deleteCalendar(); setCalendar(null); }
    catch { onError('Не удалось удалить расписание.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="notice notice--plain">Загружаем расписание…</div>;

  return (
    <section className="page-window">
      <div className="window-titlebar"><h2 className="window-titlebar__text">РАСПИСАНИЕ: ТЕКУЩАЯ И СЛЕДУЮЩАЯ НЕДЕЛЯ</h2></div>
      <div className="schedule-toolbar">
        <input ref={inputRef} className="file-input" type="file" accept=".ics,text/calendar" onChange={(e) => void upload(e.target.files?.[0])} disabled={saving} />
        <button className="btn btn--primary" type="button" onClick={() => inputRef.current?.click()} disabled={saving}>{calendar ? 'Заменить .ics' : 'Загрузить .ics'}</button>
        {calendar && <button className="btn btn--danger-outline" type="button" onClick={() => void remove()} disabled={saving}>Удалить расписание</button>}
        <span className="schedule-toolbar__status">{calendar ? `Файл: ${calendar.filename}` : 'Файл ещё не загружен'}</span>
      </div>
      {!calendar ? <div className="schedule-empty">Загрузите личный файл расписания в формате .ics. Он будет виден только вам.</div> : timeSlots.length === 0 ? (
        <div className="schedule-empty">На текущую и следующую неделю занятий в файле нет.</div>
      ) : <div className="schedule-weeks">
        {weeks.map((week, weekIndex) => (
          <section className="schedule-week" key={week[0]}>
            <h3 className="schedule-week__title">{weekIndex === 0 ? 'ТЕКУЩАЯ НЕДЕЛЯ' : 'СЛЕДУЮЩАЯ НЕДЕЛЯ'}</h3>
            <div className="schedule-table-wrap">
              <table className="schedule-table">
                <thead><tr><th className="schedule-table__time-head">Время</th>{week.map((key) => {
                  const label = formatDayLabel(key);
                  return <th className={`${key === today ? 'schedule-table__today ' : ''}${week.indexOf(key) > 4 ? 'schedule-table__weekend' : ''}`} key={key}><strong>{label.weekday}</strong><span>{label.date}{key === today ? ' · сегодня' : ''}</span></th>;
                })}</tr></thead>
                <tbody>{timeSlots.map((time) => (
                  <tr key={time}>
                    <th className="schedule-table__time">{time}</th>
                    {week.map((key, dayIndex) => {
                      const cellEvents = visibleEvents.filter((event) => kyivDateKey(event.start) === key && formatCalendarTime(event.start) === time);
                      return <td className={`${key === today ? 'schedule-table__today ' : ''}${dayIndex > 4 ? 'schedule-table__weekend' : ''}`} key={key}>
                        {cellEvents.map((event) => <div className="calendar-event" key={event.id}>
                          <span className="calendar-event__title">{event.title}</span>
                          <span className="calendar-event__end">до {formatCalendarTime(event.end)}</span>
                          {(event.description || event.location) && <span className="calendar-event__details">{event.description || event.location}</span>}
                        </div>)}
                      </td>;
                    })}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        ))}
      </div>}
    </section>
  );
}
