import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [userData, setUserData] = useState(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarDadosUsuario(user) {
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    const dados = snap.exists() ? snap.data() : null;
    setPerfil(dados?.perfil || null);
    setUserData(dados);
    return dados;
  }

  useEffect(() => {
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
  }, []);

  async function login(email, senha) {
    return signInWithEmailAndPassword(auth, email, senha);
  }

  async function logout() {
    return signOut(auth);
  }

  async function refreshUserData() {
    if (currentUser) await carregarDadosUsuario(currentUser);
  }

  return (
    <AuthContext.Provider value={{ currentUser, perfil, userData, carregando, login, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}