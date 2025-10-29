# 📱 QR Code Loyalty Points Collection - Implementation Plan

## Overview
Allow customers dining in the restaurant to collect loyalty points by scanning a QR code displayed at the counter or table, without placing an online order.

---

## 1. System Architecture

### High-Level Flow
```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Staff     │ Creates │   Backend    │ Stores  │  Database   │
│  (Admin)    │────────>│   Token      │────────>│   Token     │
└─────────────┘         └──────────────┘         └─────────────┘
                               │
                               │ Generates QR
                               ▼
                        ┌──────────────┐
                        │  QR Code     │
                        │  Display     │
                        └──────────────┘
                               │
                               │ Customer scans
                               ▼
                        ┌──────────────┐
                        │   Mobile     │
                        │   Scanner    │
                        └──────────────┘
                               │
                               │ Validates & Credits
                               ▼
                        ┌──────────────┐
                        │   Backend    │
                        │   +Points    │
                        └──────────────┘
```

---

## 2. Database Schema

### New Model: `VisitToken`
```prisma
model VisitToken {
  id              Int       @id @default(autoincrement())
  code            String    @unique // Random token (e.g., "VISIT-ABC123XYZ")
  points          Int       // Points to award (e.g., 50)
  createdBy       User      @relation("CreatedTokens", fields: [createdById], references: [id])
  createdById     Int
  createdAt       DateTime  @default(now())
  expiresAt       DateTime  // Token expiration (e.g., +24 hours)
  redeemedBy      User?     @relation("RedeemedTokens", fields: [redeemedById], references: [id])
  redeemedById    Int?
  redeemedAt      DateTime?
  isActive        Boolean   @default(true)
  restaurantLocation String? // Optional: "Main Restaurant", "Airport Branch"
  notes           String?   // Admin notes
  
  @@index([code])
  @@index([isActive, expiresAt])
}

// Update User model to add relations
model User {
  // ...existing fields
  createdTokens  VisitToken[] @relation("CreatedTokens")
  redeemedTokens VisitToken[] @relation("RedeemedTokens")
}
```

### Migration
```sql
-- Create VisitToken table
CREATE TABLE "VisitToken" (
  "id" SERIAL PRIMARY KEY,
  "code" TEXT UNIQUE NOT NULL,
  "points" INTEGER NOT NULL,
  "createdById" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP NOT NULL,
  "redeemedById" INTEGER,
  "redeemedAt" TIMESTAMP,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "restaurantLocation" TEXT,
  "notes" TEXT,
  FOREIGN KEY ("createdById") REFERENCES "User"("id"),
  FOREIGN KEY ("redeemedById") REFERENCES "User"("id")
);

CREATE INDEX "VisitToken_code_idx" ON "VisitToken"("code");
CREATE INDEX "VisitToken_active_expires_idx" ON "VisitToken"("isActive", "expiresAt");
```

---

## 3. Backend API Endpoints

### 3.1 Create Visit Token (Admin Only)
```javascript
POST /api/loyalty/tokens
Authorization: Bearer <admin-token>

Request:
{
  "points": 50,
  "expiryHours": 24,  // Optional, default 24
  "location": "Main Restaurant",  // Optional
  "notes": "Weekend promotion"    // Optional
}

Response:
{
  "success": true,
  "token": {
    "id": 123,
    "code": "VISIT-ABC123XYZ",
    "points": 50,
    "qrCodeData": "restaurantapp://loyalty/redeem/VISIT-ABC123XYZ",
    "expiresAt": "2025-10-29T22:00:00Z",
    "createdAt": "2025-10-28T22:00:00Z"
  }
}
```

### 3.2 Redeem Visit Token (Authenticated User)
```javascript
POST /api/loyalty/redeem
Authorization: Bearer <user-token>

Request:
{
  "code": "VISIT-ABC123XYZ"
}

Response Success:
{
  "success": true,
  "pointsAwarded": 50,
  "newBalance": 282,
  "message": "50 Treuepunkte erfolgreich gutgeschrieben!"
}

Response Errors:
{
  "success": false,
  "error": "Token expired",
  "message": "Dieser QR-Code ist abgelaufen"
}
{
  "success": false,
  "error": "Already redeemed",
  "message": "Sie haben diesen QR-Code bereits eingelöst"
}
{
  "success": false,
  "error": "Invalid token",
  "message": "Ungültiger QR-Code"
}
```

