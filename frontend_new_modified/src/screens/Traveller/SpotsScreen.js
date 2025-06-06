import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  RefreshControl,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import MenuBar from '../../components/MenuBar';
import { getSpotsWithPlaceId } from '../../services/apiServices';
import { imageUrl } from '../../utils/config';

const SpotsScreen = ({ route, navigation }) => {
  const { placeId, placeName } = route.params;
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [180, 100], // Taller for an immersive header
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -60], // Parallax effect
    extrapolate: 'clamp',
  });

  const fetchSpots = async (placeId) => {
    setLoading(true);
    try {
      console.log("Fetching spots for placeId:", placeId);
      const response = await getSpotsWithPlaceId(placeId);
      if (response.success) {
        setSpots(response.spots);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800, // Smoother fade-in
          useNativeDriver: true,
        }).start();
      } else {
        alert('Error', response.error || 'No spots found for this location');
      }
    } catch (error) {
      console.error('Error fetching spots:', error);
      alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSpots(placeId);
  }, [placeId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSpots(placeId);
  };

  const SpotCard = ({ item }) => {
    const scaleAnim = new Animated.Value(1);
    const tiltAnim = new Animated.Value(0);

    const onPressIn = () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(tiltAnim, {
          toValue: 5, // Slight tilt for 3D effect
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const onPressOut = () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(tiltAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const tiltTransform = tiltAnim.interpolate({
      inputRange: [-5, 0, 5],
      outputRange: ['-5deg', '0deg', '5deg'],
    });

    return (
      <Animated.View
        style={[
          styles.spotCard,
          {
            transform: [
              { scale: scaleAnim },
              { rotateY: tiltTransform },
              { perspective: 1000 }, // Adds depth for tilt
            ],
            opacity: fadeAnim,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(26, 26, 26, 0.98)', 'rgba(44, 44, 44, 0.98)']}
          style={styles.cardGradient}
        >
          <View style={styles.imageContainer}>
            {item.image ? (
              <Image
                source={{ uri: `${imageUrl}${item.image}` }}
                style={styles.spotImage}
                onError={(e) => console.log('Image load failed:', e.nativeEvent.error, item.image)}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
            <LinearGradient
              colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.8)']}
              style={styles.imageOverlay}
            />
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.spotName}>{item.name || 'Unnamed Spot'}</Text>
            <Text style={styles.spotDetails}>{item.details || 'No details available'}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={['#1A1A1A', '#2C2C2C']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
        <LinearGradient
          colors={['rgba(44, 44, 44, 0.95)', 'rgba(26, 26, 26, 0.95)']}
          style={styles.gradient}
        >
          <Animated.View style={[styles.headerBackground, { transform: [{ translateY: headerTranslate }] }]} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={32} color="#FF6F61" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Spots</Text>
            <Text style={styles.headerSubtitle}>{placeName || 'Popular Spots'}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6F61" />
          <Text style={styles.loadingText}>Loading spots...</Text>
        </View>
      ) : (
        <FlatList
          data={spots}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <SpotCard item={item} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6F61" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No spots available at the moment</Text>
            </View>
          }
        />
      )}

      <MenuBar />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 12,
  },
  gradient: {
    flex: 1,
    paddingTop: 35,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 111, 97, 0.05)', // Subtle glow
    height: 240, // Taller for parallax
  },
  headerContent: {
    marginLeft: 15,
    flex: 1,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 5,
    letterSpacing: 1.2,
    textShadowColor: 'rgba(255, 111, 97, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#BBBBBB',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  backButton: {
    padding: 14,
    backgroundColor: 'rgba(44, 44, 44, 0.9)',
    borderRadius: 18,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  listContainer: {
    padding: 30,
  },
  spotCard: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  cardGradient: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.15)', // Metallic-like edge
  },
  imageContainer: {
    position: 'relative',
  },
  spotImage: {
    width: '100%',
    height: 200, // Taller for a dramatic showcase
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#2C2C2C',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: 'rgba(44, 44, 44, 0.75)', // Richer glassmorphism
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  spotName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.8,
    textShadowColor: 'rgba(255, 111, 97, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  spotDetails: {
    fontSize: 15,
    color: '#BBBBBB',
    fontWeight: '400',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#BBBBBB',
    fontWeight: '500',
  },
});

export default SpotsScreen;