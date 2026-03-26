import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration - These will need to be replaced with actual values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// VAPID key for web push
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Initialize Firebase
let app;
let messaging;

try {
  // Check if config exists before attempting initialization
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('Firebase initialized successfully');
  } else {
    console.warn('Firebase Messaging: Missing configuration. Check your .env file.');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Register service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);

        if (!messaging) {
          console.warn('Firebase Messaging: Unable to get token because messaging is not initialized.');
          return null;
        }

        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        });
        
        if (token) {
          console.log('FCM Token:', token);
          return token;
        } else {
          console.log('No registration token available');
          return null;
        }
      }
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Listen for foreground messages (returns unsubscribe function)
export const onMessageListener = (callback) => {
  if (!messaging) {
    console.warn('Firebase Messaging: onMessageListener called, but messaging is not initialized.');
    return () => {};
  }
  return onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    callback(payload);
  });
};

export { messaging };