### 3.3 List Visit Tokens (Admin Only)
```javascript
GET /api/loyalty/tokens?active=true&page=1&limit=50
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "tokens": [
    {
      "id": 123,
      "code": "VISIT-ABC123XYZ",
      "points": 50,
      "createdAt": "2025-10-28T22:00:00Z",
      "expiresAt": "2025-10-29T22:00:00Z",
      "isActive": true,
      "redeemedBy": null,
      "redeemedAt": null,
      "redemptionCount": 0  // How many users redeemed (if multi-use)
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125
  }
}
```

### 3.4 Deactivate Token (Admin Only)
```javascript
DELETE /api/loyalty/tokens/:tokenId
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "message": "Token deactivated"
}
```

---

## 4. Mobile App Implementation

### 4.1 QR Scanner Screen

**Location:** New screen accessible from:
- Profile → "QR-Code scannen"
- Floating action button on Home/Menu screen
- Deep link: `restaurantapp://loyalty/scan`

**UI Layout:**
```
┌─────────────────────────────────────┐
│  ← QR-Code scannen                  │ Header
├─────────────────────────────────────┤
│                                     │
│   ┌───────────────────────────┐   │
│   │                           │   │
│   │     [Camera Preview]      │   │ Camera viewfinder
│   │                           │   │
│   │     Scan target frame     │   │
│   │                           │   │
│   └───────────────────────────┘   │
│                                     │
│  Scannen Sie den QR-Code an der    │ Instructions
│  Kasse oder am Tisch               │
│                                     │
│  ┌───────────────────────────┐    │
│  │   Code manuell eingeben   │    │ Manual input option
│  └───────────────────────────┘    │
│                                     │
│  💡 Tipp: Halten Sie den Code      │
│     gut beleuchtet für schnelles   │
│     Scannen                        │
└─────────────────────────────────────┘
```

**Dependencies:**
```bash
npm install expo-barcode-scanner
npm install expo-camera
```

**Code Example:**
```tsx
import { BarCodeScanner } from 'expo-barcode-scanner';

function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    
    // Extract code from deep link or raw data
    const code = extractCodeFromData(data);
    
    // Redeem points
    await redeemLoyaltyCode(code);
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
      )}
    </View>
  );
}
```

### 4.2 Manual Code Entry

**Alternative for scanning failures:**
```tsx
function ManualCodeEntry() {
  const [code, setCode] = useState('');

  const handleSubmit = async () => {
    if (code.length < 10) {
      Alert.alert('Fehler', 'Bitte geben Sie einen gültigen Code ein');
      return;
    }
    await redeemLoyaltyCode(code);
  };

  return (
    <Modal visible={showManualEntry}>
      <View style={styles.modalContent}>
        <Text style={styles.title}>Code manuell eingeben</Text>
        <TextInput
          style={styles.input}
          placeholder="VISIT-ABC123XYZ"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
        />
        <Button title="Einlösen" onPress={handleSubmit} />
      </View>
    </Modal>
  );
}
```

### 4.3 Success/Error Feedback

```tsx
function RedemptionFeedback({ points, newBalance }) {
  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.successCard}>
          <LottieView
            source={require('../assets/success-animation.json')}
            autoPlay
            loop={false}
          />
          <Text style={styles.successTitle}>🎉 Erfolg!</Text>
          <Text style={styles.pointsText}>
            +{points} Treuepunkte
          </Text>
          <Text style={styles.balanceText}>
            Neuer Kontostand: {newBalance} Punkte
          </Text>
          <Button title="Großartig!" onPress={closeModal} />
        </View>
      </View>
    </Modal>
  );
}
```

---

## 5. Admin Panel Features

### 5.1 Token Creation Interface

**Location:** Admin Tab → "QR-Codes" section

