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
} from 'react-native';
import MenuBar from '../../components/MenuBar';
import { getCabsWithPlaceId } from '../../services/apiServices';

const CabsScreen = ({ route, navigation }) => {
  const { placeId, placeName } = route.params;
  const [cabs, setCabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [120, 70],
    extrapolate: 'clamp',
  });

  const fetchCabs = async (placeId) => {
    setLoading(true);
    try {
      const response = await getCabsWithPlaceId(placeId); // API call to fetch cabs
      if (response.success) {
        setCabs(response.cabs);
      } else {
        Alert.alert('Error', response.error || 'No cabs found for this location');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCabs(placeId);
  }, [placeId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCabs(placeId);
  };

  const CabCard = ({ item }) => (
    <View style={styles.cabCard}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => Alert.alert('Driver Details', `Driver: ${item.name}\nPhone: ${item.phone}`)}
      >
        <Text style={styles.cabName}>{item.name} CAB service</Text>
        <Text style={styles.cabDetails}>License No: {item.license_no}</Text>
        <Text style={styles.cabDetails}>Age: {item.age}</Text>
        <Text style={styles.cabDetails}>Details: {item.cab_details}</Text>
        <Text style={styles.cabDetails}>Phone: {item.phone}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.cabButton}
        onPress={() => navigation.navigate('CabBookingScreen', { cab: item })}
      >
        <Text style={{ color: '#FFF', fontWeight: '700',textAlign: 'center' }}>Book Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Cabs</Text>
          <Text style={styles.headerSubtitle}>{placeName || 'Available Cabs'}</Text>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5733" />
          <Text style={styles.loadingText}>Loading cabs...</Text>
        </View>
      ) : (
        <FlatList
          data={cabs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <CabCard item={item} />}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5733" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No cabs available at the moment</Text>
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
    backgroundColor: '#FF5733',
    paddingTop: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
  },
  headerContent: {
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
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
    color: '#FF5733',
  },
  listContainer: {
    padding: 20,
  },
  cabCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    elevation: 5,
  },
  cabName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
  },
  cabDetails: {
    fontSize: 16,
    color: '#636E72',
    marginBottom: 4,
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
  },
  cabButton: {    
    backgroundColor: '#FF5733',
    borderRadius: 20,
    padding: 10,
    marginTop: 10,
    elevation: 5,
  },
});

export default CabsScreen;
