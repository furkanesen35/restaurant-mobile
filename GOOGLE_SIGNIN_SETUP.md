# Google Sign-In Setup Guide

## Prerequisites

- Google Cloud Console account
- Android/iOS app configured in Google Cloud Console

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**

## Step 2: Create OAuth 2.0 Credentials

### For Android:

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Android** as application type
4. Get your SHA-1 fingerprint:
   ```bash
   cd android
   ./gradlew signingReport
   ```
   Or for debug keystore:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
5. Enter your package name: `com.yourcompany.restaurantmobile` (check app.json)
6. Enter the SHA-1 fingerprint
7. Click **Create**

### For Web Client (Required):

1. Create another OAuth client ID
2. Select **Web application**
3. Add authorized redirect URIs if needed
4. Click **Create**
5. **Copy the Web Client ID** - you'll need this!

## Step 3: Update Your App

### Update `src/screens/LoginScreen.tsx`:

Replace `YOUR_WEB_CLIENT_ID.apps.googleusercontent.com` with your actual Web Client ID from Step 2.

```typescript
GoogleSignin.configure({
  webClientId: "YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com",
  offlineAccess: true,
});
```

### For Android (android/app/build.gradle):

No additional configuration needed if you've set up OAuth correctly.

### For iOS:

1. Add to `ios/Podfile`:
   ```ruby
   pod 'GoogleSignIn', '~> 7.0'
   ```
2. Run `cd ios && pod install`
3. Add URL scheme to `ios/Info.plist`:
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>YOUR_REVERSED_CLIENT_ID</string>
       </array>
     </dict>
   </array>
   ```
   (Get reversed client ID from GoogleService-Info.plist)

## Step 4: Test

1. Restart your app
2. Click "Sign in with Google"
3. Select a Google account
4. You should be signed in!

## Troubleshooting

### "Developer Error" or "Sign-in failed"

- Verify your Web Client ID is correct
- Make sure SHA-1 fingerprint matches your keystore
- Check package name matches your app

### "SIGN_IN_REQUIRED"

- User canceled sign-in
- This is normal behavior

### "PLAY_SERVICES_NOT_AVAILABLE"

- Update Google Play Services on your Android device
- Use a physical device or emulator with Google Play

## Backend Configuration

The backend already supports Google Sign-In at `/auth/google` endpoint.
No additional backend configuration needed!

## Security Notes

- Never commit your Web Client ID to public repositories
- Use environment variables for production
- Keep your SHA-1 fingerprints secure
