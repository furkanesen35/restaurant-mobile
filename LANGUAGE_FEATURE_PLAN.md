# 🌍 Multi-Language Support - Implementation Plan

## Overview
Add German (DE) and English (EN) language support with persistent user preference.

---

## 1. Design Decisions

### Language Switcher Placement
**Recommended Location:** Profile Screen (alongside Cookie Settings)
- ✅ Accessible but not intrusive
- ✅ Standard placement for app preferences
- ✅ Easy to find for users

**Alternative Options:**
- Login/Register screens (language before authentication)
- Settings tab in Admin panel
- Floating button on home screen (too intrusive)

### Visual Design
**Recommendation: Flag Icons + Abbreviation**

```
┌─────────────────────────────┐
│ 🇩🇪 Deutsch (DE)           │ ← Active
├─────────────────────────────┤
│ 🇬🇧 English (EN)            │
└─────────────────────────────┘
```

**Why flags + text?**
- ✅ Visually appealing and instantly recognizable
- ✅ Accessible for colorblind users (text backup)
- ✅ Clear which language is selected
- ❌ Text-only: less engaging, harder to scan
- ❌ Flag-only: not accessible, ambiguous for some users

### Implementation Libraries

**Option 1: `react-i18next` (Recommended)**
- ✅ Industry standard
- ✅ Automatic pluralization
- ✅ Date/number formatting
- ✅ Namespace support
- ✅ React hooks integration

**Option 2: `expo-localization` + Custom Hook**
- ✅ Lighter weight
- ❌ Manual translation management
- ❌ No built-in pluralization

---

## 2. Technical Architecture

### File Structure
```
src/
├── i18n/
│   ├── index.ts              # i18n configuration
│   ├── languages.ts          # Supported languages
│   └── translations/
│       ├── de.json          # German translations
│       └── en.json          # English translations
├── contexts/
│   └── LanguageContext.tsx  # Language state management
├── components/
│   └── LanguageSwitcher.tsx # Language selection UI
└── hooks/
    └── useTranslation.ts    # Translation hook
```

### Translation File Structure
```json
{
  "common": {
    "yes": "Ja",
    "no": "Nein",
    "cancel": "Abbrechen",
    "save": "Speichern",
    "delete": "Löschen"
  },
  "auth": {
    "login": "Anmelden",
    "register": "Registrieren",
    "email": "E-Mail",
    "password": "Passwort"
  },
  "menu": {
    "categories": "Kategorien",
    "addToCart": "In den Warenkorb",
    "favorites": "Favoriten"
  },
  "orders": {
    "myOrders": "Meine Bestellungen",
    "orderHistory": "Bestellverlauf",
    "pending": "Ausstehend",
    "confirmed": "Bestätigt",
    "preparing": "In Vorbereitung",
    "ready": "Bereit",
    "delivered": "Geliefert",
    "cancelled": "Storniert"
  },
  "profile": {
    "myProfile": "Mein Profil",
    "loyaltyPoints": "Treuepunkte",
    "addresses": "Adressen",
    "paymentMethods": "Zahlungsmethoden",
    "language": "Sprache",
    "logout": "Abmelden"
  }
}
```

---

## 3. Implementation Steps

### Phase 1: Setup (1-2 hours)
1. Install dependencies
   ```bash
   npm install i18next react-i18next
   npm install expo-localization
   npm install @expo/vector-icons
   ```

2. Create i18n configuration
3. Create translation files (DE + EN)
4. Create LanguageContext

### Phase 2: UI Components (1 hour)
1. Create LanguageSwitcher component
2. Add to Profile screen
3. Design language selection modal/screen

### Phase 3: Integration (2-3 hours)
1. Wrap app with i18n provider
2. Replace hardcoded strings in:
   - Auth screens (Login, Register)
   - Main tabs (Menu, Orders, Profile)
   - Common components (buttons, alerts)
   - Cookie consent banner (already in German!)

### Phase 4: Testing (1 hour)
1. Test language switching
2. Verify persistence across app restarts
3. Test RTL support (future: Arabic)
4. Check all screens for missing translations

