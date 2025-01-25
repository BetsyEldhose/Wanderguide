import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Picker } from '@react-native-picker/picker';
import Voice from '@react-native-voice/voice'; // For voice-to-text functionality
import { useNavigation } from '@react-navigation/native';


const TranslationScreen = () => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es'); // Default target language as Chinese
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const navigation = useNavigation();

  // Language options
  const languages = [
    { label: 'English', value: 'en' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
    
  ];

 

  // Start recording
  const startRecording = () => {
    setIsRecording(true);
    Voice.start('en-US'); 
    Voice.onSpeechResults = (event) => {
      const speechResult = event.value[0];
      setRecordedText(speechResult);
      setInputText(speechResult); 
      console.log(speechResult);
      
    };
  };

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false);
    Voice.stop();
  };

  // Translate the text
  const translateText = async () => {
    if (!inputText.trim()) {
      Alert.alert('Input required', 'Please enter some text or use the voice input.');
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${sourceLang}&tl=${targetLang}&q=${encodeURIComponent(inputText)}`);
      const data = await response.json();
      
      // The translated text will be in the first array of the response
      const translated = data[0]?.[0]?.[0];
      
      if (translated) {
        setTranslatedText(translated);
      } else {
        setTranslatedText('Translation failed. Please try again.');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Error occurred during translation.');
    } finally {
      setLoading(false);
    }
  };
  
  // Speak translated text
  const speakText = (text) => {
    if (text) {
      Speech.speak(text, { language: targetLang });
    }
  };

  // Back button to navigate to home
  const goBackHome = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Translation</Text>

      {/* Language selection */}
      <View style={styles.languageSelector}>
        <Picker selectedValue={sourceLang} style={styles.picker} onValueChange={(itemValue) => setSourceLang(itemValue)}>
          {languages.map((lang) => (
            <Picker.Item key={lang.value} label={lang.label} value={lang.value} />
          ))}
        </Picker>
        <Ionicons name="arrow-forward" size={24} color="black" />
        <Picker selectedValue={targetLang} style={styles.picker} onValueChange={(itemValue) => setTargetLang(itemValue)}>
          {languages.map((lang) => (
            <Picker.Item key={lang.value} label={lang.label} value={lang.value} />
          ))}
        </Picker>
      </View>

      {/* Text input */}
      <TextInput
        style={styles.textInput}
        placeholder="Enter text"
        value={inputText}
        onChangeText={setInputText}
      />

      {/* Voice input button */}
      {/* <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} style={styles.button}>
        <Text style={styles.buttonText}>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
      </TouchableOpacity> */}

      {/* Translate button */}
      <TouchableOpacity style={styles.button} onPress={translateText}>
        <Text style={styles.buttonText}>{loading ? 'Translating...' : 'Translate'}</Text>
      </TouchableOpacity>

      {/* Translated text */}
      {translatedText ? (
        <View style={styles.resultContainer}>
          <Text style={styles.translatedText}>{translatedText}</Text>

          {/* Speak translated text */}
          <TouchableOpacity onPress={() => speakText(translatedText)} style={styles.speakButton}>
            <Ionicons name="volume-high" size={24} color="#fff" />
            <Text style={styles.speakButtonText}>Speak</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Back button to navigate to home */}
      <TouchableOpacity onPress={goBackHome} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  picker: {
    height: 50,
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 10,
  },
  textInput: {
    height: 40,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#66BB6A',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  translatedText: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  speakButton: {
    backgroundColor: '#66BB6A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  speakButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 10,
  },
  backButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
});

export default TranslationScreen;
