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
import * as Linking from 'expo-linking';
import MenuBar from '../../components/MenuBar';
import { getHotelsWithPlaceId } from '../../services/apiServices';
import nodata from './../../../assets/nodata.png';
import { imageUrl } from '../../utils/config';

const HotelsScreen = ({ route, navigation }) => {
  const { placeId, placeName } = route.params;
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [140, 80],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const fetchHotels = async (placeId) => {
    setLoading(true);
    try {
      const response = await getHotelsWithPlaceId(placeId);
      if (response.success) {
        setHotels(response.hotels);
      } else {
        alert('Error', response.error || 'No hotels found for this location');
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      alert('Error', error.message || 'An unexpected error occurred');
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
    const handleCallPress = () => {
      if (item.contact) {
        Linking.openURL(`tel:${item.contact}`);
      } else {
        alert('No Contact', 'This hotel does not have a contact number.');
      }
    };

    const handleEmailPress = () => {
      if (item.email) {
        Linking.openURL(`mailto:${item.email}`);
      } else {
        alert('No Email', 'This hotel does not have an email address.');
      }
    };

    const handleCardPress = () => {
      navigation.navigate('HotelDetail', { hotelId: item.id, hotelName: item.name });
    };

    return (
      <TouchableOpacity onPress={handleCardPress}>
        <LinearGradient colors={['#1A1A1A', '#2C2C2C']} style={styles.hotelCard}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: `${imageUrl}${item.image}` }}
              style={styles.hotelImage}
              onError={() => console.log('Image load failed:', item.image)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.callButton} onPress={handleCallPress}>
                <MaterialIcons name="phone" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.emailButton} onPress={handleEmailPress}>
                <MaterialIcons name="email" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.hotelDetails}>
            <Text style={styles.hotelName}>{item.name}</Text>
            <Text style={styles.hotelPlace}>{item.place_name}</Text>
            <View style={styles.cardDetails}>
              <Text style={styles.hotelAddress}>📍 {item.address || 'Address not available'}</Text>
              <Text style={styles.hotelContact}>📞 {item.contact || 'N/A'}</Text>
              <Text style={styles.hotelEmail}>✉️ {item.email || 'N/A'}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#1A1A1A', '#2C2C2C']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
        <LinearGradient colors={['#2C2C2C', '#1A1A1A']} style={styles.gradient}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#FF6F61" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Hotels</Text>
            <Text style={styles.headerSubtitle}>{placeName || 'Available Hotels'}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6F61" />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6F61" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Image source={nodata} style={styles.emptyImage} />
              <Text style={styles.emptyText}>No hotels available at the moment</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchHotels(placeId)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <MenuBar />
    </LinearGradient>
  );
};

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  gradient: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    marginLeft: 15,
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  backButton: {
    padding: 10,
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    elevation: 2,
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
    padding: 20,
    paddingTop: 10,
  },
  hotelCard: {
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  hotelImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  buttonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 10,
  },
  callButton: {
    backgroundColor: '#FF6F61',
    padding: 10,
    borderRadius: 10,
  },
  emailButton: {
    backgroundColor: '#FF6F61',
    padding: 10,
    borderRadius: 10,
  },
  hotelDetails: {
    padding: 20,
  },
  hotelName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  hotelPlace: {
    fontSize: 16,
    color: '#BBBBBB',
    marginBottom: 10,
  },
  cardDetails: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#2C2C2C',
  },
  hotelAddress: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  hotelContact: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  hotelEmail: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#BBBBBB',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HotelsScreen;