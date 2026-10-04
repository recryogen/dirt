export type CrosswordDirection = 'across' | 'down';

export interface CrosswordWord {
  answer: string;
  clue: string;
  topic: string;
}

export interface PlacedWord extends CrosswordWord {
  row: number;
  col: number;
  direction: CrosswordDirection;
  number: number;
}

export interface CrosswordPuzzle {
  date: string;
  rows: number;
  cols: number;
  words: PlacedWord[];
  solution: Map<string, string>;
  numbers: Map<string, number>;
}

const BANK: CrosswordWord[] = [
  { answer: 'БАЛКА', clue: 'Стержневой элемент, работающий преимущественно на изгиб.', topic: 'Механика' },
  { answer: 'ФЕРМА', clue: 'Стержневая система с узловым приложением нагрузок.', topic: 'Механика' },
  { answer: 'МОДУЛЬ', clue: 'Величина E в законе Гука.', topic: 'Сопромат' },
  { answer: 'ИЗГИБ', clue: 'Деформация, при которой ось бруса искривляется.', topic: 'Сопромат' },
  { answer: 'КРУЧЕНИЕ', clue: 'Нагружение стержня моментом вокруг его продольной оси.', topic: 'Сопромат' },
  { answer: 'СДВИГ', clue: 'Деформация от касательных напряжений.', topic: 'Сопромат' },
  { answer: 'ПУАССОН', clue: 'Учёный, чьим именем назван коэффициент поперечной деформации.', topic: 'Сопромат' },
  { answer: 'ТВЕРДОСТЬ', clue: 'Сопротивление материала внедрению более твёрдого тела.', topic: 'Материалы' },
  { answer: 'УСТАЛОСТЬ', clue: 'Разрушение от многократно повторяющихся нагрузок.', topic: 'Материалы' },
  { answer: 'ПОЛЗУЧЕСТЬ', clue: 'Рост деформации во времени при постоянной нагрузке.', topic: 'Материалы' },
  { answer: 'ДЮРАЛЬ', clue: 'Разговорное название прочного алюминиевого сплава.', topic: 'Материалы' },
  { answer: 'ТИТАН', clue: 'Лёгкий коррозионностойкий металл, широко применяемый в авиации.', topic: 'Материалы' },
  { answer: 'КОМПОЗИТ', clue: 'Материал из матрицы и армирующего наполнителя.', topic: 'Материалы' },
  { answer: 'МАТРИЦА', clue: 'Непрерывная фаза композиционного материала.', topic: 'Материалы' },
  { answer: 'ЛОНЖЕРОН', clue: 'Главный продольный силовой элемент крыла.', topic: 'Авиация' },
  { answer: 'НЕРВЮРА', clue: 'Поперечный элемент каркаса крыла.', topic: 'Авиация' },
  { answer: 'ШПАНГОУТ', clue: 'Поперечный силовой элемент фюзеляжа.', topic: 'Авиация' },
  { answer: 'СТРИНГЕР', clue: 'Продольный подкрепляющий элемент обшивки.', topic: 'Авиация' },
  { answer: 'ЭЛЕРОН', clue: 'Орган управления самолётом по крену.', topic: 'Авиация' },
  { answer: 'ТРИММЕР', clue: 'Небольшая поверхность для снятия усилий с органа управления.', topic: 'Авиация' },
  { answer: 'ФЮЗЕЛЯЖ', clue: 'Основная корпусная часть самолёта.', topic: 'Авиация' },
  { answer: 'ПИЛОН', clue: 'Узел крепления двигателя к крылу или фюзеляжу.', topic: 'Авиация' },
  { answer: 'ТЯГА', clue: 'Сила, создаваемая авиационным или ракетным двигателем.', topic: 'Космос' },
  { answer: 'СОПЛО', clue: 'Канал, преобразующий энергию газа в скорость потока.', topic: 'Космос' },
  { answer: 'ОРБИТА', clue: 'Траектория движения тела вокруг небесного объекта.', topic: 'Космос' },
  { answer: 'АПОГЕЙ', clue: 'Наиболее удалённая от Земли точка орбиты.', topic: 'Космос' },
  { answer: 'ПЕРИГЕЙ', clue: 'Ближайшая к Земле точка орбиты.', topic: 'Космос' },
  { answer: 'ИМПУЛЬС', clue: 'Произведение силы на время её действия.', topic: 'Общая инженерия' },
  { answer: 'МОМЕНТ', clue: 'Произведение силы на её плечо.', topic: 'Механика' },
  { answer: 'ВЕКТОР', clue: 'Величина, имеющая модуль и направление.', topic: 'Механика' },
  { answer: 'ДОПУСК', clue: 'Разность между предельными размерами.', topic: 'Общая инженерия' },
  { answer: 'ПОСАДКА', clue: 'Характер соединения вала и отверстия.', topic: 'Общая инженерия' },
  { answer: 'БАЗА', clue: 'Поверхность или ось, задающая положение детали при обработке или контроле.', topic: 'Общая инженерия' },
  { answer: 'ШЕРОХОВАТОСТЬ', clue: 'Совокупность микронеровностей поверхности.', topic: 'Общая инженерия' },
  { answer: 'ПОДШИПНИК', clue: 'Опора вращающегося вала или оси.', topic: 'Общая инженерия' },
  { answer: 'РЕДУКТОР', clue: 'Механизм для изменения частоты вращения и крутящего момента.', topic: 'Общая инженерия' },
  { answer: 'КЛАПАН', clue: 'Устройство управления потоком рабочей среды.', topic: 'Общая инженерия' },
  { answer: 'КАВИТАЦИЯ', clue: 'Образование и схлопывание пузырьков пара в жидкости.', topic: 'Общая инженерия' },
  { answer: 'ВЯЗКОСТЬ', clue: 'Свойство среды сопротивляться сдвигу слоёв.', topic: 'Общая инженерия' },
  { answer: 'ТУРБИНА', clue: 'Лопаточная машина, преобразующая энергию потока в работу.', topic: 'Общая инженерия' },
];

