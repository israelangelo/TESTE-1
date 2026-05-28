import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDoYksgjbztjd8sqjtmXS31TryLAcrECIk",
  authDomain: "box-agencia-pt2.firebaseapp.com",
  projectId: "box-agencia-pt2",
  storageBucket: "box-agencia-pt2.firebasestorage.app",
  messagingSenderId: "818998444622",
  appId: "1:818998444622:web:d21e0004ba4ba51cadf91f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);