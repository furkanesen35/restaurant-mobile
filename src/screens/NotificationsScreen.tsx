import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, IconButton, Avatar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import { formatRelativeTime } from "../utils/validation";
import apiClient from "../utils/apiClient";
import logger from "../utils/logger";

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  data?: any;
  isOpened: boolean;
  openedAt?: string;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      if (!token) return;
      
      if (isRefresh) {
        setRefreshing(true);
        pageNum = 1;
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const response = await apiClient.get<NotificationsResponse>(
          `/notifications/history?page=${pageNum}&limit=20`
        );
        
        const data = response.data;
        if (data) {
          if (pageNum === 1 || isRefresh) {
            setNotifications(data.notifications || []);
          } else {
            setNotifications((prev) => [...prev, ...(data.notifications || [])]);
          }
          setHasMore(pageNum < (data.pagination?.totalPages || 1));
          setPage(pageNum);
        }
      } catch (err: any) {
        logger.error("Error fetching notifications:", err);
        setError(err?.message || t("errors.somethingWentWrong"));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [token, t]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => fetchNotifications(1, true);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNotifications(page + 1);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/opened`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, isOpened: true, openedAt: new Date().toISOString() }
            : n
        )
      );
    } catch (err) {
      logger.error("Error marking notification as read:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      order_status: "receipt",
      order_confirmed: "check-circle",
      order_preparing: "chef-hat",
      order_ready: "package-variant",
      order_delivered: "check-all",
      order_cancelled: "close-circle",
      promotion: "tag",
      loyalty: "star",
      welcome: "hand-wave",
      default: "bell",
    };
    return icons[type] || icons.default;
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      order_status: "#2196f3",
      order_confirmed: "#4caf50",
      order_preparing: "#ff9800",
      order_ready: "#9c27b0",
      order_delivered: "#4caf50",
      order_cancelled: "#f44336",
      promotion: "#e91e63",
      loyalty: "#ffc107",
      welcome: "#00bcd4",
      default: "#e0b97f",
    };
    return colors[type] || colors.default;
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isOpened) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type and data
    if (notification.data?.orderId) {
      (navigation as any).navigate("OrderDetails", { orderId: notification.data.orderId });
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity onPress={() => handleNotificationPress(item)}>
      <Card style={[styles.notificationCard, !item.isOpened && styles.unreadCard]}>
        <Card.Content style={styles.notificationContent}>
          <Avatar.Icon
            size={44}
            icon={getNotificationIcon(item.type)}
            style={[styles.notificationIcon, { backgroundColor: getNotificationColor(item.type) }]}
          />
          <View style={styles.notificationBody}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.isOpened && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationText} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.notificationTime}>
              {formatRelativeTime(item.createdAt)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon size={80} icon="bell-off-outline" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>{t("notifications.noNotifications")}</Text>
      <Text style={styles.emptyText}>
        {t("notifications.noNotificationsDesc") || "You'll see your notifications here"}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            iconColor="#e0b97f"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>{t("notifications.title")}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="#e0b97f"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>{t("notifications.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      {error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchNotifications()}>
            <Text style={styles.retryText}>{t("errors.tryAgain")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#e0b97f"]}
              tintColor="#e0b97f"
            />
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#231a13",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#2d2117",
    borderBottomWidth: 1,
    borderBottomColor: "#3d3127",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "#f5f5f5",
    fontSize: 16,
  },
  errorText: {
    color: "#f44336",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#e0b97f",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#231a13",
    fontWeight: "bold",
  },
  notificationCard: {
    backgroundColor: "#2d2117",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3d3127",
  },
  unreadCard: {
    backgroundColor: "#352a1f",
    borderColor: "#e0b97f30",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationBody: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e0b97f",
    marginLeft: 8,
  },
  notificationText: {
    color: "#b8a68a",
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  notificationTime: {
    color: "#8a7a6a",
    fontSize: 12,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    backgroundColor: "#3d3127",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    color: "#b8a68a",
    fontSize: 14,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
});

export default NotificationsScreen;
