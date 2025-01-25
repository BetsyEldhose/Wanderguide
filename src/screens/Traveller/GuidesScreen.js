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
import { getGuidesWithPlaceId } from '../../services/apiServices';

const GuidesScreen = ({ route, navigation }) => {
  const { placeId, placeName } = route.params;
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [120, 70],
    extrapolate: 'clamp',
  });

  const fetchGuides = async (placeId) => {
    setLoading(true);
    try {
      const response = await getGuidesWithPlaceId(placeId); // API call to fetch guides
      if (response.success) {
        setGuides(response.guides || []);
      } else {
        Alert.alert('Error', response.error || 'No guides found for this location');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGuides(placeId);
  }, [placeId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGuides(placeId);
  };

  const GuideCard = ({ item }) => (
    <View style={styles.guideCard}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          Alert.alert('Guide Details', `Name: ${item.name}\nPhone: ${item.phone}`)
        }
      >
        <Text style={styles.guideName}>{item.name}</Text>
        <Text style={styles.guideDetails}>Age: {item.age}</Text>
        <Text style={styles.guideDetails}>Specialty: {item.specialty}</Text>
        <Text style={styles.guideDetails}>Phone: {item.phone}</Text>
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
          <Text style={styles.headerTitle}>Guides</Text>
          <Text style={styles.headerSubtitle}>{placeName || 'Available Guides'}</Text>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5733" />
          <Text style={styles.loadingText}>Loading guides...</Text>
        </View>
      ) : (
        <FlatList
          data={guides}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <GuideCard item={item} />}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5733" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No guides available at the moment</Text>
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
  guideCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    elevation: 5,
  },
  guideName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
  },
  guideDetails: {
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
});

export default GuidesScreen;
