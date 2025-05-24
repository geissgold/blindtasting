// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyBeneIc7TJgxH6hDjh2Pac_AieYZH1Elb4",
  authDomain: "blind-tasting-app.firebaseapp.com",
  projectId: "blind-tasting-app",
  storageBucket: "blind-tasting-app.firebasestorage.app",
  messagingSenderId: "673343698540",
  appId: "1:673343698540:web:29bd448623a74a73d34a49",
  measurementId: "G-D0RVTYZGY7"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
