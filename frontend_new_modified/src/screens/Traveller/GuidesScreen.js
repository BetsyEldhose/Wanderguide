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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import MenuBar from '../../components/MenuBar';
import { getGuidesWithPlaceId } from '../../services/apiServices';

const GuidesScreen = ({ route, navigation }) => {
  const { placeId, placeName } = route.params;
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);
  const fadeAnim = useState(new Animated.Value(0))[0]; // For card fade-in

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [150, 80], // Slightly taller for premium feel
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const fetchGuides = async (placeId) => {
    setLoading(true);
    try {
      const response = await getGuidesWithPlaceId(placeId);
      if (response.success) {
        setGuides(response.guides || []);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } else {
        alert('Error', response.error || 'No guides found for this location');
      }
    } catch (error) {
      console.error('Error fetching guides:', error);
      alert('Error', error.message || 'An unexpected error occurred');
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

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`).catch((err) =>
        console.error('Error opening dialer', err)
      );
    } else {
      alert('No Phone Number', 'This guide does not have a contact number.');
    }
  };

  const handleMail = (email) => {
    if (email) {
      Linking.openURL(`mailto:${email}`).catch((err) =>
        console.error('Error opening email app', err)
      );
    } else {
      alert('No Email', 'This guide does not have an email address.');
    }
  };

  const GuideCard = ({ item }) => {
    const scaleAnim = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={[styles.guideCard, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
        <LinearGradient colors={['rgba(26, 26, 26, 0.9)', 'rgba(44, 44, 44, 0.9)']} style={styles.cardGradient}>
          <View style={styles.contactContainer}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(item.phone_no)}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
            >
              <MaterialIcons name="phone" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emailButton}
              onPress={() => handleMail(item.email)}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
            >
              <MaterialIcons name="email" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.guideName}>{item.name || 'Unnamed Guide'}</Text>
          <View style={styles.detailsContainer}>
            <Text style={styles.guideDetails}>Age: {item.age || 'N/A'}</Text>
            <Text style={styles.guideDetails}>Gender: {item.gender || 'N/A'}</Text>
            <Text style={styles.guideDetails}>📞 {item.phone_no || 'N/A'}</Text>
            <Text style={styles.guideDetails}>✉️ {item.email || 'N/A'}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
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
            <Text style={styles.headerTitle}>Guides</Text>
            <Text style={styles.headerSubtitle}>{placeName || 'Available Guides'}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6F61" />
          <Text style={styles.loadingText}>Loading guides...</Text>
        </View>
      ) : (
        <FlatList
          data={guides}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <GuideCard item={item} />}
          contentContainerStyle={styles.listContainer}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          key="two-columns"
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
              <Text style={styles.emptyText}>No guides available at the moment</Text>
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  gradient: {
    flex: 1,
    paddingTop: 25,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    marginLeft: 15,
    flex: 1,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  backButton: {
    padding: 12,
    backgroundColor: 'rgba(44, 44, 44, 0.8)',
    borderRadius: 15,
    elevation: 3,
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
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  guideCard: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 15,
    borderRadius: 20,
    height: 200, // Fixed height for uniformity
  },
  contactContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    backgroundColor: '#FF6F61',
    padding: 10,
    borderRadius: 50,
    elevation: 2,
  },
  emailButton: {
    backgroundColor: '#FF6F61',
    padding: 10,
    borderRadius: 50,
    elevation: 2,
  },
  guideName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 45, // Space for buttons
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  detailsContainer: {
    padding: 10,
    backgroundColor: 'rgba(44, 44, 44, 0.6)', // Glassmorphism effect
    borderRadius: 10,
  },
  guideDetails: {
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 5,
    fontWeight: '400',
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

export default GuidesScreen;