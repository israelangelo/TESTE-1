import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [perfil, setPerfil]           = useState(null);
  const [userData, setUserData]       = useState(null);
  const [carregando, setCarregando]   = useState(true);

  async function carregarDadosUsuario(user) {
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    const dados = snap.exists() ? snap.data() : null;
    setPerfil(dados?.perfil || null);
    setUserData(dados);
    return dados;
  }

  useEffect(() => {
    // Garante persistência LOCAL antes de ouvir mudanças de auth.
    // Assim o Firebase nunca descarta a sessão ao fechar/abrir o app.
    setPersistence(auth, browserLocalPersistence).then(() => {
      const unsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
          await carregarDadosUsuario(user);
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
          setPerfil(null);
          setUserData(null);
        }
        setCarregando(false);
      });
      return unsub;
    });
  }, []);

  async function login(email, senha) {
    // setPersistence já garantido no useEffect, mas reforça aqui também
    await setPersistence(auth, browserLocalPersistence);
    const cred = await signInWithEmailAndPassword(auth, email, senha);
    const dados = await carregarDadosUsuario(cred.user);
    setCurrentUser(cred.user);
    return dados?.perfil;
  }

  async function logout() {
    return signOut(auth);
  }

  async function refreshUserData() {
    if (currentUser) await carregarDadosUsuario(currentUser);
  }

  return (
    <AuthContext.Provider value={{ currentUser, perfil, userData, carregando, login, logout, refreshUserData }}>
      {!carregando && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}