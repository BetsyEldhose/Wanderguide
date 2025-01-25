import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  RefreshControl,
  StatusBar,
  Image,
  Linking,
} from 'react-native';
import { API_BASE_URL } from '../../utils/config';
import MenuBar from '../../components/MenuBar';
import { getHotelsWithPlaceId } from '../../services/apiServices';

const HotelsScreen = ({ route, navigation }) => {
  const { placeId, placeName } = route.params;
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [120, 70],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const fetchHotels = async (placeId) => {
    setLoading(true);
    try {
      const response = await getHotelsWithPlaceId(placeId);
      console.log("response", response);

      if (response.success) {
        setHotels(response.hotels);
      } else {
        Alert.alert('Error', response.error || 'No hotels found for this location');
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHotels(placeId);
  }, [placeId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHotels(placeId);
  };

  const HotelCard = ({ item }) => {
    return (
      <View style={styles.hotelCard}>
        <Text style={styles.hotelName}>{item.name}</Text>
        <Text style={styles.hotelPlace}>{item.place_name}</Text>
        <Text style={styles.hotelAddress}>📍 {item.address}</Text>
        <Text style={styles.hotelContact}>📞 {item.contact}</Text>
        <Text style={styles.hotelEmail}>✉️ {item.email}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Hotels</Text>
          <Text style={styles.headerSubtitle}>{placeName || 'Available Hotels'}</Text>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading hotels...</Text>
        </View>
      ) : (
        <FlatList
          data={hotels}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <HotelCard item={item} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hotels available at the moment</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchHotels(placeId)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <MenuBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    backgroundColor: '#6C63FF',
    paddingTop: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  headerContent: {
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  backButton: {
    position: 'absolute',
    top: 45,
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 28,
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C63FF',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  hotelCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  hotelName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 5,
  },
  hotelPlace: {
    fontSize: 18,
    color: '#636E72',
    marginBottom: 5,
  },
  hotelAddress: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 5,
  },
  hotelContact: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 5,
  },
  hotelEmail: {
    fontSize: 14,
    color: '#636E72',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#636E72',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HotelsScreen;
