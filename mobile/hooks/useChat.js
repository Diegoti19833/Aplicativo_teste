import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [channels, setChannels] = useState([]);
  const [channelMessages, setChannelMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Buscar conversas do usuário
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // Buscar conversas privadas usando consulta SQL direta
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(id, name, email),
          receiver:users!receiver_id(id, name, email)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('channel_type', 'private')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Agrupar mensagens por conversa
      const conversationsMap = new Map();
      
      data?.forEach(message => {
        const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const otherUser = message.sender_id === user.id ? message.receiver : message.sender;
        
        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            id: otherUserId,
            other_user: otherUser,
            last_message: message.message_text,
            last_message_at: message.created_at,
            unread_count: 0
          });
        }
      });

      setConversations(Array.from(conversationsMap.values()));
    } catch (err) {
      console.error('Erro ao buscar conversas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Buscar mensagens privadas entre dois usuários
  const fetchPrivateMessages = useCallback(async (otherUserId, limit = 50, offset = 0) => {
    if (!user || !otherUserId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(id, name, email),
          receiver:users!receiver_id(id, name, email)
        `)
        .eq('channel_type', 'private')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(limit)
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      setMessages(data || []);
      return data;
    } catch (err) {
      console.error('Erro ao buscar mensagens privadas:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Buscar mensagens de canal
  const fetchChannelMessages = useCallback(async (channelName, channelType = 'global', limit = 50, offset = 0) => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(id, name, email)
        `)
        .eq('channel_type', channelType)
        .eq('channel_name', channelName)
        .order('created_at', { ascending: true })
        .limit(limit)
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      setChannelMessages(data || []);
      return data;
    } catch (err) {
      console.error('Erro ao buscar mensagens do canal:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Enviar mensagem privada
  const sendPrivateMessage = useCallback(async (receiverId, messageText) => {
    if (!user || !receiverId || !messageText.trim()) return null;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          channel_type: 'private',
          message_text: messageText.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao enviar mensagem privada:', err);
      setError(err.message);
      return null;
    }
  }, [user]);

  // Enviar mensagem em canal global
  const sendGlobalMessage = useCallback(async (channelName, messageText) => {
    if (!user || !channelName || !messageText.trim()) return null;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: null,
          channel_type: 'global',
          channel_name: channelName,
          message_text: messageText.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao enviar mensagem global:', err);
      setError(err.message);
      return null;
    }
  }, [user]);

  // Enviar mensagem em canal baseado em role
  const sendRoleMessage = useCallback(async (roleName, messageText) => {
    if (!user || !roleName || !messageText.trim()) return null;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: null,
          channel_type: 'role',
          channel_name: roleName,
          message_text: messageText.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao enviar mensagem de role:', err);
      setError(err.message);
      return null;
    }
  }, [user]);

  // Marcar mensagem como lida
  const markMessageAsRead = useCallback(async (messageId) => {
    if (!user || !messageId) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('receiver_id', user.id);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao marcar mensagem como lida:', err);
      setError(err.message);
      return false;
    }
  }, [user]);

  // Marcar conversa como lida
  const markConversationAsRead = useCallback(async (otherUserId) => {
    if (!user || !otherUserId) return 0;

    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('channel_type', 'private')
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .select('id');
      
      if (error) throw error;
      return data?.length || 0;
    } catch (err) {
      console.error('Erro ao marcar conversa como lida:', err);
      setError(err.message);
      return 0;
    }
  }, [user]);

  // Deletar mensagem
  const deleteMessage = useCallback(async (messageId) => {
    if (!user || !messageId) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao deletar mensagem:', err);
      setError(err.message);
      return false;
    }
  }, [user]);

  // Configurar realtime para mensagens privadas
  const subscribeToPrivateMessages = useCallback((otherUserId) => {
    if (!user || !otherUserId) return null;

    const channel = supabase
      .channel(`private_messages_${user.id}_${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `and(channel_type.eq.private,or(and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})))`
        },
        (payload) => {
          console.log('Nova mensagem privada:', payload);
          // Atualizar mensagens em tempo real
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? payload.new : msg
            ));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return channel;
  }, [user]);

  // Configurar realtime para mensagens de canal
  const subscribeToChannelMessages = useCallback((channelName, channelType = 'global') => {
    if (!user || !channelName) return null;

    const channel = supabase
      .channel(`channel_messages_${channelName}_${channelType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `and(channel_type.eq.${channelType},channel_name.eq.${channelName})`
        },
        (payload) => {
          console.log('Nova mensagem no canal:', payload);
          // Atualizar mensagens do canal em tempo real
          if (payload.eventType === 'INSERT') {
            setChannelMessages(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setChannelMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? payload.new : msg
            ));
          } else if (payload.eventType === 'DELETE') {
            setChannelMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return channel;
  }, [user]);

  // Configurar realtime para conversas
  const subscribeToConversations = useCallback(() => {
    if (!user) return null;

    const channel = supabase
      .channel(`conversations_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
        },
        (payload) => {
          console.log('Atualização em conversa:', payload);
          // Recarregar conversas quando houver mudanças
          fetchConversations();
        }
      )
      .subscribe();

    return channel;
  }, [user, fetchConversations]);

  // Buscar usuários para iniciar conversas
  const searchUsers = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) return [];

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role, avatar_url')
        .ilike('name', `%${searchTerm}%`)
        .neq('id', user?.id)
        .limit(10);
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError(err.message);
      return [];
    }
  }, [user]);

  // Definir canais disponíveis baseados no role do usuário
  useEffect(() => {
    if (!user) return;

    const availableChannels = [
      { name: 'Franqueados', type: 'global', description: 'Canal geral para todos os franqueados' }
    ];

    // Adicionar canais baseados em role
    if (user.role === 'gerente') {
      availableChannels.push({
        name: 'Gerentes',
        type: 'role_based',
        description: 'Canal exclusivo para gerentes'
      });
    } else if (user.role === 'funcionario') {
      availableChannels.push({
        name: 'Funcionários',
        type: 'role_based',
        description: 'Canal exclusivo para funcionários'
      });
    } else if (user.role === 'caixa') {
      availableChannels.push({
        name: 'Caixas',
        type: 'role_based',
        description: 'Canal exclusivo para caixas'
      });
    }

    setChannels(availableChannels);
  }, [user]);

  // Carregar conversas iniciais
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Buscar grupos do usuário
  const fetchUserGroups = useCallback(async (userId) => {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('chat_group_members')
        .select(`
          group_id,
          chat_groups (
            id,
            name,
            description,
            group_type,
            created_at,
            created_by
          )
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      return data?.map(item => item.chat_groups) || [];
    } catch (err) {
      console.error('Erro ao buscar grupos do usuário:', err);
      setError(err.message);
      return [];
    }
  }, []);

  // Buscar mensagens de um grupo
  const fetchGroupMessages = useCallback(async (groupId, limit = 50, offset = 0) => {
    if (!groupId) return [];

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(id, name, email)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar mensagens do grupo:', err);
      setError(err.message);
      return [];
    }
  }, []);

  // Buscar última mensagem de um grupo
  const fetchGroupLastMessage = useCallback(async (groupId) => {
    if (!groupId) return null;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(id, name, email)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      console.error('Erro ao buscar última mensagem do grupo:', err);
      return null;
    }
  }, []);

  // Enviar mensagem em grupo
  const sendGroupMessage = useCallback(async (groupId, messageText, attachment = null) => {
    if (!user || !groupId || (!messageText.trim() && !attachment)) return null;

    try {
      const messageData = {
        sender_id: user.id,
        group_id: groupId,
        message_text: messageText.trim(),
        message_type: attachment ? attachment.type : 'text'
      };

      if (attachment) {
        messageData.file_url = attachment.url;
        messageData.file_name = attachment.name;
        messageData.file_size = attachment.size;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          *,
          sender:users!sender_id(id, name, email)
        `)
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao enviar mensagem no grupo:', err);
      setError(err.message);
      return null;
    }
  }, [user]);

  // Upload de arquivo
  const uploadFile = useCallback(async (file) => {
    if (!file || !user) return null;

    try {
      const fileExt = file.name?.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Converter URI para blob se necessário
      let fileData = file;
      if (file.uri) {
        const response = await fetch(file.uri);
        fileData = await response.blob();
      }

      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(fileName, fileData, {
          contentType: file.type || 'application/octet-stream',
          upsert: false
        });

      if (error) throw error;

      // Obter URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Erro ao fazer upload do arquivo:', err);
      setError(err.message);
      return null;
    }
  }, [user]);

  // Configurar realtime para mensagens de grupo
  const subscribeToGroupMessages = useCallback((groupId, onNewMessage) => {
    if (!groupId) return null;

    const channel = supabase
      .channel(`group_messages_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          console.log('Nova mensagem no grupo:', payload);
          
          // Buscar dados completos da mensagem com informações do sender
          const { data, error } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!sender_id(id, name, email)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data && onNewMessage) {
            onNewMessage(data);
          }
        }
      )
      .subscribe();

    return channel;
  }, []);

  // Configurar realtime para atualizações de grupos
  const subscribeToGroupUpdates = useCallback((onGroupUpdate) => {
    if (!user) return null;

    const channel = supabase
      .channel(`group_updates_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Atualização em grupo:', payload);
          if (onGroupUpdate) {
            onGroupUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return channel;
  }, [user]);

  return {
    // Estados
    conversations,
    messages,
    channels,
    channelMessages,
    loading,
    error,
    
    // Funções existentes
    fetchConversations,
    fetchPrivateMessages,
    fetchChannelMessages,
    sendPrivateMessage,
    sendGlobalMessage,
    sendRoleMessage,
    markMessageAsRead,
    markConversationAsRead,
    deleteMessage,
    searchUsers,
    
    // Novas funções para grupos
    fetchUserGroups,
    fetchGroupMessages,
    fetchGroupLastMessage,
    sendGroupMessage,
    uploadFile,
    
    // Realtime existente
    subscribeToPrivateMessages,
    subscribeToChannelMessages,
    subscribeToConversations,
    
    // Novo realtime para grupos
    subscribeToGroupMessages,
    subscribeToGroupUpdates,
    
    // Utilitários
    clearError: () => setError(null)
  };
};