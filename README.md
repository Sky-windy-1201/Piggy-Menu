# Couple Menu

Couple Menu is a private mobile-first PWA for Yuhong to pick dishes and send an order summary. The receiving channel can be changed later to email, Telegram, WhatsApp, or another notification flow.

The app works in two modes:

- Local mode: if Firebase Web App config values are blank, the app uses bundled default dishes and localStorage. No raw Firebase setup warning is shown in the app.
- Firebase mode: once `.env` contains the full Firebase Web App config, menu items and orders use Firestore, and PNG dish uploads use Firebase Storage.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

3. Set `VITE_APP_PASSCODE` in `.env`, or let it default to `1201`.

4. Run locally:

```bash
npm run dev
```

5. Build:

```bash
npm run build
```

## Firebase Setup

To turn on Firebase mode:

1. Create a Firebase project.
2. Add a Firebase Web App.
3. Fill in the Firebase Web App values in `.env`.
4. Enable Firestore Database.
5. Enable Firebase Storage.
6. Enable Anonymous Authentication.
7. Deploy `firestore.rules` and `storage.rules`.

The provided Realtime Database URL is included as `VITE_FIREBASE_DATABASE_URL`, but the app still needs the Firebase Web App config values such as API key and app ID. The database URL alone cannot initialize the Firebase Web SDK.

## Environment Variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_DATABASE_URL=https://menu-c75d9-default-rtdb.asia-southeast1.firebasedatabase.app/
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_APP_PASSCODE=1201
```

The passcode is only a simple frontend gate for MVP convenience. It is not strong security because frontend code can be inspected.

## Default Dishes

The app starts with placeholder dishes from `src/data/defaultDishes.ts`. They use bundled placeholder pictures from `public/images`. You can rename and edit them later.

Current starter dishes:

| Dish | Category | Image |
| --- | --- | --- |
| 云朵小炒肉 | 荤菜 | bundled placeholder |
| 月亮青菜 | 素菜 | bundled placeholder |
| 糖醋星星 | 糖醋 | bundled placeholder |
| 红烧小方块 | 红烧 | bundled placeholder |
| 太阳拌饭 | 主食 | bundled placeholder |
| 桃桃气泡饮 | 饮料 | bundled placeholder |

## Add Dishes

Open the app, unlock it, go to Add Dish, fill in the form, and save. Dish pictures are handled by PNG upload or the bundled default picture.

For dish pictures:

- Upload a PNG file.
- If no PNG is uploaded, the app uses a bundled default picture.
- In local mode, uploaded PNGs are stored as local data URLs.
- In Firebase mode, uploaded PNGs go to Firebase Storage and Firestore stores the download URL.

## Telegram Notifications

Without Blaze, the app can send Telegram messages directly from the browser by using these Vite env values:

- `VITE_TELEGRAM_BOT_TOKEN`
- `VITE_TELEGRAM_CHAT_ID`

This is enabled for the private MVP so the order is sent to the Telegram bot chat after Yuhong taps `Send Order`.

Important: Vite exposes every `VITE_` value in the built frontend. Anyone who can inspect the deployed app can see the Telegram bot token and use it to control the bot. This is acceptable only for a private MVP. Rotate the bot token later if the app becomes public or if the token is shared accidentally.

The app also keeps manual backup links. After Yuhong submits an order, she can tap `Share to Telegram` or `Share to WhatsApp` if the automatic client send does not arrive.

Automatic Telegram notification is also implemented with a Firebase Cloud Function in `functions/src/index.ts`. When a new Firestore document is created in `orders`, the function sends a Telegram Bot API `sendMessage` request.

Telegram bots cannot send directly to a phone number. You need:

- `TELEGRAM_BOT_TOKEN`: create a bot with BotFather.
- `TELEGRAM_CHAT_ID`: start a chat with the bot, send it any message, then call Telegram `getUpdates` to find your chat ID.

Useful Telegram API docs:

- `sendMessage`: https://core.telegram.org/bots/api#sendmessage
- `getUpdates`: https://core.telegram.org/bots/api#getupdates

Set Firebase secrets:

```bash
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set TELEGRAM_CHAT_ID
```

Deploy functions:

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

## PWA Install

iPhone: open in Safari, tap Share, then Add to Home Screen.

Android: open in Chrome, then Install app or Add to Home Screen.

## Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init
npm run build
firebase deploy
```

## Firestore Rules

The included MVP rules allow authenticated Firebase users to read, create, and update orders and menu items:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow read, create, update: if request.auth != null;
      allow delete: if false;
    }

    match /menuItems/{dishId} {
      allow read, create, update: if request.auth != null;
      allow delete: if false;
    }
  }
}
```

## Storage Rules

The included Storage rules let authenticated users upload PNG dish images under their own UID folder:

```js
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /dish-images/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType == "image/png";
    }
  }
}
```

## Limitations

- The passcode is frontend-only and not strong security.
- Client-side Telegram sending exposes the bot token in the built app.
- No push notifications yet.
- PNG upload is capped at 5 MB.
- Local mode data stays in the browser.

## Future Improvements

- Move Telegram sending behind a backend function when Blaze is available.
- Restrict Firebase access by allowed UID.
- Add menu edit/delete controls.
- Add image cropping or compression before upload.
