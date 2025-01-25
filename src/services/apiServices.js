import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { API_BASE_URL } from './../utils/config';



export const getPlaces = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/place`);
      const data = await response.json();
  
      if (response.ok) {
        return { success: true, places: data.places };
      } else {
        return { success: false, error: data.message || 'Failed to fetch places' };
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      return { success: false, error: error.message };
    }
  };


export const getEventsWithPlaceId = async (placeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/events?place_id=${placeId}`);
      const data = await response.json();
  
      if (response.ok) {
        return { success: true, events: data.events };
      } else {
        return { success: false, error: data.message || 'Failed to fetch events' };
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      return { success: false, error: error.message };
    }
  };

export const getHotelsWithPlaceId = async (placeId) => {
    try {      
      console.log("getHotelsWithPlaceId", placeId);
      
      const response = await fetch(`${API_BASE_URL}/hotels?place_id=${placeId}`);
      const data = await response.json();
  
      if (response.ok) {        
        return { success: true, hotels: data.hotels };          
      } else {
        return { success: false, error: data.message || 'Failed to fetch hotels' };
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      return { success: false, error: error.message };
    }
  };

  export const getGuidesWithPlaceId = async (placeId) => {    
    try {      
      const response = await fetch(`${API_BASE_URL}/guides?place_id=${placeId}`);
      const data = await response.json();
  
      if (response.ok) {        
        return { success: true, guides: data.guides };          
      } else {
        return { success: false, error: data.message || 'Failed to fetch guides' };
      }
    } catch (error) {
      console.error('Error fetching guides:', error);
      return { success: false, error: error.message };
    }
  };

  export const getCabsWithPlaceId = async (placeId) => {        
    try {      
      const response = await fetch(`${API_BASE_URL}/cabs?place_id=${placeId}`);
      const data = await response.json();
      console.log(placeId);
      
  
      if (response.ok) {        
        return { success: true, cabs: data.cabs };          
      } else {
        return { success: false, error: data.message || 'Failed to fetch cabs' };
      }
    } catch (error) {
      console.error('Error fetching cabs:', error);
      return { success: false, error: error.message };
    }
  };