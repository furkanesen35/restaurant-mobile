// Get environment variables from Expo's environment
const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.110:3000",
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
};

// Validate required environment variables
if (!ENV.STRIPE_PUBLISHABLE_KEY && __DEV__) {
  console.warn(
    "⚠️  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in .env file"
  );
}

export default ENV;
