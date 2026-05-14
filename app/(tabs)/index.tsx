import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
  AppStateStatus,
  Modal,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TIMER_STATE } from '@/utils/constants';
import { saveTimerState, getTimerState, clearTimerState } from '@/utils/storage';
import { formatTimer } from '@/utils/calendar';
import { Colors } from '@/constants/theme';

const COLORS = {
  bg: '#FFF8F0',
  card: '#FFFFFF',
  primary: '#C8956C',
  accent: '#E8B88A',
  textPrimary: '#4A3728',
  textSecondary: '#8B7355',
};

export default function TimerScreen() {
  const router = useRouter();
  const [timerState, setTimerState] = useState<string>(TIMER_STATE.IDLE);
  const [displayTime, setDisplayTime] = useState('00:00');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breatheAnim = useRef(new Animated.Value(1)).current;

  // 呼吸动画
  useEffect(() => {
    if (timerState === TIMER_STATE.TIMING) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(breatheAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      breatheAnim.setValue(1);
    }
  }, [timerState]);

  const startTicking = useCallback(() => {
    stopTicking();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setDisplayTime(formatTimer(elapsed));
    }, 500);
  }, []);

  const stopTicking = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 崩溃恢复
  const recoverTimer = useCallback(async () => {
    const state = await getTimerState();
    if (!state) return;

    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);

    if (elapsed > 86400) {
      startTimeRef.current = state.startTime;
      setShowResetDialog(true);
      return;
    }

    startTimeRef.current = state.startTime;
    setTimerState(TIMER_STATE.TIMING);
    startTicking();
  }, [startTicking]);

  useEffect(() => {
    recoverTimer();
    return () => stopTicking();
  }, []);

  // AppState 前后台切换
  useEffect(() => {
    const handleChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && timerState === TIMER_STATE.TIMING) {
        startTicking();
      } else if (nextState === 'background') {
        stopTicking();
      }
    };
    const sub = AppState.addEventListener('change', handleChange);
    return () => sub.remove();
  }, [timerState, startTicking, stopTicking]);

  const onStartTiming = async () => {
    const startTime = Date.now();
    startTimeRef.current = startTime;
    await saveTimerState(startTime);
    setTimerState(TIMER_STATE.TIMING);
    startTicking();
  };

  const onStopTiming = async () => {
    stopTicking();
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const startTime = startTimeRef.current;

    await clearTimerState();
    setTimerState(TIMER_STATE.IDLE);
    setDisplayTime('00:00');
    startTimeRef.current = 0;

    router.push(`/detail?duration=${duration}&startTime=${startTime}`);
  };

  const onConfirmContinue = () => {
    setShowResetDialog(false);
    setTimerState(TIMER_STATE.TIMING);
    startTicking();
  };

  const onConfirmReset = async () => {
    await clearTimerState();
    setShowResetDialog(false);
    setTimerState(TIMER_STATE.IDLE);
    setDisplayTime('00:00');
    startTimeRef.current = 0;
  };

  return (
    <View style={styles.container}>
      {timerState === TIMER_STATE.IDLE && (
        <View style={styles.timerContent}>
          <TouchableOpacity style={styles.idleCircle} onPress={onStartTiming} activeOpacity={0.8}>
            <Image source={require('@/assets/poop-main.webp')} style={styles.idleEmoji} />
          </TouchableOpacity>
          <Text style={styles.idleText}>开始拉屎</Text>
          <Text style={styles.idleSubText}>点击便便开始计时</Text>
        </View>
      )}

      {timerState === TIMER_STATE.TIMING && (
        <View style={styles.timerContent}>
          <Animated.View
            style={[styles.timingCircle, { transform: [{ scale: breatheAnim }] }]}
          >
            <Image source={require('@/assets/poop-main.webp')} style={styles.timingEmoji} />
          </Animated.View>
          <Text style={styles.timerDisplay}>{displayTime}</Text>
          <Text style={styles.timingHint}>正在记录中...</Text>
          <TouchableOpacity style={styles.btnStop} onPress={onStopTiming} activeOpacity={0.85}>
            <Text style={styles.btnStopText}>我拉完了</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showResetDialog} transparent animationType="fade">
        <View style={styles.dialogMask}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>检测到计时异常</Text>
            <Text style={styles.dialogMsg}>上次计时已超过24小时，是否继续计时？</Text>
            <View style={styles.dialogBtns}>
              <TouchableOpacity style={styles.dialogBtnCancel} onPress={onConfirmReset}>
                <Text style={styles.dialogBtnCancelText}>重新开始</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogBtnConfirm} onPress={onConfirmContinue}>
                <Text style={styles.dialogBtnConfirmText}>继续计时</Text>
              </TouchableOpacity>
            </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  timerContent: {
    alignItems: 'center',
    width: '100%',
  },
  // IDLE
  idleCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  idleEmoji: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  idleText: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  idleSubText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  // TIMING
  timingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  timingEmoji: {
    width: 55,
    height: 55,
    resizeMode: 'contain',
  },
  timerDisplay: {
    marginTop: 28,
    fontSize: 40,
    fontWeight: '300',
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  timingHint: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  btnStop: {
    marginTop: 40,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 50,
  },
  btnStopText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '500',
  },
  // Dialog
  dialogMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: 280,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  dialogMsg: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  dialogBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogBtnCancel: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dialogBtnCancelText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  dialogBtnConfirm: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dialogBtnConfirmText: {
    color: '#fff',
    fontSize: 14,
  },
});
