import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatList from './ChatList';
import Chat from './Chat';

const ChatScreen = () => {
  const [selectedChat, setSelectedChat] = useState(null);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {selectedChat ? (
        <Chat 
          channelType={selectedChat.type}
          channelName={selectedChat.name}
          receiverId={selectedChat.receiverId}
          onBack={handleBackToList}
        />
      ) : (
        <ChatList onChatSelect={handleChatSelect} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f8',
    paddingBottom: 72, // Espaço para a navegação inferior
  },
});

export default ChatScreen;