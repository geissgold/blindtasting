# Blind Tasting App 🍷 - by !!G

A simple, elegant web app for running blind tastings—designed for wine, coffee, spirits, or anything you want to rate as a group.  
**Live App:** [https://tasting.hallofmirth.us](https://tasting.hallofmirth.us)

## Features

- Create a new tasting event, set the number of items, and instantly get a join code + QR code.
- Participants rate each item on a scale (with private notes).
- Host sees results, can add item names for the “reveal,” and can download data.
- Participants can see final results and download them if desired.
- Participants can see their own scores and notes.
- Google sign-in for privacy and simplicity. Email sign-in provided (pay attention to the instructions!)
- Works perfectly on mobile or desktop.

---

## How to Use

### 1. Host: Start a New Tasting

1. Go to [https://tasting.hallofmirth.us](https://tasting.hallofmirth.us) and sign in with Google. *It is recommended that all participants log in on this screen first to avoid issues with stale logins etc...*
2. Enter a name for your tasting and the number of items to be rated.
3. Click **Create**.  
   - You’ll get a unique code, a join link (e.g., `https://tasting.hallofmirth.us/join/ABC123`), and a QR code.
4. **Share the code, link, or QR code** with your tasters (they just scan or tap to join).

### 2. Tasters: Join and Rate

1. Visit the link or scan the QR code (works on any phone).
2. Sign in with Google (or email method).
3. Tasters can help other guests join via **code, link or QR code** as they arrive!
4. Rate each item and add private notes if you wish.
5. Click **Save My Ratings** at any time (recommended to ensure your scores keep!).  
   - You can come back and edit until the host closes the tasting.

### 3. Host: Reveal & Results

1. When everyone’s done, go to the event’s results page (from “My Tastings”).
2. Add item names for the reveal (optional, but fun!).
3. **Close the tasting** to finalize results.
4. Display the results for your guests from your phone or a PC!
5. Download results as CSV, or share the results link or QR code for participants.

### 4. Participants: Download Results

- After the host closes the tasting, you can revisit the event link to see and download the final results.
- You can revisit your past tastings (whether you were a host or participant) and see your scores/notes.

---

## FAQ

### Can I use the app for coffee, spirits, or other things?

> Yes—just name your event accordingly.

### Are my ratings private?

> Only you and the host can see your ratings; your notes are never public.

### Can I delete or revisit past tastings?

> Yes! Go to **My Tastings** to view, manage, or delete any event you’ve created.

### Will this work on mobile?

> Yes. The app is fully responsive and works great on phones and tablets.
---

## For Developers

- This app is built with React, Material UI, Firebase Hosting, Firestore, and Firebase Auth.
- To run locally, clone the repo, add your own Firebase config, and run `npm install && npm start`.

---

## License

MIT License. See LICENSE file.


**Cheers and happy tasting! 🍷**
