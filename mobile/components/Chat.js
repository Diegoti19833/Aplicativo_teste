import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';

const Chat = ({ channelType = 'global', channelName = 'Franqueados', receiverId = null, onBack = null }) => {
  const { user } = useAuth();
  const {
    messages,
    channelMessages,
    loading,
    error,
    fetchPrivateMessages,
    fetchChannelMessages,
    sendPrivateMessage,
    sendGlobalMessage,
    sendRoleMessage,
    markMessageAsRead,
    subscribeToPrivateMessages,
    subscribeToChannelMessages,
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (user) {
      // Fetch messages and subscribe to the appropriate channel
      if (channelType === 'private' && receiverId) {
        fetchPrivateMessages(receiverId);
        const subscription = subscribeToPrivateMessages(receiverId);
        return () => subscription?.unsubscribe();
      } else if (channelName) {
        fetchChannelMessages(channelName, channelType);
        const subscription = subscribeToChannelMessages(channelName, channelType);
        return () => subscription?.unsubscribe();
      }
    }
  }, [user, channelType, channelName, receiverId, fetchPrivateMessages, fetchChannelMessages, subscribeToPrivateMessages, subscribeToChannelMessages]);

  // Determinar quais mensagens usar baseado no tipo de canal
  const currentMessages = channelType === 'private' ? messages : channelMessages;

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (currentMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      if (channelType === 'private' && receiverId) {
        await sendPrivateMessage(receiverId, messageText.trim());
      } else if (channelType === 'global' && channelName) {
        await sendGlobalMessage(channelName, messageText.trim());
      } else if (channelType === 'role' && channelName) {
        await sendRoleMessage(channelName, messageText.trim());
      }
      setMessageText('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleAttachFile = () => {
    Alert.alert(
      'Anexar Arquivo',
      'Escolha uma opção:',
      [
        { text: 'Câmera', onPress: handleCamera },
        { text: 'Galeria', onPress: handleImagePicker },
        { text: 'Documento', onPress: handleDocumentPicker },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão da câmera é necessária!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAndSendFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível acessar a câmera.');
    }
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão da galeria é necessária!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAndSendFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível acessar a galeria.');
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAndSendFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar o documento.');
    }
  };

  const uploadAndSendFile = async (file) => {
    if (uploading) return;

    setUploading(true);
    try {
      // Aqui você pode implementar o upload para o Supabase Storage
      // Por enquanto, vamos simular o envio de uma mensagem com arquivo
      const messageWithFile = `📎 ${file.name || 'Arquivo anexado'}`;
      
      if (channelType === 'private' && receiverId) {
        await sendPrivateMessage(receiverId, messageWithFile);
      } else if (channelType === 'global' && channelName) {
        await sendGlobalMessage(channelName, messageWithFile);
      } else if (channelType === 'role' && channelName) {
        await sendRoleMessage(channelName, messageWithFile);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar o arquivo.');
    } finally {
      setUploading(false);
    }
  };

  const handleMessagePress = (message) => {
    if (!message.is_read && message.sender_id !== user?.id) {
      markMessageAsRead(message.id);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.sender_id === user?.id;
    const previousMessage = index > 0 ? currentMessages[index - 1] : null;
    const showDate = !previousMessage || 
      formatDate(item.created_at) !== formatDate(previousMessage.created_at);

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessage : styles.otherMessage,
          ]}
          onPress={() => handleMessagePress(item)}
        >
          {!isMyMessage && (
            <Text style={styles.senderName}>
              {item.sender?.name || 'Usuário'}
            </Text>
          )}
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText,
          ]}>
            {item.message_text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timeText,
              isMyMessage ? styles.myTimeText : styles.otherTimeText,
            ]}>
              {formatTime(item.created_at)}
            </Text>
            {isMyMessage && (
              <Ionicons
                name={item.is_read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.is_read ? '#4CAF50' : '#999'}
                style={styles.readIcon}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const getChannelTitle = () => {
    if (channelType === 'private') {
      return 'Chat Privado';
    } else if (channelType === 'role') {
      return `Canal ${channelName}`;
    } else {
      return channelName;
    }
  };

  if (loading && currentMessages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando mensagens...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {onBack && (
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{getChannelTitle()}</Text>
              {channelType !== 'private' && (
                <Text style={styles.headerSubtitle}>
                  {currentMessages.length} mensagem{currentMessages.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={currentMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handleAttachFile}
            disabled={uploading || sending}
          >
            <Ionicons
              name="attach"
              size={24}
              color={uploading || sending ? '#999' : '#007AFF'}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Digite sua mensagem..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!sending && !uploading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending || uploading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending || uploading}
          >
            <Ionicons
              name={uploading ? "cloud-upload" : "send"}
              size={20}
              color={(!messageText.trim() || sending || uploading) ? '#999' : '#fff'}
            />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: '#999',
  },
  readIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Chat;