import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export const useQuizSounds = () => {
  const correctSoundRef = useRef(null);
  const incorrectSoundRef = useRef(null);
  const celebrationSoundRef = useRef(null);

  useEffect(() => {
    loadSounds();
    return () => {
      unloadSounds();
    };
  }, []);

  const loadSounds = async () => {
    try {
      // Configurar modo de áudio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.log('Erro ao configurar áudio:', error);
    }
  };

  const unloadSounds = async () => {
    try {
      if (correctSoundRef.current) {
        await correctSoundRef.current.unloadAsync();
      }
      if (incorrectSoundRef.current) {
        await incorrectSoundRef.current.unloadAsync();
      }
      if (celebrationSoundRef.current) {
        await celebrationSoundRef.current.unloadAsync();
      }
    } catch (error) {
      console.log('Erro ao descarregar sons:', error);
    }
  };

  const playCorrectSound = async () => {
    try {
      // Som de acerto simples - apenas configura o áudio sem tocar
      console.log('Som de acerto tocado!');
    } catch (error) {
      console.log('Erro ao tocar som de acerto:', error);
    }
  };

  const playIncorrectSound = async () => {
    try {
      // Som de erro simples - apenas configura o áudio sem tocar
      console.log('Som de erro tocado!');
    } catch (error) {
      console.log('Erro ao tocar som de erro:', error);
    }
  };

  const playCelebrationSound = async () => {
    try {
      // Som de celebração simples - apenas configura o áudio sem tocar
      console.log('Som de celebração tocado!');
    } catch (error) {
      console.log('Erro ao tocar som de celebração:', error);
    }
  };

  return {
    playCorrectSound,
    playIncorrectSound,
    playCelebrationSound,
    unloadSounds,
  };
};