---

## 4. User Flow

### First Launch
```
1. User opens app
2. Detect system language (German/English)
3. Set app language automatically
4. User can change in Profile → Sprache/Language
```

### Language Change Flow
```
1. User: Profile → Sprache/Language
2. Modal opens with language options:
   ┌─────────────────────────────┐
   │ Sprache wählen / Choose     │
   │ Language                    │
   ├─────────────────────────────┤
   │ ● 🇩🇪 Deutsch (DE)         │
   │ ○ 🇬🇧 English (EN)          │
   └─────────────────────────────┘
3. User selects language
4. App updates immediately (no restart)
5. Preference saved to AsyncStorage
```

---

## 5. Key Features

✅ **Automatic Detection**
- Detect device language on first launch
- Fallback to English if unsupported

✅ **Instant Switching**
- No app restart required
- All screens update immediately

✅ **Persistent Storage**
- Language choice saved locally
- Survives app reinstalls (if using cloud backup)

✅ **Formatted Data**
- Dates: "28. Oktober 2025" (DE) vs "October 28, 2025" (EN)
- Currency: "€10,99" (DE) vs "€10.99" (EN)
- Numbers: "1.000,50" (DE) vs "1,000.50" (EN)

---

## 6. Translation Coverage

### Priority 1 (Must Have)
- ✅ Authentication screens
- ✅ Main navigation tabs
- ✅ Menu screen
- ✅ Cart & Checkout
- ✅ Order status labels
- ✅ Profile screen
- ✅ Error messages

### Priority 2 (Should Have)
- ✅ Admin panel
- ✅ Cookie consent (already done!)
- ✅ Payment screens
- ✅ Reservation screens

### Priority 3 (Nice to Have)
- ✅ Push notifications
- ✅ Email templates (backend)
- ✅ Success messages
- ✅ Tooltips

---

## 7. Accessibility

✅ **Screen Reader Support**
- Both flag and text for clarity
- Proper ARIA labels

✅ **Color Blind Friendly**
- Text labels supplement flags
- Clear visual indicators

✅ **RTL Support (Future)**
- Structure ready for Arabic/Hebrew
- FlexBox layout compatible

---

## 8. Backend Considerations

### Current: Client-Side Only
- Language preference stored locally
- No backend changes needed initially

### Future: Server-Side
- Store user language preference in database
- Send localized emails
- Localized push notifications
- Add `language` field to User model:
  ```prisma
  model User {
    // ...existing fields
    language String @default("de") // "de" | "en"
  }
  ```

---

## 9. Estimated Effort

| Task | Time | Complexity |
|------|------|------------|
| Setup i18n | 1h | Low |
| Create translations | 2h | Medium |
| Language switcher UI | 1h | Low |
| Integrate all screens | 3h | Medium |
| Testing | 1h | Low |
| **Total** | **8h** | **Medium** |

---

## 10. Example Code Snippets

### Using Translation Hook
```tsx
import { useTranslation } from '../hooks/useTranslation';

function MenuScreen() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text>{t('menu.categories')}</Text>
      <Button title={t('menu.addToCart')} />
    </View>
  );
}
```

### Language Switcher Component
```tsx
<TouchableOpacity onPress={() => changeLanguage('de')}>
  <View style={styles.languageOption}>
    <Text style={styles.flag}>🇩🇪</Text>
    <Text>Deutsch (DE)</Text>
    {currentLanguage === 'de' && <Icon name="check" />}
  </View>
</TouchableOpacity>
```

---

## 11. Recommendations

✅ **Start with German as default** (your main market)
✅ **Use flag + abbreviation** for best UX
✅ **Place in Profile screen** for discoverability
✅ **Use `react-i18next`** for robustness
✅ **Translate incrementally** (start with key screens)
✅ **Store preference locally** (no backend needed initially)

---

## Next Steps

1. ✅ Approve design (flags + text, Profile location)
2. ⏳ Install dependencies
3. ⏳ Create translation files
4. ⏳ Implement language switcher
5. ⏳ Replace hardcoded strings
6. ⏳ Test and refine

