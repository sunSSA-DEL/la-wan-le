export interface DayCell {
  day: number;
  date: string;
  isToday: boolean;
}

export interface MonthData {
  year: number;
  month: number;
  grid: (DayCell | null)[][];
  title: string;
}

// 获取指定年月的日历网格数据
export function getMonthGrid(year: number, month: number): MonthData {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const grid: (DayCell | null)[][] = [];
  let day = 1;

  for (let row = 0; row < 6; row++) {
    const week: (DayCell | null)[] = [];
    for (let col = 0; col < 7; col++) {
      if (row === 0 && col < startDayOfWeek) {
        week.push(null);
      } else if (day > daysInMonth) {
        week.push(null);
      } else {
        week.push({
          day,
          date: formatDate(year, month, day),
          isToday: isToday(year, month, day),
        });
        day++;
      }
    }
    grid.push(week);
    if (day > daysInMonth) break;
  }

  return {
    year,
    month,
    grid,
    title: `${year}年${month}月`,
  };
}

// 格式化为 YYYY-MM-DD
export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// 判断是否为今天
export function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return (
    now.getFullYear() === year &&
    now.getMonth() + 1 === month &&
    now.getDate() === day
  );
}

// 获取今天的日期字符串
export function getTodayStr(): string {
  const now = new Date();
  return formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// 计算两个日期之间相差的天数
export function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.round((d1.getTime() - d2.getTime()) / 86400000);
}

// 格式化秒数为 X分X秒
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

// 格式化秒数为 HH:mm:ss
export function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
