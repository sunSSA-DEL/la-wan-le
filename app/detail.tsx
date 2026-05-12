import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BRISTOL_TYPES, SMOOTHNESS_OPTIONS, FEELING_TAGS } from '@/utils/constants';
import { addRecord } from '@/utils/storage';
import { formatDuration, formatDate } from '@/utils/calendar';

const COLORS = {
  bg: '#FFF8F0',
  card: '#FFFFFF',
  primary: '#C8956C',
  accent: '#E8B88A',
  textPrimary: '#4A3728',
  textSecondary: '#8B7355',
  border: '#E8D5C4',
};

export default function DetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ duration: string; startTime: string }>();
  const duration = parseInt(params.duration || '0');
  const startTime = parseInt(params.startTime || '0');

  const [selectedShape, setSelectedShape] = useState(0);
  const [selectedSmoothness, setSelectedSmoothness] = useState(0);
  const [selectedFeelings, setSelectedFeelings] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!duration) {
      Alert.alert('出错了', '请返回重新计时', [{ text: '返回', onPress: () => router.back() }]);
    }
  }, [duration]);

  const toggleFeeling = (tag: string) => {
    setSelectedFeelings(prev => {
      const next = { ...prev };
      if (next[tag]) delete next[tag];
      else next[tag] = true;
      return next;
    });
  };

  const onSave = async () => {
    if (!selectedShape) {
      Alert.alert('提示', '请选择便便形状');
      return;
    }
    if (!selectedSmoothness) {
      Alert.alert('提示', '请选择顺畅度');
      return;
    }

    const endTime = startTime + duration * 1000;
    const recordDate = formatDate(
      new Date(startTime).getFullYear(),
      new Date(startTime).getMonth() + 1,
      new Date(startTime).getDate()
    );

    const feelings = Object.keys(selectedFeelings);

    try {
      await addRecord({
        startTime,
        endTime,
        duration,
        date: recordDate,
        shape: selectedShape,
        smoothness: selectedSmoothness,
        feeling: feelings,
        note: note.trim(),
      });
    } catch (e: any) {
      Alert.alert('保存失败', e?.message || '未知错误');
      return;
    }

    try {
      router.dismissAll();
      router.navigate('/(tabs)/calendar');
    } catch (e: any) {
      Alert.alert('跳转失败', e?.message || '未知错误');
    }
  };

  if (!duration) {
    return <View style={styles.container} />;
  }

  const startTimeMs = startTime || Date.now();
  const displayDuration = formatDuration(duration);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* 用时卡片 */}
      <View style={styles.durationCard}>
        <Text style={styles.durationLabel}>本次拉屎用时</Text>
        <Text style={styles.durationValue}>{displayDuration}</Text>
      </View>

      {/* 便便形状 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>便便形状</Text>
        <View style={styles.shapeGrid}>
          {BRISTOL_TYPES.map(item => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.shapeItem,
                selectedShape === item.value && styles.shapeSelected,
              ]}
              onPress={() => setSelectedShape(item.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.shapeEmoji}>{item.emoji}</Text>
              <Text style={styles.shapeLabel}>{item.label}</Text>
              <Text style={styles.shapeDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 顺畅度 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>顺畅度</Text>
        <View style={styles.smoothnessRow}>
          {SMOOTHNESS_OPTIONS.map(item => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.smoothItem,
                selectedSmoothness === item.value && styles.smoothSelected,
              ]}
              onPress={() => setSelectedSmoothness(item.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.smoothEmoji}>{item.emoji}</Text>
              <Text style={styles.smoothLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 拉后感 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>拉后感（可多选）</Text>
        <View style={styles.feelingGrid}>
          {FEELING_TAGS.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.feelingTag,
                selectedFeelings[tag] && styles.feelingSelected,
              ]}
              onPress={() => toggleFeeling(tag)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.feelingTagText,
                  selectedFeelings[tag] && styles.feelingSelectedText,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 备注 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>备注（选填）</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="还有什么想记录的..."
          placeholderTextColor="#C4B8A8"
          maxLength={200}
          multiline
          value={note}
          onChangeText={setNote}
          textAlignVertical="top"
        />
      </View>

      {/* 保存按钮 */}
      <TouchableOpacity style={styles.btnSave} onPress={onSave} activeOpacity={0.85}>
        <Text style={styles.btnSaveText}>保存记录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: COLORS.bg,
  },
  container: {
    paddingTop: 12,
    paddingBottom: 30,
  },
  durationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  durationLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  durationValue: {
    fontSize: 40,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  shapeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shapeItem: {
    width: '31%',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  shapeSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(200, 149, 108, 0.08)',
  },
  shapeEmoji: {
    fontSize: 30,
    marginBottom: 6,
  },
  shapeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  shapeDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  smoothnessRow: {
    flexDirection: 'row',
    gap: 10,
  },
  smoothItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  smoothSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(200, 149, 108, 0.08)',
  },
  smoothEmoji: {
    fontSize: 30,
    marginBottom: 6,
  },
  smoothLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  feelingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feelingTag: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 25,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  feelingSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  feelingTagText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  feelingSelectedText: {
    color: '#fff',
  },
  noteInput: {
    backgroundColor: COLORS.card,
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnSave: {
    marginHorizontal: 8,
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnSaveText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '500',
  },
});
