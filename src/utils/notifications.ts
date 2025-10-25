// Note: This file requires expo-notifications package to be installed
// Run: npx expo install expo-notifications
// For now, we'll export stub functions to prevent errors

// Stub functions until expo-notifications is installed
export async function registerForPushNotifications() {
  console.log("Push notifications not configured - install expo-notifications package");
  return null;
}

export function setupNotificationListeners(
  _onNotification?: (notification: any) => void,
  _onResponse?: (response: any) => void
) {
  console.log("Push notifications not configured - install expo-notifications package");
  return () => {};
}

export async function scheduleLocalNotification(
  _title: string,
  _body: string,
  _data?: any
) {
  console.log("Push notifications not configured - install expo-notifications package");
}
