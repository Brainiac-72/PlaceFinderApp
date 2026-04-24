import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, useWindowDimensions, TouchableOpacity, Image, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useThemeColor } from '../../hooks/useThemeColor';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Discover Premium Spaces',
    description: 'Find the perfect place to live, work, or grow your business across Ghana with our curated listings.',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop',
    icon: 'search-outline',
  },
  {
    id: '2',
    title: 'List Your Space with Ease',
    description: 'Landlords can reach thousands of potential tenants instantly. Manage your listings with professional tools.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop',
    icon: 'business-outline',
  },
  {
    id: '3',
    title: 'Insights That Matter',
    description: 'Track how your listings are performing with real-time view counts and sharing analytics.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
    icon: 'stats-chart-outline',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { setHasFinishedOnboarding } = useSettingsStore();
  const { colors } = useThemeColor();

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleFinish = () => {
    setHasFinishedOnboarding(true);
    router.replace('/(tabs)');
  };

  const scrollToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      (slidesRef.current as any).scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleFinish();
    }
  };

  const Paginator = () => {
    return (
      <View style={styles.paginatorContainer}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              style={[styles.dot, { width: dotWidth, opacity, backgroundColor: colors.primary }]}
              key={i.toString()}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ flex: 3 }}>
        <FlatList
          data={SLIDES}
          renderItem={({ item }) => <OnboardingItem item={item} width={width} colors={colors} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>

      <View style={styles.footer}>
        <Paginator />
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={scrollToNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'Start Finding' : 'Next'}
          </Text>
          <Ionicons 
            name={currentIndex === SLIDES.length - 1 ? 'rocket' : 'arrow-forward'} 
            size={20} 
            color="#fff" 
            style={{ marginLeft: 8 }} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const OnboardingItem = ({ item, width, colors }: any) => {
  return (
    <View style={[styles.itemContainer, { width }]}>
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      <View style={styles.overlay} />
      
      <SafeAreaView style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: '#fff' }]}>{item.title}</Text>
        <Text style={[styles.description, { color: '#EBEBF5' }]}>
          {item.description}
        </Text>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontWeight: '800',
    fontSize: 32,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -1,
  },
  description: {
    fontWeight: '400',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    height: 180,
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  paginatorContainer: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 8,
  },
  button: {
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
