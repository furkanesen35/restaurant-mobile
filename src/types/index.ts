// User types
export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt?: string;
  loyaltyPoints?: number;
}

// Menu types
export interface MenuCategory {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  imageUrl?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
  allergens?: string;
  loyaltyPointsMultiplier?: number;
  modifiers?: MenuItemModifier[];
  hasCookingOptions?: boolean;
  allowedCookingPreferences?: string[];
}

// Modifier types
export interface MenuItemModifier {
  id: number;
  menuItemId: number;
  name: string;
  nameEn?: string;
  nameDe?: string;
  price: number;
  category?: string;
  isAvailable: boolean;
  sortOrder: number;
  maxQuantity: number;
}

export interface SelectedModifier {
  modifierId: number;
  quantity: number;
  name?: string;
  price?: number;
}

export interface OrderItemModifier {
  id: number;
  modifierId: number;
  quantity: number;
  priceAtOrder: number;
  modifier?: {
    id: number;
    name: string;
    nameEn?: string;
    nameDe?: string;
  };
}

// Order types
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export type RefundStatus = "pending" | "succeeded" | "failed" | "cancelled";

export interface OrderItem {
  id?: number;
  menuItem: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  modifiers?: OrderItemModifier[];
}

export interface Order {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  estimatedTime?: string;
  estimatedDeliveryTime?: string;
  total?: number;
  // Payment & Refund fields
  paymentIntentId?: string;
  refundId?: string;
  refundStatus?: RefundStatus;
  refundAmount?: number;
  refundedAt?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  refreshToken?: string;
  user: User;
}

// API Response types
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: ValidationError[];
  statusCode?: number;
}

// Navigation types
export interface NavigationProps {
  navigation: any;
  route?: any;
}

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  accent: string;
  text: string;
  subtext: string;
  error: string;
  success: string;
  warning: string;
}

// Component props
export interface LoadingProps {
  visible: boolean;
  message?: string;
}

export interface ErrorMessageProps {
  error?: string | null;
  onDismiss?: () => void;
}

export interface AllowedPostalCode {
  id?: number;
  postalCode: string;
  city: string;
  district?: string | null;
  radiusKm?: number | null;
  isActive?: boolean;
  sortOrder?: number;
}
