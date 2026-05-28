import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const CORES = {
  bg: "#010e2e",
  card: "#0d1b3e",
  border: "#1a2f5e",
  orange: "#E06820",
  muted: "#aab4cc",
  green: "#4caf50",
  greenBg: "#0a3d1f",
  red: "#f44336",
  redBg: "#3d0a0a",
  yellow: "#f9a825",
  yellowBg: "#3d2a00",
};

export default function Relatorios() {
  const navigate = useNavigate();

  const [checkins, setCheckins] = useState([]);
  const [rupturas, setRupturas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const [modalFiltro, setModalFiltro] = useState(false);
  const [animandoModal, setAnimandoModal] = useState(false);

  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [dataInicio, setDataInicio] = useState(
    primeiroDiaMes.toISOString().split("T")[0]
  );
  const [dataFim, setDataFim] = useState(hoje.toISOString().split("T")[0]);
  const [dataInicioTemp, setDataInicioTemp] = useState(dataInicio);
  const [dataFimTemp, setDataFimTemp] = useState(dataFim);
  const [abaAtiva, setAbaAtiva] = useState("checkins");

  const overlayRef = useRef(null);

  async function buscarDados(inicio, fim) {
    setCarregando(true);
    try {
      const tsInicio = Timestamp.fromDate(new Date(inicio + "T00:00:00"));
      const tsFim = Timestamp.fromDate(new Date(fim + "T23:59:59"));

      const [snapCheckins, snapRupturas] = await Promise.all([
        getDocs(
          query(
            collection(db, "checkins"),
            where("criadoEm", ">=", tsInicio),
            where("criadoEm", "<=", tsFim),
            orderBy("criadoEm", "desc")
          )
        ),
        getDocs(
          query(
            collection(db, "rupturas"),
            where("criadoEm", ">=", tsInicio),
            where("criadoEm", "<=", tsFim),
            orderBy("criadoEm", "desc")
          )
        ),
      ]);

      setCheckins(snapCheckins.docs.map((d) => ({ id: d.id, ...d.data() })));
      setRupturas(snapRupturas.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscarDados(dataInicio, dataFim);
  }, []);

  function abrirFiltro() {
    setDataInicioTemp(dataInicio);
    setDataFimTemp(dataFim);
    setModalFiltro(true);
    requestAnimationFrame(() => setAnimandoModal(true));
  }

  function fecharFiltro() {
    setAnimandoModal(false);
    setTimeout(() => setModalFiltro(false), 380);
  }

  function aplicarFiltro() {
    setDataInicio(dataInicioTemp);
    setDataFim(dataFimTemp);
    fecharFiltro();
    buscarDados(dataInicioTemp, dataFimTemp);
  }

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) fecharFiltro();
  }

  function formatarData(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function formatarDataSimples(str) {
    if (!str) return "";
    const [y, m, d] = str.split("-");
    return `${d}/${m}/${y}`;
  }

  function gerarPDF() {
    setGerandoPDF(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const periodoLabel = `${formatarDataSimples(dataInicio)} a ${formatarDataSimples(dataFim)}`;

        doc.setFillColor(1, 14, 46);
        doc.rect(0, 0, 210, 40, "F");
        doc.setTextColor(224, 104, 32);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("BOX AGÊNCIA", 14, 18);
        doc.setTextColor(170, 180, 204);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Relatório de Atividades", 14, 26);
        doc.text(`Período: ${periodoLabel}`, 14, 33);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 38);

        let y = 50;

        doc.setTextColor(76, 175, 80);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(`Check-ins (${checkins.length})`, 14, y);
        y += 8;

        if (checkins.length === 0) {
          doc.setTextColor(170, 180, 204);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text("Nenhum check-in no período.", 14, y);
          y += 10;
        } else {
          autoTable(doc, {
            startY: y,
            head: [["Promotor", "Data / Hora", "Precisão (m)"]],
            body: checkins.map((c) => [
              c.promotorNome || "—",
              formatarData(c.criadoEm),
              c.precisao ? `${Math.round(c.precisao)}m` : "—",
            ]),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [10, 61, 31], textColor: [76, 175, 80], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [240, 248, 243] },
            margin: { left: 14, right: 14 },
          });
          y = doc.lastAutoTable.finalY + 12;
        }

        doc.setTextColor(244, 67, 54);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(`Rupturas (${rupturas.length})`, 14, y);
        y += 8;

        if (rupturas.length === 0) {
          doc.setTextColor(170, 180, 204);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text("Nenhuma ruptura no período.", 14, y);
        } else {
          autoTable(doc, {
            startY: y,
            head: [["Produto", "Motivo", "Promotor", "Data"]],
            body: rupturas.map((r) => [
              r.produto || "—",
              r.motivo || "—",
              r.promotorNome || "—",
              formatarData(r.criadoEm),
            ]),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [61, 10, 10], textColor: [244, 67, 54], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [255, 245, 245] },
            margin: { left: 14, right: 14 },
          });
        }

        const totalPags = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPags; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(170, 180, 204);
          doc.text(`Box Agência — ${periodoLabel} — Página ${i} de ${totalPags}`, 14, 290);
        }

        doc.save(`relatorio_boxagencia_${dataInicio}_${dataFim}.pdf`);
      } catch (e) {
        console.error("Erro ao gerar PDF:", e);
        alert("Erro ao gerar PDF. Tente novamente.");
      } finally {
        setGerandoPDF(false);
      }
    }, 100);
  }

  function compartilharWhatsApp() {
    const periodo = `${formatarDataSimples(dataInicio)} a ${formatarDataSimples(dataFim)}`;
    const texto = encodeURIComponent(
      `📊 *Relatório Box Agência*\n📅 Período: ${periodo}\n\n` +
      `✅ Check-ins: ${checkins.length}\n` +
      `⚠️ Rupturas: ${rupturas.length}\n\n` +
      `_Gerado pelo sistema Box Agência_`
    );
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  }

  const s = estilos();

  return (
    <div style={s.container}>
      {/* HEADER */}
      <div style={s.header}>
        <button onClick={() => navigate("/gestor")} style={s.btnVoltar}>←</button>
        <span style={s.titulo}>Relatórios</span>
        <button onClick={abrirFiltro} style={s.btnFiltro}>🗓 Filtrar</button>
      </div>

      {/* PERÍODO */}
      <div style={s.periodoBar}>
        <span style={s.periodoLabel}>
          📅 {formatarDataSimples(dataInicio)} → {formatarDataSimples(dataFim)}
        </span>
      </div>

      {/* STATS */}
      <div style={s.statsRow}>
        <div style={{ ...s.statCard, borderColor: CORES.green }}>
          <span style={{ ...s.statNum, color: CORES.green }}>{checkins.length}</span>
          <span style={s.statLabel}>Check-ins</span>
        </div>
        <div style={{ ...s.statCard, borderColor: CORES.red }}>
          <span style={{ ...s.statNum, color: CORES.red }}>{rupturas.length}</span>
          <span style={s.statLabel}>Rupturas</span>
        </div>
      </div>

      {/* BOTÕES */}
      <div style={s.acoesRow}>
        <button
          onClick={gerarPDF}
          disabled={gerandoPDF || carregando}
          style={{ ...s.btnAcao, background: CORES.orange, opacity: gerandoPDF || carregando ? 0.6 : 1 }}
        >
          {gerandoPDF ? "⏳ Gerando..." : "📄 Gerar PDF"}
        </button>
        <button
          onClick={compartilharWhatsApp}
          disabled={carregando}
          style={{ ...s.btnAcao, background: "#25D366", opacity: carregando ? 0.6 : 1 }}
        >
          💬 WhatsApp
        </button>
      </div>

      {/* ABAS */}
      <div style={s.abas}>
        <button
          onClick={() => setAbaAtiva("checkins")}
          style={{
            ...s.aba,
            borderBottom: abaAtiva === "checkins" ? `2px solid ${CORES.green}` : "2px solid transparent",
            color: abaAtiva === "checkins" ? CORES.green : CORES.muted,
          }}
        >
          ✅ Check-ins ({checkins.length})
        </button>
        <button
          onClick={() => setAbaAtiva("rupturas")}
          style={{
            ...s.aba,
            borderBottom: abaAtiva === "rupturas" ? `2px solid ${CORES.red}` : "2px solid transparent",
            color: abaAtiva === "rupturas" ? CORES.red : CORES.muted,
          }}
        >
          ⚠️ Rupturas ({rupturas.length})
        </button>
      </div>

      {/* LISTA */}
      <div style={s.lista}>
        {carregando ? (
          <div style={s.vazio}>⏳ Carregando...</div>
        ) : abaAtiva === "checkins" ? (
          checkins.length === 0 ? (
            <div style={s.vazio}>Nenhum check-in no período.</div>
          ) : (
            checkins.map((c) => (
              <div key={c.id} style={s.card}>
                <div style={s.cardRow}>
                  <span style={{ ...s.badge, background: CORES.greenBg, color: CORES.green }}>✅ Check-in</span>
                  <span style={s.cardData}>{formatarData(c.criadoEm)}</span>
                </div>
                <div style={s.cardNome}>{c.promotorNome || "Promotor"}</div>
                {c.precisao && (
                  <div style={s.cardInfo}>📍 Precisão: {Math.round(c.precisao)}m</div>
                )}
              </div>
            ))
          )
        ) : rupturas.length === 0 ? (
          <div style={s.vazio}>Nenhuma ruptura no período.</div>
        ) : (
          rupturas.map((r) => (
            <div key={r.id} style={s.card}>
              <div style={s.cardRow}>
                <span style={{ ...s.badge, background: CORES.redBg, color: CORES.red }}>⚠️ Ruptura</span>
                <span style={s.cardData}>{formatarData(r.criadoEm)}</span>
              </div>
              <div style={s.cardNome}>{r.produto || "Produto não informado"}</div>
              <div style={s.cardInfo}>Motivo: {r.motivo || "—"}</div>
              <div style={s.cardInfo}>Promotor: {r.promotorNome || "—"}</div>
            </div>
          ))
        )}
      </div>

      {/* MODAL FILTRO */}
      {modalFiltro && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          style={{
            ...s.overlay,
            opacity: animandoModal ? 1 : 0,
            transition: "opacity 380ms cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          <div
            style={{
              ...s.modal,
              transform: animandoModal ? "translateY(0)" : "translateY(100%)",
              transition: "transform 380ms cubic-bezier(0.32,0.72,0,1)",
              willChange: "transform",
            }}
          >
            <div style={s.dragHandle} />
            <div style={s.modalTitulo}>Filtrar por Período</div>

            <label style={s.label}>Data Início</label>
            <input
              type="date"
              value={dataInicioTemp}
              onChange={(e) => setDataInicioTemp(e.target.value)}
              style={s.input}
            />

            <label style={s.label}>Data Fim</label>
            <input
              type="date"
              value={dataFimTemp}
              onChange={(e) => setDataFimTemp(e.target.value)}
              style={s.input}
            />

            <button onClick={aplicarFiltro} style={s.btnPrincipal}>
              Aplicar Filtro
            </button>
            <button onClick={fecharFiltro} style={s.btnCancelar}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function estilos() {
  return {
    container: {
      minHeight: "100vh",
      background: CORES.bg,
      color: "#fff",
      fontFamily: "'Barlow', sans-serif",
      maxWidth: 480,
      margin: "0 auto",
      paddingBottom: 40,
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 16px 12px",
      borderBottom: `1px solid ${CORES.border}`,
    },
    btnVoltar: {
      background: "none",
      border: "none",
      color: CORES.orange,
      fontSize: "clamp(18px, 5vw, 22px)",
      cursor: "pointer",
      padding: "4px 8px",
    },
    titulo: {
      fontSize: "clamp(16px, 4.5vw, 20px)",
      fontWeight: 700,
    },
    btnFiltro: {
      background: CORES.card,
      border: `1px solid ${CORES.border}`,
      color: CORES.orange,
      fontSize: "clamp(12px, 3.5vw, 14px)",
      borderRadius: 8,
      padding: "7px 12px",
      cursor: "pointer",
      fontFamily: "'Barlow', sans-serif",
    },
    periodoBar: {
      background: CORES.card,
      borderBottom: `1px solid ${CORES.border}`,
      padding: "10px 16px",
      textAlign: "center",
    },
    periodoLabel: {
      fontSize: "clamp(12px, 3.5vw, 14px)",
      color: CORES.muted,
    },
    statsRow: {
      display: "flex",
      gap: 12,
      padding: "16px 16px 0",
    },
    statCard: {
      flex: 1,
      background: CORES.card,
      border: "1px solid",
      borderRadius: 14,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
    },
    statNum: {
      fontSize: "clamp(26px, 7vw, 32px)",
      fontWeight: 800,
    },
    statLabel: {
      fontSize: "clamp(11px, 3vw, 13px)",
      color: CORES.muted,
    },
    acoesRow: {
      display: "flex",
      gap: 12,
      padding: "14px 16px 0",
    },
    btnAcao: {
      flex: 1,
      border: "none",
      borderRadius: 10,
      padding: 15,
      color: "#fff",
      fontWeight: 700,
      fontSize: "clamp(13px, 3.8vw, 15px)",
      cursor: "pointer",
      fontFamily: "'Barlow', sans-serif",
    },
    abas: {
      display: "flex",
      margin: "16px 16px 0",
      borderBottom: `1px solid ${CORES.border}`,
    },
    aba: {
      flex: 1,
      background: "none",
      border: "none",
      padding: "10px 0",
      fontSize: "clamp(12px, 3.5vw, 14px)",
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "'Barlow', sans-serif",
      transition: "color 0.2s",
    },
    lista: {
      padding: "12px 16px 0",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    },
    card: {
      background: CORES.card,
      border: `1px solid ${CORES.border}`,
      borderRadius: 14,
      padding: 16,
    },
    cardRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    badge: {
      fontSize: "clamp(10px, 2.8vw, 12px)",
      fontWeight: 700,
      borderRadius: 6,
      padding: "3px 8px",
    },
    cardData: {
      fontSize: "clamp(10px, 2.8vw, 12px)",
      color: CORES.muted,
    },
    cardNome: {
      fontSize: "clamp(14px, 4vw, 16px)",
      fontWeight: 600,
      marginBottom: 4,
    },
    cardInfo: {
      fontSize: "clamp(11px, 3vw, 13px)",
      color: CORES.muted,
      marginTop: 2,
    },
    vazio: {
      textAlign: "center",
      color: CORES.muted,
      fontSize: "clamp(13px, 3.8vw, 15px)",
      padding: "40px 0",
    },
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "flex-end",
      zIndex: 1000,
    },
    modal: {
      width: "100%",
      maxWidth: 480,
      margin: "0 auto",
      background: CORES.card,
      borderRadius: "20px 20px 0 0",
      padding: "12px 20px 40px",
      maxHeight: "90vh",
      overflowY: "auto",
    },
    dragHandle: {
      width: 36,
      height: 4,
      background: CORES.border,
      borderRadius: 99,
      margin: "0 auto 20px",
    },
    modalTitulo: {
      fontSize: "clamp(16px, 4.5vw, 18px)",
      fontWeight: 700,
      marginBottom: 20,
      textAlign: "center",
    },
    label: {
      display: "block",
      fontSize: "clamp(12px, 3.5vw, 13px)",
      color: CORES.muted,
      marginBottom: 6,
      marginTop: 14,
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      background: CORES.bg,
      border: `1px solid ${CORES.border}`,
      borderRadius: 10,
      padding: 13,
      color: "#fff",
      fontSize: "clamp(14px, 4vw, 16px)",
      fontFamily: "'Barlow', sans-serif",
      colorScheme: "dark",
    },
    btnPrincipal: {
      width: "100%",
      background: CORES.orange,
      border: "none",
      borderRadius: 10,
      padding: 15,
      color: "#fff",
      fontWeight: 700,
      fontSize: "clamp(14px, 4vw, 16px)",
      cursor: "pointer",
      marginTop: 24,
      fontFamily: "'Barlow', sans-serif",
    },
    btnCancelar: {
      width: "100%",
      background: "transparent",
      border: `1px solid ${CORES.border}`,
      borderRadius: 10,
      padding: 13,
      color: CORES.muted,
      fontSize: "clamp(14px, 4vw, 16px)",
      cursor: "pointer",
      marginTop: 10,
      fontFamily: "'Barlow', sans-serif",
    },
  };
}