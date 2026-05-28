import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export async function criarGestor() {
  const email = "israel@boxagencia.com";
  const senha = "Box@2026";

  const { user } = await createUserWithEmailAndPassword(auth, email, senha);

  await setDoc(doc(db, "usuarios", user.uid), {
    nome: "Israel",
    email,
    perfil: "gestor",
    criadoEm: new Date(),
  });

  console.log("✅ Gestor criado:", user.uid);
}