```tsx
function CreateTokenScreen() {
  return (
    <View>
      <Text>Neuen QR-Code erstellen</Text>
      
      <TextInput
        label="Punkte"
        keyboardType="number-pad"
        value={points}
        onChangeText={setPoints}
      />
      
      <Picker
        label="Gültigkeit"
        items={[
          { label: '1 Stunde', value: 1 },
          { label: '24 Stunden', value: 24 },
          { label: '1 Woche', value: 168 },
        ]}
      />
      
      <TextInput
        label="Standort (optional)"
        value={location}
        onChangeText={setLocation}
      />
      
      <TextInput
        label="Notizen (optional)"
        multiline
        value={notes}
        onChangeText={setNotes}
      />
      
      <Button title="QR-Code erstellen" onPress={createToken} />
    </View>
  );
}
```

### 5.2 QR Code Display

**After creation, show:**
```tsx
function QRCodeDisplay({ token }) {
  return (
    <View style={styles.qrContainer}>
      <QRCode
        value={`restaurantapp://loyalty/redeem/${token.code}`}
        size={300}
        backgroundColor="white"
        color="black"
      />
      
      <Text style={styles.code}>{token.code}</Text>
      <Text style={styles.points}>{token.points} Punkte</Text>
      <Text style={styles.expires}>
        Gültig bis: {formatDate(token.expiresAt)}
      </Text>
      
      <View style={styles.actions}>
        <Button title="Teilen" onPress={shareQR} />
        <Button title="Drucken" onPress={printQR} />
        <Button title="Als Bild speichern" onPress={saveQR} />
      </View>
    </View>
  );
}
```

### 5.3 Token Management List

```tsx
function TokenList() {
  return (
    <FlatList
      data={tokens}
      renderItem={({ item }) => (
        <Card style={styles.tokenCard}>
          <View style={styles.tokenHeader}>
            <Text style={styles.tokenCode}>{item.code}</Text>
            <Badge color={item.isActive ? 'green' : 'red'}>
              {item.isActive ? 'Aktiv' : 'Inaktiv'}
            </Badge>
          </View>
          
          <Text>Punkte: {item.points}</Text>
          <Text>Erstellt: {formatDate(item.createdAt)}</Text>
          <Text>Läuft ab: {formatDate(item.expiresAt)}</Text>
          
          {item.redeemedBy && (
            <View style={styles.redemptionInfo}>
              <Text>Eingelöst von: {item.redeemedBy.name}</Text>
              <Text>Am: {formatDate(item.redeemedAt)}</Text>
            </View>
          )}
          
          <View style={styles.actions}>
            <Button 
              title="QR anzeigen" 
              onPress={() => showQR(item)} 
            />
            <Button 
              title="Deaktivieren" 
              color="red"
              onPress={() => deactivateToken(item.id)} 
            />
          </View>
        </Card>
      )}
    />
  );
}
```

---

## 6. Security & Abuse Prevention

### 6.1 Token Generation
```javascript
// Backend: Generate secure random code
function generateTokenCode() {
  const prefix = 'VISIT';
  const random = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
  // Example: VISIT-A1B2C3D4E5F6G7H8
}
```

### 6.2 Validation Rules
- ✅ Token must be active
- ✅ Token must not be expired
- ✅ User must be authenticated
- ✅ User cannot redeem same token twice (track in database)
- ✅ Rate limiting: Max 5 redemptions per user per hour
- ✅ IP-based fraud detection (optional)

### 6.3 Rate Limiting
```javascript
// Middleware for redemption endpoint
const redemptionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 requests per hour per user
  message: 'Too many redemption attempts, please try again later',
  keyGenerator: (req) => req.user.userId,
});

