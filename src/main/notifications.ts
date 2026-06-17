// src/main/notifications.ts
// Wrapper das Notificações Nativas do SO (Electron Notification).

import { Notification } from 'electron'
import type { StoreNotification } from './services/store/StoreTracker'

export function sendOsNotification(notification: StoreNotification): void {
  if (!Notification.isSupported()) return
  new Notification({ title: notification.title, body: notification.body }).show()
}
