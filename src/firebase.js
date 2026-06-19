// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDjkwShkz5wmWL2al5UqkAKNQ2EwZcQsrQ",
  authDomain: "memflix-a2fe9.firebaseapp.com",
  projectId: "memflix-a2fe9",
  storageBucket: "memflix-a2fe9.firebasestorage.app",
  messagingSenderId: "289017544132",
  appId: "1:289017544132:web:e5dde38eb19dc91fa53891",
  measurementId: "G-RXNHQRBF44"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);