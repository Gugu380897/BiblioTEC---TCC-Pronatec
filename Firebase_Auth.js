import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD5ibKlOJNji0FWqrsJ7g3f4w7wUUYvTks",
  authDomain: "bibliotec-ce9d8.firebaseapp.com",
  projectId: "bibliotec-ce9d8",
  storageBucket: "bibliotec-ce9d8.firebasestorage.app",
  messagingSenderId: "462179825065",
  appId: "1:462179825065:web:2f3eb84ff4f45891dd00b8",
  measurementId: "G-RY4363FHKN"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); // NOVO - Realtime Database

export { auth, db };