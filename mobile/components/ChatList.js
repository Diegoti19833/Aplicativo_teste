import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';

const ChatList = ({ onChatSelect }) => {
  const { user } = useAuth();
  const { userData } = useUserData();
  const { fetchConversations, loading, error } = useChat();
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Canais predefinidos
  const predefinedChannels = [
    {
      id: 'global_franqueados',
      type: 'global',
      name: 'Franqueados',
      description: 'Canal geral para todos os franqueados',
      icon: 'people',
      unreadCount: 0,
    },
    {
      id: 'role_gerentes',
      type: 'role',
      name: 'Gerentes',
      description: 'Canal exclusivo para gerentes',
      icon: 'business',
      unreadCount: 0,
    },
    {
      id: 'role_funcionarios',
      type: 'role',
      name: 'Funcionários',
      description: 'Canal para funcionários',
      icon: 'person',
      unreadCount: 0,
    },
    {
      id: 'role_caixas',
      type: 'role',
      name: 'Caixas',
      description: 'Canal para operadores de caixa',
      icon: 'card',
      unreadCount: 0,
    },
  ];

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const userConversations = await fetchConversations();
      setConversations(userConversations || []);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? 'agora' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? '1d' : `${diffInDays}d`;
    }
  };

  const renderChannelItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onChatSelect({
        type: item.type,
        name: item.name,
        receiverId: null,
      })}
    >
      <View style={styles.avatarContainer}>
        <Ionicons name={item.icon} size={24} color="#007AFF" />
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.name}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.conversationDescription} numberOfLines={1}>
          {item.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onChatSelect({
        type: 'private',
        name: item.other_user?.name || 'Chat Privado',
        receiverId: item.other_user?.id,
      })}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.other_user?.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>
            {item.other_user?.name || 'Usuário'}
          </Text>
          <Text style={styles.timeText}>
            {formatLastMessageTime(item.last_message_at)}
          </Text>
        </View>
        <View style={styles.lastMessageContainer}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message || 'Nenhuma mensagem'}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  // Filtrar canais baseado no role do usuário
  const getAvailableChannels = () => {
    if (!userData?.role) return [predefinedChannels[0]]; // Apenas canal global

    const channels = [predefinedChannels[0]]; // Canal global sempre disponível

    // Adicionar canal específico do role
    const roleChannel = predefinedChannels.find(
      channel => channel.name.toLowerCase() === userData.role.toLowerCase()
    );
    if (roleChannel) {
      channels.push(roleChannel);
    }

    return channels;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversas</Text>
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={() => (
          <View>
            {/* Canais */}
            {renderSectionHeader('Canais')}
            <FlatList
              data={getAvailableChannels()}
              keyExtractor={(item) => item.id}
              renderItem={renderChannelItem}
              scrollEnabled={false}
            />

            {/* Conversas Privadas */}
            {conversations.length > 0 && (
              <>
                {renderSectionHeader('Conversas Privadas')}
                <FlatList
                  data={conversations}
                  keyExtractor={(item) => item.id}
                  renderItem={renderConversationItem}
                  scrollEnabled={false}
                />
              </>
            )}

            {conversations.length === 0 && !loading && (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Nenhuma conversa privada</Text>
                <Text style={styles.emptySubtext}>
                  Suas conversas privadas aparecerão aqui
                </Text>
              </View>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  conversationDescription: {
    fontSize: 14,
    color: '#666',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ChatList;