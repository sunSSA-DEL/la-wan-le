import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, MEDAL_LEVELS } from './constants';

export interface PoopRecord {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  date: string;
  shape: number;
  smoothness: number;
  feeling: string[];
  note: string;
}

export interface TimerState {
  startTime: number;
  isRunning: boolean;
}

export interface UserProfile {
  avatarUrl: string;
  nickName: string;
}

export interface Stats {
  totalCount: number;
  avgDuration: number;
  mostCommonShape: number;
  streak: number;
  topFeelings: string[];
  commonShapeName: string;
}

function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `${ts}-${rand}`;
}

// ========== 记录 CRUD ==========

export async function getRecords(): Promise<PoopRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.RECORDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveRecords(records: PoopRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('保存记录失败:', e);
  }
}

export async function addRecord(record: Omit<PoopRecord, 'id'>): Promise<PoopRecord> {
  const records = await getRecords();
  const newRecord: PoopRecord = { ...record, id: generateId() };
  records.push(newRecord);
  await saveRecords(records);
  return newRecord;
}

export async function updateRecord(id: string, updates: Partial<PoopRecord>): Promise<boolean> {
  const records = await getRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx !== -1) {
    records[idx] = { ...records[idx], ...updates };
    await saveRecords(records);
    return true;
  }
  return false;
}

export async function deleteRecord(id: string): Promise<boolean> {
  const records = await getRecords();
  const filtered = records.filter(r => r.id !== id);
  if (filtered.length !== records.length) {
    await saveRecords(filtered);
    return true;
  }
  return false;
}

export async function getRecordsByDate(date: string): Promise<PoopRecord[]> {
  const records = await getRecords();
  return records.filter(r => r.date === date);
}

export async function getRecordDates(): Promise<Set<string>> {
  const records = await getRecords();
  const dates = new Set<string>();
  records.forEach(r => dates.add(r.date));
  return dates;
}

export async function getLastRecordDate(): Promise<string | null> {
  const records = await getRecords();
  if (records.length === 0) return null;
  const sorted = [...records].sort((a, b) => b.endTime - a.endTime);
  return sorted[0].date;
}

export async function getRecordCount(): Promise<number> {
  const records = await getRecords();
  return records.length;
}

export async function getTotalUniqueDays(): Promise<number> {
  const records = await getRecords();
  const dates = new Set(records.map(r => r.date));
  return dates.size;
}

export async function getMedalInfo() {
  const totalDays = await getTotalUniqueDays();

  let currentMedal: typeof MEDAL_LEVELS[0] | null = null;
  let nextMedal: typeof MEDAL_LEVELS[0] | null = null;

  for (const medal of MEDAL_LEVELS) {
    if (totalDays >= medal.days) {
      currentMedal = medal;
    } else {
      nextMedal = medal;
      break;
    }
  }

  const claimed = await getClaimedMedals();
  return { totalDays, currentMedal, nextMedal, claimed };
}

async function getClaimedMedals(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CLAIMED_MEDALS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function claimMedal(level: string): Promise<boolean> {
  const claimed = await getClaimedMedals();
  if (claimed.includes(level)) return false;
  claimed.push(level);
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CLAIMED_MEDALS, JSON.stringify(claimed));
    return true;
  } catch {
    return false;
  }
}

// ========== 计时器持久化 ==========

export async function saveTimerState(startTime: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify({
      startTime,
      isRunning: true,
    }));
  } catch (e) {
    console.error('保存计时状态失败:', e);
  }
}

export async function getTimerState(): Promise<TimerState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TIMER_STATE);
    if (raw) {
      const state: TimerState = JSON.parse(raw);
      if (state.isRunning) return state;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearTimerState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
  } catch (e) {
    console.error('清除计时状态失败:', e);
  }
}

// ========== 用户信息 ==========

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('保存用户信息失败:', e);
  }
}

// ========== 统计数据 ==========

export async function getStats(): Promise<Stats | null> {
  const records = await getRecords();
  if (records.length === 0) return null;

  const totalCount = records.length;
  const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);
  const avgDuration = Math.round(totalDuration / totalCount);

  const shapeCount: { [key: number]: number } = {};
  records.forEach(r => {
    shapeCount[r.shape] = (shapeCount[r.shape] || 0) + 1;
  });
  let mostCommonShape = 4;
  let maxCount = 0;
  Object.entries(shapeCount).forEach(([shape, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonShape = Number(shape);
    }
  });

  const dates = [...new Set(records.map(r => r.date))].sort().reverse();
  let streak = dates.length > 0 ? 1 : 0;
  for (let i = 0; i < dates.length - 1; i++) {
    const d1 = new Date(dates[i]);
    const d2 = new Date(dates[i + 1]);
    const diff = Math.round((d1.getTime() - d2.getTime()) / 86400000);
    if (diff === 1) streak++;
    else break;
  }

  const feelingCount: { [key: string]: number } = {};
  records.forEach(r => {
    (r.feeling || []).forEach(f => {
      feelingCount[f] = (feelingCount[f] || 0) + 1;
    });
  });
  const topFeelings = Object.entries(feelingCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(e => e[0]);

  return { totalCount, avgDuration, mostCommonShape, streak, topFeelings, commonShapeName: '' };
}
