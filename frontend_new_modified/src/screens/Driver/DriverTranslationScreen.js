import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import MenuBar from '../../components/DriverMenu';
import { getSpeechToText, getTranslitratedText } from '../../services/apiServices';

const DriverTranslationScreen = () => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [transliteratedText, setTransliteratedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [recording, setRecording] = useState(null);
  const navigation = useNavigation();
  const pulseAnim = useState(new Animated.Value(1))[0];

  const languages = [
    { label: 'English', value: 'en' },
    { label: 'Hindi', value: 'hi' },
    { label: 'Tamil', value: 'ta' },
    { label: 'Bengali', value: 'bn' },
    { label: 'Gujarati', value: 'gu' },
    { label: 'Kannada', value: 'kn' },
    { label: 'Malayalam', value: 'ml' },
    { label: 'Marathi', value: 'mr' },
    { label: 'Punjabi', value: 'pa' },
    { label: 'Telugu', value: 'te' },
  ];

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Audio recording permission is required.');
      }
    })();
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);
      setRecording(null);
      setProcessingAudio(true);
      Speech.speak('Processing audio', { language: 'en-IN', rate: 0.75 });

      const text = await convertAudioToText(uri);
      setInputText(text);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    } finally {
      setProcessingAudio(false);
    }
  };

  const convertAudioToText = async (uri) => {
    try {
      const response = await getSpeechToText(uri);
      return response.text || 'Speech recognition failed';
    } catch (error) {
      console.error('Speech to text error:', error);
      return 'Error processing audio';
    }
  };

  const translateText = async () => {
    if (!inputText.trim()) {
      Alert.alert('Input Required', 'Please enter text or record audio.');
      return;
    }
    console.log('Translating:', inputText);
    setLoading(true);
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${sourceLang}&tl=${targetLang}&q=${encodeURIComponent(inputText)}`
      );
      const data = await response.json();
      console.log("data", data);
  
      // Extract all translated segments and join them
      const translatedSegments = data[0].map(segment => segment[0]).join(' ');
      if (translatedSegments) {
        const transResponse = await getTranslitratedText(translatedSegments, targetLang);
        setTransliteratedText(transResponse.transliterated_text.toLowerCase());
        setTranslatedText(translatedSegments.toLowerCase());
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTransliteratedText('transliteration unavailable');
      setTranslatedText('translation failed');
    } finally {
      setLoading(false);
    }
  };

  const speakText = async (text) => {
    if (text && text !== 'transliteration unavailable') {
      try {
        // Get available voices
        const availableVoices = await Speech.getAvailableVoicesAsync();
        console.log('Available voices:', availableVoices);
  
        // Find a voice matching the target language
        const targetVoice = availableVoices.find(
          (voice) => voice.language === targetLang || voice.identifier.includes(targetLang)
        );

        console.log('Target voice:', targetVoice);
        console.log('Target language:', targetLang);
  
        // Configure speech options with targetLang
        const speechOptions = {
          language: targetLang, // Use the target language (e.g., 'hi', 'ta', etc.)
          pitch: 1.0,           // Normal pitch
          rate: 0.75,           // Slower rate for clarity
          voice: targetVoice ? targetVoice.identifier : undefined, // Use matching voice if available
        };
  
        // Speak the transliterated text
        Speech.speak(text.toLowerCase(), speechOptions);
      } catch (error) {
        console.error('Error in speech synthesis:', error);
        // Fallback to default with targetLang
        Speech.speak(text.toLowerCase(), { language: targetLang, rate: 0.75 });
      }
    }
  };

  return (
    <LinearGradient colors={['#1A1A1A', '#2C2C2C']} style={styles.container}>
      <LinearGradient colors={['#2C2C2C', '#1A1A1A']} style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FF6F61" />
        </TouchableOpacity>
        <Text style={styles.header}>Translation</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <LinearGradient colors={['#333333', '#222222']} style={styles.languageSelector}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={sourceLang}
                style={styles.picker}
                onValueChange={setSourceLang}
                dropdownIconColor="#FF6F61"
              >
                {languages.map((lang) => (
                  <Picker.Item key={lang.value} label={lang.label} value={lang.value} />
                ))}
              </Picker>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#FF6F61" style={styles.arrowIcon} />
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={targetLang}
                style={styles.picker}
                onValueChange={setTargetLang}
                dropdownIconColor="#FF6F61"
              >
                {languages.map((lang) => (
                  <Picker.Item key={lang.value} label={lang.label} value={lang.value} />
                ))}
              </Picker>
            </View>
          </LinearGradient>

          <LinearGradient colors={['#2C2C2C', '#1A1A1A']} style={styles.card}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter text or record audio"
                placeholderTextColor="#888888"
                value={inputText}
                onChangeText={setInputText}
                multiline
                editable={!loading && !isRecording && !processingAudio}
              />
              <Animated.View style={[styles.voiceButton, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity
                  onPress={isRecording ? stopRecording : startRecording}
                  disabled={loading || processingAudio}
                >
                  {processingAudio ? (
                    <ActivityIndicator size="small" color="#FF6F61" />
                  ) : (
                    <Ionicons name={isRecording ? 'mic-off' : 'mic'} size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

            <TouchableOpacity
              style={[styles.translateButton, loading && styles.buttonDisabled]}
              onPress={translateText}
              disabled={loading || isRecording || processingAudio}
            >
              <LinearGradient
                colors={loading ? ['#666666', '#444444'] : ['#FF6F61', '#FF8A65']}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Translate</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {translatedText && (
              <View style={styles.resultContainer}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Transliteration</Text>
                  <Text style={styles.resultText}>{transliteratedText}</Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Translation</Text>
                  <Text style={styles.resultText}>{translatedText}</Text>
                </View>
                <TouchableOpacity
                  style={styles.speakButton}
                  onPress={() => speakText(transliteratedText)}
                >
                  <LinearGradient
                    colors={['#FF6F61', '#FF8A65']}
                    style={styles.speakButtonGradient}
                  >
                    <Ionicons name="volume-high" size={20} color="#FFFFFF" />
                    <Text style={styles.speakButtonText}>Speak</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </View>
      </ScrollView>
      <MenuBar />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 111, 97, 0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 111, 97, 0.1)',
  },
  header: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80, // Space for MenuBar
  },
  content: {
    padding: 20,
    flex: 1,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 20,
    padding: 8,
    elevation: 2,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  picker: {
    color: '#FFFFFF',
    height: 54,
  },
  arrowIcon: {
    marginHorizontal: 10,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    minHeight: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  voiceButton: {
    backgroundColor: '#2196F3',
    borderRadius: 50,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
    elevation: 4,
  },
  translateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultItem: {
    marginBottom: 15,
  },
  resultLabel: {
    color: '#FF6F61',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  resultText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  speakButton: {
    borderRadius: 25,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  speakButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  speakButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DriverTranslationScreen;