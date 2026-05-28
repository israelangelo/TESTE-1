import { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY",
  authDomain: "COLE_SEU_AUTH_DOMAIN",
  projectId: "box-agencia-pt2",
  storageBucket: "COLE_SEU_STORAGE_BUCKET",
  messagingSenderId: "COLE_SEU_SENDER_ID",
  appId: "COLE_SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        setPerfil(snap.exists() ? snap.data() : null);
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setPerfil(null);
      }
      setCarregando(false);
    });
    return unsub;
  }, []);

  async function login(email, senha) {
    return signInWithEmailAndPassword(auth, email, senha);
  }

  async function logout() {
    return signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ currentUser, perfil, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}