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

  export const getSpotsWithPlaceId = async (placeId) => {        
    try {      
     
      
      const response = await fetch(`${API_BASE_URL}/spots?place_id=${placeId}`);
      const data = await response.json();
  
      if (response.ok) {        
        return { success: true, spots: data.spots };          
      } else {
        return { success: false, error: data.message || 'Failed to fetch spots' };
      }
    } catch (error) {
      console.error('Error fetching spots:', error);
      return { success: false, error: error.message };
    }
  };

  export const getTranslitratedText = async (text,lang) => {
    try {
      console.log("test case 1");
      const response=await fetch(`${API_BASE_URL}/translate`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          lang: lang
        })
        });
        console.log("test case 2");
        
        const data = await response.json();
     
  
      if (response.ok) {
        return { success: true, transliterated_text: data.transliterated_text };
      } else {
        return { success: false, error: data.message || 'Failed to transliterate text' };
      }
    } catch (error) {
      console.error('Error transliterating text:', error);
      return { success: false, error: error.message };
    }
  };

  
export const bookCab = async (bookingData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookcab`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to book cab');
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getMyBookings = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookingByUser/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
     
      },
    });
    const data = await response.json();
    return {
      success: true,
      bookings: data.bookings 
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

export const cancelBooking = async (bookingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cancelBooking/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'cancelled' })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: data.message || 'Failed to cancel booking'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Network error occurred'
    };
  }
};

export const getDriverBookings = async (driverId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookingByDriver/${driverId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
       
      },
    });
    const data = await response.json();
    return {
      success: true,
      bookings: data.bookings 
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};



export const updateLocation = async (driverId, latitude, longitude, bookingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/updateDriverLocation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        driverId,
        latitude,
        longitude,
        bookingId, // Include bookingId to associate location with the specific ride
      }),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};


export const getTrackingData = async (bookingId) => {
  try {
    print("bookingId");
    print(bookingId);
    const response = await fetch(`${API_BASE_URL}/tracking/${bookingId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    throw error;
  }
};

export const acceptBooking = async (bookingId) => {
  try {
    //dont use axios
    const response = await fetch(`${API_BASE_URL}/acceptBooking/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return {
      success: true,
      message: data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export const completeBooking = async (bookingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/completeBooking/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.message || 'Failed to complete booking' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};



export const getSpeechToText = async (uri) => {
  try {
    // Create a FormData object to send the audio file
    const formData = new FormData();
    formData.append('audio', {
      uri: uri, // The local file URI (e.g., from a recorder)
      type: 'audio/wav', // Adjust type based on your audio format (e.g., 'audio/mp3')
      name: 'audio.wav', // Filename for the backend
    });

    const response = await fetch(`${API_BASE_URL}/speech-to-text`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    if (response.ok) {
      console.log(data)
      return {
        success: true,
        text: data.text,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Failed to convert speech to text',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};



export const getReviewsWithPlaceId = async (placeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log(response);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

export const addReview = async (placeId, formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/${placeId}`, {
      method: 'POST',
      body: formData, // Send FormData directly
      // Note: Do NOT set 'Content-Type' header manually for FormData; fetch sets it automatically with the correct boundary
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! Status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
};

export const getHotelById = async (hotelId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/hotels/${hotelId}`, {
      method: 'GET',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! Status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('Error fetching hotel:', error);
    throw error;
  }
};

export const getHotelReviews = async (hotelId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/hotel_reviews/${hotelId}`, {
      method: 'GET',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! Status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('Error fetching hotel reviews:', error);
    throw error;
  }
};

export const addHotelReview = async (hotelId, formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/hotel_reviews/${hotelId}`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! Status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('Error adding hotel review:', error);
    throw error;
  }
};
