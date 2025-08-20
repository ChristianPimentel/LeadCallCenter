// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "callflow-yg693",
  "appId": "1:162640020014:web:a9bb71c1f47d7ff38ed5bf",
  "storageBucket": "callflow-yg693.firebasestorage.app",
  "apiKey": "AIzaSyAMvWsGoZkg18kr_p4zXI83ZAplJzWkwfU",
  "authDomain": "callflow-yg693.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "162640020014"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db, app };
