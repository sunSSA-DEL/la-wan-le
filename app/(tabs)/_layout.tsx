import { Tabs } from 'expo-router';
import React from 'react';
import { Text, Image } from 'react-native';

const POOP_ICON = require('@/assets/poop-main.webp');

const TAB_ICONS: Record<string, string> = {
  calendar: '📅',
  profile: '👤',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#C8956C',
        tabBarInactiveTintColor: '#8B7355',
        tabBarStyle: {
          backgroundColor: '#FFF8F0',
          borderTopColor: '#E8D5C4',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '计时',
          tabBarIcon: () => (
            <Image source={POOP_ICON} style={{ width: 26, height: 26, resizeMode: 'contain' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: '记录',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>{TAB_ICONS.calendar}</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>{TAB_ICONS.profile}</Text>,
        }}
      />
    </Tabs>
  );
}
