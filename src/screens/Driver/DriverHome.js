import React from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import DriverMenu from '../../components/DriverMenu'; // Import the DriverMenu component

const DriverHome = () => {
  // Dummy data for booking details
  const bookings = [
    { id: '1', name: 'John Doe', pickup: 'Location A', dropoff: 'Location B', time: '10:00 AM' },
    { id: '2', name: 'Jane Smith', pickup: 'Location C', dropoff: 'Location D', time: '11:30 AM' },
    { id: '3', name: 'Chris Brown', pickup: 'Location E', dropoff: 'Location F', time: '1:00 PM' },
  ];

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <Text style={styles.bookingText}>Name: {item.name}</Text>
      <Text style={styles.bookingText}>Pickup: {item.pickup}</Text>
      <Text style={styles.bookingText}>Dropoff: {item.dropoff}</Text>
      <Text style={styles.bookingText}>Time: {item.time}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Include the DriverMenu component */}
      <DriverMenu />

      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <Text style={styles.welcomeText}>Welcome, Driver!</Text>
      </View>

      {/* Page Header */}
      <Text style={styles.header}>Booking Details</Text>

      {/* Booking Details Section */}
      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.bookingList}
      />
    </View>
  );
};

export default DriverHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  welcomeBanner: {
    backgroundColor: 'linear-gradient(to right, #ff7e5f, #feb47b)',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#333',
  },
  bookingList: {
    paddingHorizontal: 10,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
});