router.post('/api/loyalty/redeem', 
  authenticate, 
  redemptionRateLimiter, 
  redeemToken
);
```

### 6.4 Audit Trail
```javascript
// Log all redemption attempts
model RedemptionAttempt {
  id          Int      @id @default(autoincrement())
  userId      Int
  tokenCode   String
  success     Boolean
  failReason  String?
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())
}
```

---

## 7. Use Cases & Scenarios

### Scenario 1: Weekend Promotion
```
1. Admin creates token: 100 points, expires in 48 hours
2. QR code displayed on table tents
3. Customers scan while dining
4. Points credited immediately
5. Admin tracks redemption rate
```

### Scenario 2: Check-in Reward
```
1. Customer enters restaurant
2. Staff creates single-use token: 20 points
3. Shows QR on tablet/phone
4. Customer scans with their app
5. Token deactivated after use
```

### Scenario 3: Event Bonus
```
1. Special event (Oktoberfest celebration)
2. Admin creates 200-point token
3. QR code projected on screen
4. All attendees can scan
5. Multi-use token (100 redemptions max)
```

---

## 8. User Flow Diagrams

### Customer Flow
```
1. Customer finishes meal
2. Opens app → Profile → "QR scannen"
3. Grants camera permission (first time)
4. Points camera at QR code on table
5. App reads code automatically
6. Backend validates token
7. Points credited instantly
8. Success animation shown
9. User sees new balance
```

### Staff Flow
```
1. Staff logs into admin panel
2. Admin Tab → QR-Codes → "Neu erstellen"
3. Enters points amount (e.g., 50)
4. Sets expiry (e.g., 24 hours)
5. Clicks "Erstellen"
6. QR code generated and displayed
7. Staff prints or displays on screen
8. Customers can start scanning
```

---

## 9. Implementation Phases

### Phase 1: Backend (4-6 hours)
- [ ] Create database schema & migration
- [ ] Implement token generation logic
- [ ] Create redemption endpoint
- [ ] Add validation & security
- [ ] Create admin CRUD endpoints

### Phase 2: Admin UI (3-4 hours)
- [ ] Token creation form
- [ ] QR code display component
- [ ] Token management list
- [ ] Print/share functionality

### Phase 3: Mobile Scanner (4-5 hours)
- [ ] QR scanner screen
- [ ] Camera permissions handling
- [ ] Manual code entry
- [ ] Success/error feedback
- [ ] Deep link handling

### Phase 4: Testing & Polish (2-3 hours)
- [ ] Test token lifecycle
- [ ] Test security measures
- [ ] Test edge cases (expired, invalid, duplicate)
- [ ] UI polish & animations
- [ ] Error message refinement

**Total Estimated Time: 13-18 hours**

---

## 10. Technical Dependencies

### Backend
```json
{
  "crypto": "built-in",
  "qrcode": "^1.5.3",
  "rate-limiter-flexible": "^2.4.1"
}
```

### Mobile App
```json
{
  "expo-barcode-scanner": "~13.0.1",
  "expo-camera": "~15.0.16",
  "react-native-qrcode-svg": "^6.3.11",
  "lottie-react-native": "^6.5.1"
}
```

---

## 11. Future Enhancements

### Phase 2 Features
- [ ] Multi-use tokens (same code for multiple users)
- [ ] Token templates (save common configurations)
- [ ] Analytics dashboard (redemption rates, popular times)
- [ ] Geofencing (only redeemable within restaurant)
- [ ] NFC support (tap-to-collect alternative)
- [ ] SMS/Email token delivery
- [ ] Batch token generation
- [ ] Custom QR code designs (branded)

---

## 12. Success Metrics

### Track these KPIs:
- 📊 Total tokens created
- 📊 Redemption rate (%)
- 📊 Average points per token
- 📊 Peak redemption times
- 📊 Most popular locations
- 📊 Failed redemption reasons

---

## 13. Recommendations

✅ **Start simple**: Single-use tokens only (Phase 1)
✅ **Security first**: Implement rate limiting from day 1
✅ **User-friendly**: Auto-scan + manual entry option
✅ **Admin-friendly**: Easy QR generation & management
✅ **Track everything**: Audit logs for debugging
✅ **Test thoroughly**: Edge cases matter (expired, duplicate, etc.)

---

## Next Steps

1. ✅ Review and approve plan
2. ⏳ Create database schema
3. ⏳ Implement backend endpoints
4. ⏳ Build admin token creation UI
5. ⏳ Implement mobile QR scanner
6. ⏳ Test end-to-end flow
7. ⏳ Deploy and monitor

