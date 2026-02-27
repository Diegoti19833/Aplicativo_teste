import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#129151',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.log('Project ID not found');
    }
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
    } catch (e) {
      token = `${e}`;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export function useNotifications() {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationListener = useRef();
  const responseListener = useRef();

  // Registrar Expo Push Token e salvar no Supabase
  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync().then(async token => {
      if (token) {
        setExpoPushToken(token);
        try {
          // Salvar token no Supabase para envio futuro via backend
          await supabase.from('users').update({ expo_push_token: token }).eq('id', user.id);
        } catch (e) {
          console.log('Error saving push token to user', e);
        }
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Notification received while app is running
      // console.log(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // User tapped the notification
      // console.log(response);
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [user]);

  // Buscar histórico e escutar Supabase Realtime para In-App Notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchInAppNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (data && !error) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      } catch (e) { console.log('Error fetching notifications', e); }
    };

    fetchInAppNotifications();

    // Setup Realtime listener
    const notificationSubscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotif = payload.new;
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Disparar Push local caso ele esteja com o app aberto? 
        // Pra esse caso o backend deve gerenciar via Expo Push API, mas para UX imediata:
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationSubscription);
    };
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (!error) {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) { console.log('Error marking as read', e); }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (e) { console.log('Error marking all as read', e); }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (!error) {
        // Find if it was unread to decrement counter
        const wasUnread = notifications.find(n => n.id === notificationId)?.is_read === false;

        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (e) { console.log('Error deleting notification', e); }
  };

  return {
    expoPushToken,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}
