import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  Image,
} from 'react-native';
import { BRISTOL_TYPES, SMOOTHNESS_OPTIONS, WARNING_DAYS } from '@/utils/constants';
import { getRecordDates, getRecordsByDate, getLastRecordDate, PoopRecord } from '@/utils/storage';
import { getMonthGrid, getTodayStr, daysBetween, formatDuration } from '@/utils/calendar';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const COLORS = {
  bg: '#FFF8F0',
  card: '#FFFFFF',
  primary: '#C8956C',
  accent: '#E8B88A',
  textPrimary: '#4A3728',
  textSecondary: '#8B7355',
  warning: '#F0C78E',
};

const POOP_ICONS = [
  require('@/assets/poop-icons/icon-1.png'),
  require('@/assets/poop-icons/icon-2.png'),
  require('@/assets/poop-icons/icon-3.png'),
  require('@/assets/poop-icons/icon-4.png'),
  require('@/assets/poop-icons/icon-5.png'),
  require('@/assets/poop-icons/icon-6.png'),
  require('@/assets/poop-icons/icon-7.png'),
  require('@/assets/poop-icons/icon-8.png'),
  require('@/assets/poop-icons/icon-9.png'),
  require('@/assets/poop-icons/icon-10.png'),
  require('@/assets/poop-icons/icon-11.png'),
  require('@/assets/poop-icons/icon-12.png'),
  require('@/assets/poop-icons/icon-13.png'),
  require('@/assets/poop-icons/icon-14.png'),
  require('@/assets/poop-icons/icon-15.png'),
  require('@/assets/poop-icons/icon-16.png'),
];

function getIconIndex(date: string): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = ((hash << 5) - hash) + date.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 16;
}

const shapeMap: Record<number, typeof BRISTOL_TYPES[0]> = {};
BRISTOL_TYPES.forEach(s => { shapeMap[s.value] = s; });
const smoothnessMap: Record<number, typeof SMOOTHNESS_OPTIONS[0]> = {};
SMOOTHNESS_OPTIONS.forEach(s => { smoothnessMap[s.value] = s; });

