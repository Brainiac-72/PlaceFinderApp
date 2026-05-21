import { Tabs } from 'expo-router';
import React from 'react';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { Compass, Bookmark, Plus, MessageCircle, UserCircle } from 'lucide-react-native';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function TabLayout() {
  const { colors, isDark } = useThemeColor();
  
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarShowLabel: false,
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { borderRadius: 0, overflow: 'hidden' }]}>
            <BlurView tint={isDark ? "dark" : "light"} intensity={100} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, borderTopWidth: 1, borderTopColor: 'rgba(245, 158, 11, 0.15)' }]} />
          </View>
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 20,
          backgroundColor: 'transparent',
          height: Platform.OS === 'ios' ? 90 : 70,
          borderRadius: 0,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        tabBarItemStyle: {
          height: 70,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Compass size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          )
        }} 
      />
      <Tabs.Screen 
        name="saved" 
        options={{ 
          title: 'Saved',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Bookmark size={24} color={color} strokeWidth={focused ? 2.5 : 2} fill={focused ? '#F59E0B' : 'transparent'} />
            </View>
          )
        }} 
      />
      <Tabs.Screen 
        name="post" 
        options={{ 
          title: 'Post',
          tabBarIcon: ({ focused }) => (
            <View style={styles.postButton}>
              <Plus size={32} color={colors.badgeText} strokeWidth={3} />
            </View>
          )
        }} 
      />
      <Tabs.Screen 
        name="inbox" 
        options={{ 
          title: 'Inbox',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <MessageCircle size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          )
        }} 
      />
      <Tabs.Screen 
        name="notifications" 
        options={{ 
          title: 'Updates',
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <UserCircle size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          )
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginTop: -10,
  }
});

