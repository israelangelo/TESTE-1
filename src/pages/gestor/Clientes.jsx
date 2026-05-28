import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const db = getFirestore();

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const snap = await getDocs(collection(db, "clientes"));
      setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCarregando(false);
    }
    carregar();
  }, []);

  return (
    <div style={{ background: "#032774", minHeight: "100dvh", fontFamily: "Barlow, sans-serif", color: "#fff", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={() => navigate("/gestor")} style={{ background: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>←</button>
        <h1 style={{ fontFamily: "Barlow Condensed", fontSize: 24, fontWeight: 700, margin: 0 }}>Clientes</h1>
      </div>

      <div style={{ padding: 16 }}>
        {carregando ? (
          <p style={{ color: "#E06820", textAlign: "center", marginTop: 40 }}>Carregando...</p>
        ) : clientes.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <p style={{ fontSize: 48 }}>💼</p>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Nenhum cliente cadastrado ainda.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {clientes.map(c => (
              <div key={c.id} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 4px" }}>{c.nome}</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>{c.cnpj}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}