export default function CalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthTitle, setMonthTitle] = useState('');
  const [calendarGrid, setCalendarGrid] = useState<any[]>([]);
  const [recordDates, setRecordDates] = useState<Record<string, boolean>>({});
  const [showWarning, setShowWarning] = useState(false);
  const [warningDays, setWarningDays] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRecords, setSelectedRecords] = useState<PoopRecord[]>([]);
  const [warnAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (showWarning) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(warnAnim, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
          Animated.timing(warnAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [showWarning]);

  const loadCalendar = useCallback(async () => {
    const monthData = getMonthGrid(year, month);
    setMonthTitle(monthData.title);
    setCalendarGrid(monthData.grid);

    const dates = await getRecordDates();
    const rd: Record<string, boolean> = {};
    dates.forEach(d => { rd[d] = true; });
    setRecordDates(rd);

    const lastDate = await getLastRecordDate();
    if (lastDate) {
      const today = getTodayStr();
      const diff = daysBetween(today, lastDate);
      if (diff >= WARNING_DAYS) {
        setShowWarning(true);
        setWarningDays(diff);
      } else {
        setShowWarning(false);
      }
    }
  }, [year, month]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const onPrevMonth = () => {
    setShowDetail(false);
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const onNextMonth = () => {
    setShowDetail(false);
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const onTapDate = async (date: string) => {
    if (!date) return;
    const records = await getRecordsByDate(date);
    setSelectedDate(date);
    setSelectedRecords(records);
    setShowDetail(true);
  };

  return (
    <View style={styles.container}>
      {/* 警告横幅 */}
      {showWarning && (
        <Animated.View style={[styles.warningBanner, { opacity: warnAnim }]}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>你已经{warningDays}天没拉臭臭了，注意饮食哦！</Text>
        </Animated.View>
      )}

      {/* 月份切换 */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={onPrevMonth} hitSlop={8}>
          <Text style={styles.monthArrow}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthTitle}</Text>
        <TouchableOpacity onPress={onNextMonth} hitSlop={8}>
          <Text style={styles.monthArrow}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* 星期头 */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map(w => (
          <View key={w} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{w}</Text>
          </View>
        ))}
      </View>

      {/* 日历网格 */}
      <View style={styles.calendarGrid}>
        {calendarGrid.map((week: any[], wi: number) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((cell: any, ci: number) => (
              <TouchableOpacity
                key={ci}
                style={[
                  styles.dayCell,
                  !cell && styles.dayEmpty,
                  cell?.isToday && styles.dayToday,
                ]}
                onPress={() => onTapDate(cell?.date || '')}
                activeOpacity={cell ? 0.6 : 1}
                disabled={!cell}
              >
                {cell && (
                  <>
                    <Text style={[styles.dayNum, cell.isToday && styles.dayNumToday]}>
                      {cell.day}
                    </Text>
                    {recordDates[cell.date] && (
                      <Image source={POOP_ICONS[getIconIndex(cell.date)]} style={styles.dayIcon} />
                    )}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* 底部详情弹窗 */}
      <Modal
        visible={showDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetail(false)}
      >
        <View style={styles.detailMask}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailDate}>{selectedDate}</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)} hitSlop={8}>
                <Text style={styles.detailClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedRecords.length > 0 ? (
              <ScrollView style={styles.detailList}>
                {selectedRecords.map(record => (
                  <View key={record.id} style={styles.recordItem}>
                    <View style={styles.recordTop}>
                      <Text style={styles.recordShape}>
                        {(record.shape || []).map((s: number) => shapeMap[s]?.emoji + ' ' + shapeMap[s]?.label).join('、')}
                      </Text>
                      <Text style={styles.recordDuration}>{formatDuration(record.duration)}</Text>
                    </View>
                    <View style={styles.recordMid}>
                      <Text style={styles.recordSmoothness}>
                        {smoothnessMap[record.smoothness]?.emoji} {smoothnessMap[record.smoothness]?.label}
                      </Text>
                    </View>
                    {record.feeling.length > 0 && (
                      <View style={styles.recordFeelings}>
                        {record.feeling.map((f: string) => (
                          <View key={f} style={styles.feelingTagSm}>
                            <Text style={styles.feelingTagSmText}>{f}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {record.note ? <Text style={styles.recordNote}>{record.note}</Text> : null}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.detailEmpty}>
                <Text style={styles.detailEmptyText}>当天没有记录</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  warningIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 5,
  },
  monthArrow: {
    fontSize: 16,
    color: COLORS.primary,
    padding: 5,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  weekdayText: {
    fontSize: 17,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  calendarGrid: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    borderRadius: 6,
  },
  dayEmpty: {
    opacity: 0,
  },
  dayToday: {
    backgroundColor: 'rgba(200, 149, 108, 0.12)',
  },
  dayNum: {
    fontSize: 21,
    color: COLORS.textPrimary,
    fontWeight: '400',
  },
  dayNumToday: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  dayIcon: {
    width: 24,
    height: 24,
    marginTop: 4,
    resizeMode: 'contain',
  },
  detailMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  detailCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 30,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailDate: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  detailClose: {
    fontSize: 16,
    color: COLORS.textSecondary,
    padding: 4,
  },
  detailList: {
    maxHeight: '90%',
  },
  recordItem: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recordTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordShape: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  recordDuration: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  recordMid: {
    marginBottom: 5,
  },
  recordSmoothness: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  recordFeelings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  feelingTagSm: {
    backgroundColor: COLORS.accent,
    borderRadius: 25,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  feelingTagSmText: {
    fontSize: 11,
    color: '#fff',
  },
  recordNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  detailEmpty: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  detailEmptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
