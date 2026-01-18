import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import logger from "./logger";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and return the Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#e0b97f",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      logger.warn("Push notification permission not granted");
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: "34d8bfb4-2a86-49ed-a4d6-b29eee48d18d",
    })).data;
    
    logger.info("Push token obtained:", token);
    return token;
  } catch (error) {
    logger.error("Error getting push token:", error);
    return null;
  }
}

/**
 * Set up notification listeners for foreground and response events
 */
export function setupNotificationListeners(
  onNotification?: (notification: Notifications.Notification) => void,
  onResponse?: (response: Notifications.NotificationResponse) => void
): () => void {
  const notificationSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      logger.info("Notification received:", notification);
      onNotification?.(notification);
    }
  );

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      logger.info("Notification response:", response);
      onResponse?.(response);
    }
  );

  // Return cleanup function
  return () => {
    notificationSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: trigger || null, // null = immediate
  });

  logger.info("Local notification scheduled:", notificationId);
  return notificationId;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
  logger.info("Notification cancelled:", notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  logger.info("All notifications cancelled");
}

/**
 * Get the badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set the badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}


