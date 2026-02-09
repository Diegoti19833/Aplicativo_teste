import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

const VideoPlayer = ({ videoUrl, onVideoComplete, lesson }) => {
  const [status, setStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const video = useRef(null);

  const handlePlaybackStatusUpdate = (status) => {
    setStatus(status);
    
    if (status.isLoaded) {
      setIsLoading(false);
      
      // Verificar se o vídeo terminou
      if (status.didJustFinish && onVideoComplete) {
        onVideoComplete();
      }
    }
  };

  const togglePlayPause = () => {
    if (status.isPlaying) {
      video.current.pauseAsync();
    } else {
      video.current.playAsync();
    }
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYouTubeEmbedUrl = (url) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  // Para vídeos do YouTube, usar WebView seria melhor, mas para simplicidade
  // vamos usar URLs de vídeo diretas ou simular com uma interface
  const renderVideoPlaceholder = () => (
    <View style={styles.videoPlaceholder}>
      <Text style={styles.videoTitle}>🎥 {lesson?.title}</Text>
      <Text style={styles.videoDescription}>{lesson?.description}</Text>
      <Text style={styles.videoDuration}>Duração: {lesson?.duration || 15} minutos</Text>
      
      <Pressable 
        style={styles.playButton}
        onPress={() => {
          Alert.alert(
            'Vídeo da Aula',
            `Assistindo: ${lesson?.title}\n\nEste é um exemplo de como o vídeo seria reproduzido. Em uma implementação real, o vídeo seria carregado aqui.`,
            [
              { text: 'Pular Vídeo', onPress: onVideoComplete },
              { text: 'Assistir', onPress: onVideoComplete }
            ]
          );
        }}
      >
        <Text style={styles.playButtonText}>▶️ Assistir Aula</Text>
      </Pressable>
      
      <Text style={styles.videoNote}>
        💡 Assista ao vídeo completo para desbloquear o quiz!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderVideoPlaceholder()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  videoDescription: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  videoDuration: {
    fontSize: 12,
    color: '#888',
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoNote: {
    fontSize: 12,
    color: '#ffd93d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controls: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 20,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default VideoPlayer;