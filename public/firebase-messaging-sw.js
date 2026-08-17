import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// Firebase client config is public by design — these values are safe to expose.
// Service workers cannot access import.meta.env, so they must be hardcoded here.
// Keep in sync with src/config/firebase.js env vars.
const firebaseConfig = {
  apiKey: "AIzaSyBAO_s-bqHwNjcaia7ZiNd3fNaCWuHq8Ys",
  authDomain: "social-app-b3159.firebaseapp.com",
  projectId: "social-app-b3159",
  storageBucket: "social-app-b3159.firebasestorage.app",
  messagingSenderId: "631064150363",
  appId: "1:631064150363:web:432532ce2f2296ef0c1a7e",
  measurementId: "G-G5MN1C06BM",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  const { title, body } = payload.notification || {};

  self.registration.showNotification(title || "Rock Diet", {
    body: body || "You have a new notification",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: payload.data?.tag || "rock-diet-notification",
    data: {
      url: payload.data?.click_action || "/admin",
    },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/admin";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
