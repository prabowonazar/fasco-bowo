import { triggerHaptic } from '../utils/formatters';

export interface InAppToast {
  id: string;
  title: string;
  body: string;
  submissionId?: string;
  type: 'approved' | 'rejected' | 'info';
  timestamp: number;
}

// Check if browser supports notifications
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

// Request permission from the user
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    triggerHaptic(15);
    return permission === 'granted';
  } catch (err) {
    console.warn('Gagal meminta izin notifikasi:', err);
    return false;
  }
}

// Send notification via Service Worker
export async function sendSubmissionNotification(
  title: string,
  body: string,
  submissionId?: string
): Promise<boolean> {
  triggerHaptic(20);

  // Check if browser notifications are allowed
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        const options: any = {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          vibrate: [200, 100, 200],
          tag: 'fasco-' + (submissionId || Date.now()),
          renotify: true,
          data: {
            submissionId,
            url: submissionId ? `/?subId=${submissionId}` : '/'
          }
        };
        await registration.showNotification(title, options);
        return true;
      }
    } catch (err) {
      console.warn('Gagal mengirim via service worker showNotification, mencoba postMessage:', err);
      // Fallback via postMessage
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body,
          data: { submissionId }
        });
        return true;
      }
    }
  }

  return false;
}
