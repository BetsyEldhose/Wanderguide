import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  Easing,
  Dimensions,
  RefreshControl, // Added for pull-to-refresh
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPlaces } from '../../services/apiServices';
import HomeNav from '../../components/HomeNav';
import SwiperFlatList from 'react-native-swiper-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuBar from '../../components/MenuBar';
import Icon from 'react-native-vector-icons/FontAwesome';
import banner1 from './../../../assets/banner1.png';
import banner2 from './../../../assets/banner2.png';
import banner3 from './../../../assets/banner3.png';
import { imageUrl } from '../../utils/config';

export default function HomeScreen({ navigation }) {
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('Popular');
  const [fadeAnim] = useState(new Animated.Value(1));
  const [isRefreshing, setIsRefreshing] = useState(false); // Added for refresh state

  // Extracted fetchPlaces function to reuse for pull-to-refresh
  const fetchPlaces = useCallback(async () => {
    setIsRefreshing(true); // Show refresh indicator
    try {
      const response = await getPlaces();
      console.log('API restructure Response:', response);
      if (response.success) {
        const placesData = response.places || [];
        setPlaces(placesData);
        setFilteredPlaces(
          activeTab === 'Popular'
            ? placesData.filter((place) => place.popular=== 'true')
            : placesData
        );
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }).start();
      } else {
        console.warn('API response unsuccessful:', response);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
    } finally {
      setIsRefreshing(false); // Hide refresh indicator
    }
  }, [activeTab, fadeAnim]);

  useEffect(() => {
    fetchPlaces(); // Initial fetch
  }, [fetchPlaces]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const userType = await AsyncStorage.getItem('userType');
        if (!userId || !userType) navigation.replace('Login');
      } catch (error) {
        console.error('Error checking login status:', error);
        navigation.replace('Login');
      }
    };
    checkLoginStatus();
  }, [navigation]);

  useEffect(() => {
    console.log('Places updated:', places);
    setFilteredPlaces(
      activeTab === 'Popular'
        ? places.filter((place) => place.popular==='true')
        : places
    );
  }, [activeTab, places]);

  const handleSearch = useCallback(
    (text) => {
      setSearchText(text);
      const filtered = places.filter((place) =>
        place.place_name?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredPlaces(
        activeTab === 'Popular'
          ? filtered.filter((place) => place.popular==='true')
          : filtered
      );
    },
    [activeTab, places]
  );

  const navigateToPlaceDetail = useCallback(
    (placeId, placeName) => {
      navigation.navigate('PlaceScreen', { placeId, placeName });
    },
    [navigation]
  );

  const navigateToHotels = useCallback(() => {
    navigation.navigate('HotelsScreen', { placeId: 'all', placeName: 'Available Hotels' });
  }, [navigation]);

  const navigateToCabs = useCallback(() => {
    navigation.navigate('CabsScreen', { placeId: 'all', placeName: 'Available Cabs' });
  }, [navigation]);

  const navigateToEvents = useCallback(() => {
    navigation.navigate('EventsScreen', { placeId: 'all', placeName: 'Events' });
  }, [navigation]);

  const PlaceCard = React.memo(({ item }) => {
    const swiperRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handlePrev = () => {
      if (swiperRef.current && currentIndex > 0) {
        const newIndex = currentIndex - 1;
        swiperRef.current.scrollToIndex({ index: newIndex });
        setCurrentIndex(newIndex);
      }
    };

    const handleNext = () => {
      if (swiperRef.current && currentIndex < item.photos.length - 1) {
        const newIndex = currentIndex + 1;
        swiperRef.current.scrollToIndex({ index: newIndex });
        setCurrentIndex(newIndex);
      }
    };

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={styles.placeCard}
          onPress={() => navigateToPlaceDetail(item.id, item.place_name)}
        >
          {item.photos && item.photos.length > 0 ? (
            <View style={styles.swiperContainer}>
              <SwiperFlatList
                ref={swiperRef}
                data={item.photos}
                horizontal={true}
                renderItem={({ item: photo }) => {
                  const imageUri = `${imageUrl}${photo}`;
                  console.log('Image URI:', imageUri);
                  return (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.placeImage}
                      resizeMode="cover"
                      onError={(e) => console.log('Image Load Error:', e.nativeEvent.error, imageUri)}
                      onLoad={() => console.log('Image Loaded:', imageUri)}
                      defaultSource={require('./../../../assets/placeholder.png')}
                    />
                  );
                }}
                keyExtractor={(photo, index) => `${item.id}-${index}`}
                showPagination
                paginationStyle={styles.pagination}
                paginationStyleItem={styles.paginationDot}
                paginationStyleItemActive={styles.paginationDotActive}
                onIndexChanged={(index) => setCurrentIndex(index)}
              />
              {item.photos.length > 1 && (
                <>
                  <TouchableOpacity
                    style={[styles.arrowLeft, currentIndex === 0 && styles.arrowDisabled]}
                    onPress={handlePrev}
                    disabled={currentIndex === 0}
                  >
                    <Icon name="chevron-left" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.arrowRight,
                      currentIndex === item.photos.length - 1 && styles.arrowDisabled,
                    ]}
                    onPress={handleNext}
                    disabled={currentIndex === item.photos.length - 1}
                  >
                    <Icon name="chevron-right" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
            style={styles.placeNameGradient}
          >
            <Text style={styles.placeName}>{item.place_name || 'Unnamed Place'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  });

  return (
    <LinearGradient colors={['#121212', '#1E1E1E']} style={styles.container}>
      <HomeNav />
      <View style={styles.bannerContainer}>
        <SwiperFlatList autoplay={true} autoplayLoop={true} autoplayDelay={3}>
          <Image source={banner1} style={styles.banner} resizeMode="cover" />
          <Image source={banner2} style={styles.banner} resizeMode="cover" />
          <Image source={banner3} style={styles.banner} resizeMode="cover" />
        </SwiperFlatList>
      </View>
      <View style={styles.headerContainer}>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Popular' && styles.activeTab, { marginRight: 10 }]}
            onPress={() => setActiveTab('Popular')}
          >
            <Text style={[styles.tabText, activeTab === 'Popular' && styles.activeTabText]}>
              Popular
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'All Places' && styles.activeTab]}
            onPress={() => setActiveTab('All Places')}
          >
            <Text style={[styles.tabText, activeTab === 'All Places' && styles.activeTabText]}>
              All
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.hotelsButton} onPress={navigateToHotels}>
          <Text style={styles.hotelsButtonText}>Hotels</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hotelsButton} onPress={navigateToCabs}>
          <Text style={styles.hotelsButtonText}>Cabs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hotelsButton} onPress={navigateToEvents}>
          <Text style={styles.hotelsButtonText}>Events</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search places..."
          value={searchText}
          onChangeText={handleSearch}
          placeholderTextColor="#888888"
        />
      </View>
      <FlatList
        data={filteredPlaces}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => <PlaceCard item={item} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No places available</Text>}
        contentContainerStyle={styles.flatListContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={fetchPlaces}
            tintColor="#FF5A5F" // Matches active tab color for consistency
            colors={['#FF5A5F']} // Spinner color for Android
          />
        }
      />
      <MenuBar />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  bannerContainer: {
    width: '100%',
    height: 120,
    marginTop: 15,
    borderRadius: 0,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  banner: {
    width: Dimensions.get('window').width,
    height: 120,
    resizeMode: 'cover',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#2A2A2A',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activeTab: {
    backgroundColor: '#FF5A5F',
  },
  tabText: {
    color: '#AAAAAA',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  hotelsButton: {
    backgroundColor: '#669977',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  hotelsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchBar: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
    elevation: 1,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  placeCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    backgroundColor: '#fff',
  },
  swiperContainer: {
    position: 'relative',
  },
  placeImage: {
    width: Dimensions.get('window').width - 30,
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  noImageContainer: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  noImageText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },
  placeNameGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
  },
  placeName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888888',
    fontSize: 14,
    marginTop: 20,
    fontWeight: '500',
  },
  pagination: {
    bottom: 40,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
  },
  arrowLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -12 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  arrowRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -12 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  arrowDisabled: {
    opacity: 0.3,
  },
});