function hash(text: string): number {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}

function shuffled<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let state = seed || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function kyivPuzzleDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function cellKey(row: number, col: number): string { return `${row}:${col}`; }

export function createDailyCrossword(date: string): CrosswordPuzzle {
  const size = 19;
  const occupied = new Map<string, string>();
  const placed: Omit<PlacedWord, 'number'>[] = [];
  const candidates = shuffled(BANK, hash(date)).slice(0, 26);

  const canPlace = (word: string, row: number, col: number, direction: CrosswordDirection) => {
    const dr = direction === 'down' ? 1 : 0;
    const dc = direction === 'across' ? 1 : 0;
    const before = cellKey(row - dr, col - dc);
    const after = cellKey(row + dr * word.length, col + dc * word.length);
    if (occupied.has(before) || occupied.has(after)) return false;
    let intersections = 0;
    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || c < 0 || r >= size || c >= size) return false;
      const existing = occupied.get(cellKey(r, c));
      if (existing && existing !== word[i]) return false;
      if (existing) intersections++;
      if (!existing) {
        const sideA = direction === 'across' ? cellKey(r - 1, c) : cellKey(r, c - 1);
        const sideB = direction === 'across' ? cellKey(r + 1, c) : cellKey(r, c + 1);
        if (occupied.has(sideA) || occupied.has(sideB)) return false;
      }
    }
    return placed.length === 0 || intersections > 0;
  };

  const add = (entry: CrosswordWord, row: number, col: number, direction: CrosswordDirection) => {
    const dr = direction === 'down' ? 1 : 0;
    const dc = direction === 'across' ? 1 : 0;
    for (let i = 0; i < entry.answer.length; i++) occupied.set(cellKey(row + dr * i, col + dc * i), entry.answer[i]);
    placed.push({ ...entry, row, col, direction });
  };

  const first = candidates.shift()!;
  add(first, Math.floor(size / 2), Math.floor((size - first.answer.length) / 2), 'across');
  for (const entry of candidates) {
    const options: { row: number; col: number; direction: CrosswordDirection; score: number }[] = [];
    for (const base of placed) {
      const direction: CrosswordDirection = base.direction === 'across' ? 'down' : 'across';
      for (let i = 0; i < entry.answer.length; i++) for (let j = 0; j < base.answer.length; j++) {
        if (entry.answer[i] !== base.answer[j]) continue;
        const row = base.row + (base.direction === 'down' ? j : 0) - (direction === 'down' ? i : 0);
        const col = base.col + (base.direction === 'across' ? j : 0) - (direction === 'across' ? i : 0);
        if (canPlace(entry.answer, row, col, direction)) options.push({ row, col, direction, score: Math.abs(row - 9) + Math.abs(col - 9) });
      }
    }
    options.sort((a, b) => a.score - b.score);
    if (options[0]) add(entry, options[0].row, options[0].col, options[0].direction);
    if (placed.length >= 10) break;
  }

  const minRow = Math.min(...placed.map((word) => word.row));
  const minCol = Math.min(...placed.map((word) => word.col));
  const shifted = placed.map((word) => ({ ...word, row: word.row - minRow, col: word.col - minCol }));
  const starts = [...new Set(shifted.map((word) => cellKey(word.row, word.col)))].sort((a, b) => {
    const [ar, ac] = a.split(':').map(Number); const [br, bc] = b.split(':').map(Number);
    return ar - br || ac - bc;
  });
  const numbers = new Map(starts.map((key, index) => [key, index + 1]));
  const words: PlacedWord[] = shifted.map((word) => ({ ...word, number: numbers.get(cellKey(word.row, word.col))! }));
  const solution = new Map<string, string>();
  for (const word of words) for (let i = 0; i < word.answer.length; i++) {
    solution.set(cellKey(word.row + (word.direction === 'down' ? i : 0), word.col + (word.direction === 'across' ? i : 0)), word.answer[i]);
  }
  const rows = Math.max(...words.map((word) => word.row + (word.direction === 'down' ? word.answer.length : 1)));
  const cols = Math.max(...words.map((word) => word.col + (word.direction === 'across' ? word.answer.length : 1)));
  return { date, rows, cols, words, solution, numbers };
}
