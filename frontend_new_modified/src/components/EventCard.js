import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // For map icon
import { LinearGradient } from 'expo-linear-gradient';

const EventCard = ({ item, onPress, onLocationPress }) => {
  const scaleAnim = new Animated.Value(1);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const isEventActive = (eventDate) => {
    const today = new Date();
    const eventDateObj = new Date(eventDate);
    today.setHours(0, 0, 0, 0);
    eventDateObj.setHours(0, 0, 0, 0);
    return eventDateObj >= today;
  };

  return (
    <View style={{flex:1}}>
    <Animated.View style={[styles.eventCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
      >
        <LinearGradient colors={['#1A1A1A', '#2C2C2C']} style={styles.cardGradient}>
          <View style={styles.eventHeader}>
            <View style={styles.dateBox}>
              <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.eventStatus}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isEventActive(item.date) ? '#4CAF50' : '#FF5722' },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isEventActive(item.date) ? '#4CAF50' : '#FF5722' },
                ]}
              >
                {isEventActive(item.date) ? 'Active' : 'Not Active'}
              </Text>
            </View>
          </View>

          <Text style={styles.eventName}>{item.title}</Text>
          <Text style={styles.eventDetails}>Details: {item.details || 'No details available'}</Text>
          <View style={styles.eventFooter}>
            <View style={styles.eventMetrics}>
              <Text style={styles.metricText}>🕒 {item.time || 'Time TBD'}</Text>
              <Text style={styles.metricText}>📍 {item.place_name || 'Location TBD'}</Text>
            </View>
            {item.latitude && item.longitude ? (
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => onLocationPress(item.latitude, item.longitude)}
              >
                <MaterialIcons name="location-pin" size={20} color="#FFFFFF" />
                <Text style={styles.locationButtonText}>View Map</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noLocationText}>No Location</Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  eventCard: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
  },
  cardGradient: {
    padding: 20,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateBox: {
    backgroundColor: '#FF6F61', // Align with accent color
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  eventStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  eventDetails: {
    fontSize: 16,
    color: '#BBBBBB',
    lineHeight: 20,
    marginBottom: 20,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 15,
  },
  eventMetrics: {
    flexDirection: 'column',
    gap: 5,
  },
  metricText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6F61',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  noLocationText: {
    color: '#BBBBBB',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default React.memo(EventCard);