import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { BRISTOL_TYPES, MEDAL_LEVELS } from '@/utils/constants';
import {
  getUserProfile,
  saveUserProfile,
  getStats,
  getRecordCount,
  getRecords,
  getMedalInfo,
  claimMedal,
  Stats,
} from '@/utils/storage';

const COLORS = {
  bg: '#FFF8F0',
  card: '#FFFFFF',
  primary: '#C8956C',
  accent: '#E8B88A',
  textPrimary: '#4A3728',
  textSecondary: '#8B7355',
};

export default function ProfileScreen() {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [nickName, setNickName] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [stats, setStats] = useState<(Stats & { commonShapeName: string }) | null>(null);
  const [hasData, setHasData] = useState(false);
  const [medalInfo, setMedalInfo] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadData();
    }, [])
  );

  const loadProfile = async () => {
    const profile = await getUserProfile();
    if (profile) {
      setAvatarUrl(profile.avatarUrl);
      setNickName(profile.nickName);
      setIsLogin(true);
    }
  };

  const loadData = async () => {
    const count = await getRecordCount();
    if (count === 0) {
      setHasData(false);
      setStats(null);
      setMedalInfo(null);
      return;
    }
    setHasData(true);
    const st = await getStats();
    if (st) {
      const shapeInfo = BRISTOL_TYPES.find(s => s.value === st.mostCommonShape);
      setStats({
        ...st,
        commonShapeName: shapeInfo ? shapeInfo.emoji + ' ' + shapeInfo.label : '未知',
        topFeelings: st.topFeelings || [],
      });
    }
    loadMedals();
  };

  const loadMedals = async () => {
    const info = await getMedalInfo();
    if (!info) return;

    const medals = MEDAL_LEVELS.map(m => {
      const earned = info.totalDays >= m.days;
      return { ...m, earned, claimed: info.claimed.includes(m.level) };
    });

    let nextMedal: any = null;
    if (info.nextMedal) {
      const prevDays = info.currentMedal ? info.currentMedal.days : 0;
      const remain = info.nextMedal.days - info.totalDays;
      const range = info.nextMedal.days - prevDays;
      const progress = Math.min(100, Math.round(((info.totalDays - prevDays) / range) * 100));
      nextMedal = { ...info.nextMedal, remain, progress };
    }

    setMedalInfo({ totalDays: info.totalDays, nextMedal, medals });
  };

  const convertToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const onChooseAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('权限不足', '需要相册权限才能选择头像');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      let finalUri = result.assets[0].uri;
      try {
        finalUri = await convertToBase64(finalUri);
      } catch {}
      setAvatarUrl(finalUri);
      saveProfileIfReady(finalUri, nickName);
    }
  };

  const onNicknameChange = (text: string) => {
    setNickName(text);
  };

  const onNicknameBlur = () => {
    if (nickName) {
      saveProfileIfReady(avatarUrl, nickName);
    }
  };

  const saveProfileIfReady = async (avatar: string, name: string) => {
    if (avatar && name) {
      await saveUserProfile({ avatarUrl: avatar, nickName: name });
      setIsLogin(true);
    }
  };

  const onClaimMedal = async (level: string) => {
    const ok = await claimMedal(level);
    if (ok) {
      const medal = MEDAL_LEVELS.find(m => m.level === level);
      Alert.alert(
        `恭喜获得${medal?.name || ''}！`,
        `你已经坚持打卡${medal?.days || ''}天啦～继续保持，肠道健康每一天！🎉`,
        [{ text: '太棒了', onPress: () => loadData() }]
      );
    } else {
      Alert.alert('提示', '已领取过了');
    }
  };

  const onExportData = () => {
    Alert.alert('导出数据', '选择导出格式', [
      { text: 'JSON', onPress: exportJSON },
      { text: '文本报告', onPress: exportText },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const exportJSON = async () => {
    const records = await getRecords();
    const json = JSON.stringify(records, null, 2);
    await Clipboard.setStringAsync(json);
    Alert.alert('成功', 'JSON 已复制到剪贴板');
  };

  const exportText = async () => {
    const records = await getRecords();
    if (!stats) return;
    let text = '【拉完了 - 数据报告】\n\n';
    text += `总记录数：${stats.totalCount} 次\n`;
    text += `平均时长：${Math.round(stats.avgDuration / 60)} 分钟\n`;
    text += `最常见形状：${stats.commonShapeName}\n`;
    text += `最长连续天数：${stats.streak} 天\n`;
    if (stats.topFeelings.length > 0) {
      text += `常见感受：${stats.topFeelings.join('、')}\n`;
    }
    text += '\n--- 最近记录 ---\n';
    records.slice(-5).reverse().forEach(r => {
      text += `${r.date} 用时${Math.round(r.duration / 60)}分钟 形状${r.shape}\n`;
    });
    await Clipboard.setStringAsync(text);
    Alert.alert('成功', '文本报告已复制到剪贴板');
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* 用户信息 */}
      <View style={styles.userCard}>
        <TouchableOpacity style={styles.avatarWrap} onPress={onChooseAvatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarPlaceholder}>😶</Text>
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.nicknameInput}
          placeholder="点击设置昵称"
          placeholderTextColor="#C4B8A8"
          value={nickName}
          onChangeText={onNicknameChange}
          onBlur={onNicknameBlur}
          textAlign="center"
        />
        {!isLogin && <Text style={styles.loginTip}>点击头像设置个人信息</Text>}
      </View>

      {/* 统计数据 */}
      {hasData && stats ? (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>排便统计</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalCount}</Text>
              <Text style={styles.statLabel}>总次数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.avgDuration}s</Text>
              <Text style={styles.statLabel}>平均时长</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.streak}天</Text>
              <Text style={styles.statLabel}>最长连续</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.commonShapeName}</Text>
              <Text style={styles.statLabel}>最常见</Text>
            </View>
          </View>
          {stats.topFeelings.length > 0 && (
            <View style={styles.statsFeelings}>
              <Text style={styles.statsFeelingLabel}>常见感受：</Text>
              <Text style={styles.statsFeelingText}>{stats.topFeelings.join('、')}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={styles.emptyText}>还没有记录</Text>
          <Text style={styles.emptySub}>开始计时，完成第一次记录吧！</Text>
        </View>
      )}

      {/* 打卡成就 */}
      {medalInfo && (
        <View style={styles.medalCard}>
          <Text style={styles.medalTitle}>打卡成就</Text>
          <Text style={styles.medalDays}>
            累计打卡 <Text style={styles.medalDaysNum}>{medalInfo.totalDays}</Text> 天
          </Text>

          {medalInfo.nextMedal ? (
            <View style={styles.medalProgressWrap}>
              <View style={styles.medalProgressBar}>
                <View
                  style={[
                    styles.medalProgressFill,
                    {
                      width: `${medalInfo.nextMedal.progress}%`,
                      backgroundColor: medalInfo.nextMedal.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.medalProgressText}>
                距{medalInfo.nextMedal.name}还需 {medalInfo.nextMedal.remain} 天
              </Text>
            </View>
          ) : (
            <View style={styles.medalAllDone}>
              <Text style={styles.medalAllText}>🎉 全部奖章已达成！</Text>
            </View>
          )}

          <View style={styles.medalList}>
            {medalInfo.medals.map((item: any) => (
              <View
                key={item.level}
                style={[styles.medalItem, item.earned && styles.medalEarned, !item.earned && styles.medalLocked]}
              >
                <View style={[styles.medalIconWrap, { backgroundColor: item.earned ? item.bg : '#F5F5F5' }]}>
                  <Text style={styles.medalIcon}>{item.emoji}</Text>
                </View>
                <Text style={[styles.medalName, { color: item.earned ? item.color : '#C4C4C4' }]}>
                  {item.name}
                </Text>
                <Text style={styles.medalCond}>{item.days}天打卡</Text>
                {item.earned && !item.claimed ? (
                  <TouchableOpacity
                    style={[styles.medalClaimBtn, { backgroundColor: item.color }]}
                    onPress={() => onClaimMedal(item.level)}
                  >
                    <Text style={styles.medalClaimBtnText}>领取奖励</Text>
                  </TouchableOpacity>
                ) : item.claimed ? (
                  <Text style={styles.medalClaimed}>已领取 ✓</Text>
                ) : (
                  <Text style={styles.medalNotyet}>未达成</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 导出按钮 */}
      {hasData && (
        <TouchableOpacity style={styles.btnExport} onPress={onExportData} activeOpacity={0.85}>
          <Text style={styles.btnExportText}>导出数据</Text>
        </TouchableOpacity>
      )}

      {/* 关于 */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>关于拉完了</Text>
        <Text style={styles.aboutItem}>版本 1.0.0</Text>
        <Text style={styles.aboutItem}>你的排便数据仅存储在本地，不用于商业目的</Text>
        <Text style={styles.aboutItem}>参考：布里斯托大便分类法 (Bristol Stool Chart)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: COLORS.bg,
  },
  container: {
    padding: 15,
    paddingBottom: 30,
  },
  userCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 24,
    paddingHorizontal: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  avatarWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  avatarPlaceholder: {
    fontSize: 40,
  },
  nicknameInput: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    width: '100%',
    padding: 4,
    textAlign: 'center',
  },
  loginTip: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statItem: {
    width: '47%',
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statsFeelings: {
    marginTop: 10,
    paddingVertical: 8,
  },
  statsFeelingLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statsFeelingText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 40,
    paddingHorizontal: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  medalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  medalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  medalDays: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  medalDaysNum: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  medalProgressWrap: {
    marginBottom: 14,
  },
  medalProgressBar: {
    height: 8,
    backgroundColor: '#F0EDE8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  medalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  medalProgressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  medalAllDone: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  medalAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  medalList: {
    flexDirection: 'row',
    gap: 8,
  },
  medalItem: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  medalEarned: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#E8D5A0',
  },
  medalLocked: {
    opacity: 0.55,
  },
  medalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  medalIcon: {
    fontSize: 22,
  },
  medalName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  medalCond: {
    fontSize: 10,
    color: '#999',
    marginBottom: 6,
  },
  medalClaimBtn: {
    borderRadius: 15,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  medalClaimBtnText: {
    fontSize: 11,
    color: '#fff',
  },
  medalClaimed: {
    fontSize: 11,
    color: '#8BC34A',
    fontWeight: '500',
  },
  medalNotyet: {
    fontSize: 11,
    color: '#C4C4C4',
  },
  btnExport: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnExportText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  aboutCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  aboutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  aboutItem: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
