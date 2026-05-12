// 布里斯托大便分类法 (Bristol Stool Chart)
export const BRISTOL_TYPES = [
  { value: 1, emoji: '🪨', label: '硬球状', desc: '分散的硬块，像坚果' },
  { value: 2, emoji: '🥖', label: '凹凸香肠状', desc: '香肠状但表面凹凸' },
  { value: 3, emoji: '🌭', label: '裂缝香肠状', desc: '香肠状表面有裂缝' },
  { value: 4, emoji: '💩', label: '光滑香肠状', desc: '光滑柔软像香肠或蛇' },
  { value: 5, emoji: '🫘', label: '软团块', desc: '边缘清晰的软团块' },
  { value: 6, emoji: '🍦', label: '糊状', desc: '边缘不齐的糊状' },
  { value: 7, emoji: '💧', label: '水样', desc: '完全水样无固体' },
];

// 顺畅度选项
export const SMOOTHNESS_OPTIONS = [
  { value: 1, emoji: '😊', label: '顺畅' },
  { value: 2, emoji: '😐', label: '一般' },
  { value: 3, emoji: '😫', label: '费劲' },
];

// 拉后感多选标签
export const FEELING_TAGS = [
  '一身轻', '腿麻了', '纸不够', '肚子还疼',
  '没拉干净', '拉完还想拉', '肚子咕咕叫', '菊花疼',
];

// 计时器状态
export const TIMER_STATE = {
  IDLE: 'IDLE',
  TIMING: 'TIMING',
} as const;

// Storage 键名
export const STORAGE_KEYS = {
  RECORDS: 'diary_records',
  TIMER_STATE: 'timer_state',
  USER_PROFILE: 'user_profile',
  CLAIMED_MEDALS: 'claimed_medals',
};

// 3天未排便警告阈值
export const WARNING_DAYS = 3;

// 打卡奖牌机制
export const MEDAL_LEVELS = [
  { level: 'bronze', days: 30, emoji: '🥉', name: '铜牌奖章', color: '#CD7F32', bg: '#FDF0E6' },
  { level: 'silver', days: 100, emoji: '🥈', name: '银牌奖章', color: '#A8A8A8', bg: '#F5F5F5' },
  { level: 'gold', days: 365, emoji: '🥇', name: '金牌奖章', color: '#D4A017', bg: '#FFFDE8' },
];
