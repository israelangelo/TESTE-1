import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../../firebase/config';
import {
  collection, addDoc, serverTimestamp,
  query, where, getDocs, doc, getDoc,
  setDoc, Timestamp, updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import { T, S } from '../../theme/tokens';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const RAIO_MAXIMO    = 200;
const MAX_TENTATIVAS = 3;
const FILA_KEY       = 'boxagencia_fila_checkins';

// 10 tipos de foto PDV
const TIPOS_FOTO = [
  { id: 'gondola_antes',   label: 'Gôndola Antes',   icon: '📦' },
  { id: 'gondola_depois',  label: 'Gôndola Depois',  icon: '✨' },
  { id: 'preco',           label: 'Precificação',     icon: '🏷️' },
  { id: 'estoque',         label: 'Estoque',          icon: '🗃️' },
  { id: 'fachada',         label: 'Fachada',          icon: '🏪' },
  { id: 'ponto_extra',     label: 'Ponto Extra',      icon: '⭐' },
  { id: 'concorrente',     label: 'Concorrente',      icon: '🔍' },
  { id: 'validade',        label: 'Validade',         icon: '📅' },
  { id: 'ruptura',         label: 'Ruptura',          icon: '⚠️' },
  { id: 'material_pop',    label: 'Material POP',     icon: '🎯' },
];

const NAV = [
  { key: 'inicio',  icon: '⊞',  label: 'Início'  },
  { key: 'rota',    icon: '🗺️', label: 'Rota'    },
  { key: 'fotos',   icon: '📷', label: 'Fotos'   },
  { key: 'tarefas', icon: '✓',  label: 'Tarefas' },
  { key: 'perfil',  icon: '👤', label: 'Perfil'  },
];

const TAREFAS_PADRAO = [
  { id: 1, texto: 'Verificar validade dos produtos', feita: false },
  { id: 2, texto: 'Organizar gôndola principal',     feita: false },
  { id: 3, texto: 'Repor estoque de bebidas',        feita: false },
  { id: 4, texto: 'Foto da entrada da loja',         feita: false },
  { id: 5, texto: 'Preencher relatório de ruptura',  feita: false },
];

// ── Fila offline ─────────────────────────────────────────────────────
function lerFila()          { try { return JSON.parse(localStorage.getItem(FILA_KEY) || '[]'); } catch { return []; } }
function salvarFila(fila)   { try { localStorage.setItem(FILA_KEY, JSON.stringify(fila)); } catch {} }
function adicionarFila(item){ const f = lerFila(); f.push(item); salvarFila(f); }
function removerFila(id)    { salvarFila(lerFila().filter(i => i.id !== id)); }

function fileParaBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function uploadComRetry(storageRef, file, onTentativa) {
  let ultimo;
  for (let t = 1; t <= MAX_TENTATIVAS; t++) {
    try {
      onTentativa(t);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (e) {
      ultimo = e;
      if (t < MAX_TENTATIVAS) await new Promise(r => setTimeout(r, t * 1000));
    }
  }
  throw ultimo;
}

export default function PromotorDashboard() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const inputFotoRef      = useRef(null);
  const inputFotoPDVRef   = useRef(null);

  const [aba, setAba]                   = useState('inicio');
  const [checkinAtivo, setCheckinAtivo] = useState(false);
  const [lojaAtual, setLojaAtual]       = useState(null);
  const [tempo, setTempo]               = useState(0);
  const [salvando, setSalvando]         = useState(false);

  const [tarefas, setTarefas]                     = useState([]);
  const [tarefasDocId, setTarefasDocId]           = useState(null);
  const [tarefasCarregando, setTarefasCarregando] = useState(true);
  const [tarefasSalvando, setTarefasSalvando]     = useState(false);

  const [sheet, setSheet]                     = useState(false);
  const [etapa, setEtapa]                     = useState('loja');
  const [lojaSelecionada, setLojaSelecionada] = useState(null);

  const [gpsStatus, setGpsStatus]   = useState('idle');
  const [coords, setCoords]         = useState(null);
  const [distancia, setDistancia]   = useState(null);
  const [coordsTemp, setCoordsTemp] = useState(null);

  const [fotoFile, setFotoFile]       = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const [lojas, setLojas]                   = useState([]);
  const [carregandoRota, setCarregandoRota] = useState(true);
  const [escalaId, setEscalaId]             = useState(null);
  const [rotaConfirmada, setRotaConfirmada] = useState(false);
  const [confirmandoRota, setConfirmandoRota] = useState(false);
  const [lojaDetalhe, setLojaDetalhe]       = useState(null);
  const [sheetLoja, setSheetLoja]           = useState(false);
  const [clientesLoja, setClientesLoja]     = useState([]);

  const [checkinDuplicado, setCheckinDuplicado] = useState(false);
  const [erroCheckin, setErroCheckin]           = useState('');
  const [tentativaAtual, setTentativaAtual]     = useState(0);
  const [filaOffline, setFilaOffline]           = useState([]);
  const [reenviadoBanner, setReenviadoBanner]   = useState(false);
  const [reenviando, setReenviando]             = useState(false);

  // ── Fotos PDV ────────────────────────────────────────────────────────
  const [fotosPDV, setFotosPDV]             = useState([]);  // {tipo, lojaId, lojaNome, url, timestamp}
  const [carregandoFotos, setCarregandoFotos] = useState(true);
  const [tipoFotoAtual, setTipoFotoAtual]   = useState(null); // tipo selecionado para tirar foto
  const [lojaPDVAtual, setLojaPDVAtual]     = useState(null); // loja para foto PDV
  const [enviandoFoto, setEnviandoFoto]     = useState(false);
  const [sheetFoto, setSheetFoto]           = useState(false); // sheet seleção tipo+loja

  // ── Ruptura ──────────────────────────────────────────────────────────
  const [sheetRuptura, setSheetRuptura]     = useState(false);
  const [lojaRuptura, setLojaRuptura]       = useState(null);
  const [skusLoja, setSkusLoja]             = useState([]);  // {sku, feita} 
  const [rupturasSalvando, setRupturasSalvando] = useState(false);

  const nome   = userData?.nome || currentUser?.email?.split('@')[0] || 'Promotor';
  const diaStr = new Date().toISOString().split('T')[0];
  const hoje   = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  // ── Fila offline ─────────────────────────────────────────────────────
  useEffect(() => { setFilaOffline(lerFila()); }, []);

  const reenviarFila = useCallback(async () => {
    if (!currentUser) return;
    const fila = lerFila();
    if (fila.length === 0) return;
    setReenviando(true);
    for (const item of fila) {
      try {
        const resp   = await fetch(item.fotoBase64);
        const blob   = await resp.blob();
        const file   = new File([blob], 'fachada.jpg', { type: blob.type });
        const storageRef = ref(storage, `checkins/${item.uid}/${item.timestamp}.jpg`);
        await uploadBytes(storageRef, file);
        const fotoURL = await getDownloadURL(storageRef);
        await addDoc(collection(db, 'checkins'), {
          uid: item.uid, nome: item.nome,
          lat: item.lat, lng: item.lng, precisao: item.precisao,
          lojaId: item.lojaId, lojaNome: item.lojaNome,
          fotoFachada: fotoURL, tipo: 'checkin', timestamp: serverTimestamp(),
        });
        removerFila(item.id);
        setFilaOffline(lerFila());
      } catch {}
    }
    setReenviando(false);
    const restante = lerFila();
    if (restante.length === 0) setReenviadoBanner(true);
    setFilaOffline(restante);
    setTimeout(() => setReenviadoBanner(false), 4000);
  }, [currentUser]);

  useEffect(() => {
    window.addEventListener('online', reenviarFila);
    return () => window.removeEventListener('online', reenviarFila);
  }, [reenviarFila]);

  // ── Cronômetro ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!checkinAtivo) return;
    const t = setInterval(() => setTempo(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [checkinAtivo]);

  function formatTempo(s) {
    const h   = String(Math.floor(s / 3600)).padStart(2, '0');
    const m   = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const seg = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${seg}`;
  }

  // ── Rota do dia ──────────────────────────────────────────────────────
  useEffect(() => {
    async function buscarRota() {
      if (!currentUser) return;
      try {
        const escalaQ = query(
          collection(db, 'escalas'),
          where('promotorId', '==', currentUser.uid),
          where('data', '==', diaStr)
        );
        const escalaSnap = await getDocs(escalaQ);
        let lojasIds = [];
        escalaSnap.forEach(d => {
          if (d.data().lojas) lojasIds = [...lojasIds, ...d.data().lojas];
          setEscalaId(d.id);
          setRotaConfirmada(d.data().rotaConfirmada === true);
        });
        const lojasData = [];
        for (const id of lojasIds) {
          const lojaDoc = await getDoc(doc(db, 'lojas', id));
          if (lojaDoc.exists()) lojasData.push({ id: lojaDoc.id, ...lojaDoc.data() });
        }
        setLojas(lojasData);
      } catch (e) { console.error(e); }
      setCarregandoRota(false);
    }
    buscarRota();
  }, [currentUser]);

  // ── Tarefas ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function buscarTarefas() {
      if (!currentUser) return;
      setTarefasCarregando(true);
      try {
        const docId = `${currentUser.uid}_${diaStr}`;
        const snap  = await getDoc(doc(db, 'tarefas', docId));
        if (snap.exists()) {
          setTarefas(snap.data().itens || TAREFAS_PADRAO);
          setTarefasDocId(docId);
        } else {
          await setDoc(doc(db, 'tarefas', docId), {
            uid: currentUser.uid, nome, data: diaStr,
            itens: TAREFAS_PADRAO, atualizadoEm: serverTimestamp(),
          });
          setTarefas(TAREFAS_PADRAO);
          setTarefasDocId(docId);
        }
      } catch (e) { console.error(e); }
      setTarefasCarregando(false);
    }
    buscarTarefas();
  }, [currentUser]);

  async function toggleTarefa(id) {
    const novaLista = tarefas.map(t => t.id === id ? { ...t, feita: !t.feita } : t);
    setTarefas(novaLista);
    if (!tarefasDocId) return;
    setTarefasSalvando(true);
    try {
      await setDoc(doc(db, 'tarefas', tarefasDocId), { itens: novaLista, atualizadoEm: serverTimestamp() }, { merge: true });
    } catch (e) { console.error(e); }
    setTarefasSalvando(false);
  }

  // ── Fotos PDV — carrega do dia ───────────────────────────────────────
  useEffect(() => {
    async function buscarFotos() {
      if (!currentUser) return;
      setCarregandoFotos(true);
      try {
        const inicio = Timestamp.fromDate(new Date(diaStr + 'T00:00:00'));
        const fim    = Timestamp.fromDate(new Date(diaStr + 'T23:59:59'));
        const q = query(
          collection(db, 'fotos_pdv'),
          where('uid', '==', currentUser.uid),
          where('timestamp', '>=', inicio),
          where('timestamp', '<=', fim)
        );
        const snap = await getDocs(q);
        setFotosPDV(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      setCarregandoFotos(false);
    }
    buscarFotos();
  }, [currentUser]);

  // ── Tirar foto PDV ───────────────────────────────────────────────────
  async function onFotoPDVSelecionada(e) {
    const file = e.target.files[0];
    if (!file || !tipoFotoAtual || !lojaPDVAtual) return;
    setEnviandoFoto(true);
    try {
      const nomeArq    = `fotos_pdv/${currentUser.uid}/${Date.now()}_${tipoFotoAtual}.jpg`;
      const storageRef = ref(storage, nomeArq);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const novaFoto = {
        uid:      currentUser.uid,
        nome,
        lojaId:   lojaPDVAtual.id,
        lojaNome: lojaPDVAtual.nome,
        tipo:     tipoFotoAtual,
        url,
        timestamp: serverTimestamp(),
      };
      await addDoc(collection(db, 'fotos_pdv'), novaFoto);
      setFotosPDV(prev => [...prev, { ...novaFoto, timestamp: new Date() }]);
    } catch (e) { console.error(e); }
    setEnviandoFoto(false);
    setTipoFotoAtual(null);
    setSheetFoto(false);
    e.target.value = '';
  }

  async function confirmarRota() {
    if (!escalaId || rotaConfirmada) return;
    setConfirmandoRota(true);
    try {
      await updateDoc(doc(db, 'escalas', escalaId), {
        rotaConfirmada: true,
        rotaConfirmadaEm: serverTimestamp(),
        rotaConfirmadaNome: nome,
      });
      setRotaConfirmada(true);
    } catch (e) { console.error(e); }
    setConfirmandoRota(false);
  }

  function abrirSheetFoto(loja) {
    setLojaPDVAtual(loja);
    setSheetFoto(true);
  }

  function selecionarTipoFoto(tipoId) {
    setTipoFotoAtual(tipoId);
    setTimeout(() => inputFotoPDVRef.current?.click(), 100);
  }

  // ── Detalhe da loja (com SKUs e ruptura) ─────────────────────────────
  async function abrirDetalhe(loja) {
    setLojaDetalhe(loja);
    setSheetLoja(true);
    setClientesLoja([]);
    try {
      const q    = query(collection(db, 'clientes'), where('lojas', 'array-contains', loja.id));
      const snap = await getDocs(q);
      setClientesLoja(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  }

  // ── Ruptura ──────────────────────────────────────────────────────────
  async function abrirRuptura(loja) {
    setLojaRuptura(loja);
    setSheetRuptura(true);
    // Busca SKUs dos clientes desta loja
    try {
      const q    = query(collection(db, 'clientes'), where('lojas', 'array-contains', loja.id));
      const snap = await getDocs(q);
      const todos = snap.docs.flatMap(d => d.data().produtos || []);
      // Remove duplicados
      const unicos = [...new Set(todos)];
      // Carrega se já há registro de ruptura hoje
      const docId = `${currentUser.uid}_${loja.id}_${diaStr}`;
      const ruptDoc = await getDoc(doc(db, 'rupturas', docId));
      if (ruptDoc.exists()) {
        setSkusLoja(ruptDoc.data().itens || unicos.map(s => ({ sku: s, ruptura: false })));
      } else {
        setSkusLoja(unicos.map(s => ({ sku: s, ruptura: false })));
      }
    } catch (e) {
      console.error(e);
      setSkusLoja([]);
    }
  }

  function toggleRuptura(sku) {
    setSkusLoja(prev => prev.map(s => s.sku === sku ? { ...s, ruptura: !s.ruptura } : s));
  }

  async function salvarRuptura() {
    if (!lojaRuptura || !currentUser) return;
    setRupturasSalvando(true);
    try {
      const docId = `${currentUser.uid}_${lojaRuptura.id}_${diaStr}`;
      await setDoc(doc(db, 'rupturas', docId), {
        uid:      currentUser.uid,
        nome,
        lojaId:   lojaRuptura.id,
        lojaNome: lojaRuptura.nome,
        data:     diaStr,
        itens:    skusLoja,
        atualizadoEm: serverTimestamp(),
      });
    } catch (e) { console.error(e); }
    setRupturasSalvando(false);
    setSheetRuptura(false);
  }

  // ── Check-in ─────────────────────────────────────────────────────────
  function abrirSheet(lojaPreSelecionada = null) {
    setSheet(true);
    setEtapa(lojaPreSelecionada ? 'gps' : 'loja');
    setLojaSelecionada(lojaPreSelecionada);
    setGpsStatus('idle');
    setDistancia(null);
    setCoords(null);
    setCoordsTemp(null);
    setFotoFile(null);
    setFotoPreview(null);
    setErroCheckin('');
    setCheckinDuplicado(false);
    setTentativaAtual(0);
  }

  async function verificarDuplicado(lojaId) {
    if (!currentUser || !lojaId) return false;
    try {
      const inicio = Timestamp.fromDate(new Date(diaStr + 'T00:00:00'));
      const fim    = Timestamp.fromDate(new Date(diaStr + 'T23:59:59'));
      const q = query(
        collection(db, 'checkins'),
        where('uid',    '==', currentUser.uid),
        where('lojaId', '==', lojaId),
        where('tipo',   '==', 'checkin'),
        where('timestamp', '>=', inicio),
        where('timestamp', '<=', fim)
      );
      const snap = await getDocs(q);
      return !snap.empty;
    } catch { return false; }
  }

  async function avancarParaFoto() {
    const dup = await verificarDuplicado(lojaSelecionada?.id);
    if (dup) { setCheckinDuplicado(true); return; }
    setEtapa('foto');
  }

  async function validarGPS() {
    if (!navigator.geolocation) { setGpsStatus('erro'); return; }
    setGpsStatus('buscando');
    setCheckinDuplicado(false);
    setErroCheckin('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        const precisao = pos.coords.accuracy;
        setCoords({ lat, lng, precisao });
        setCoordsTemp({ lat, lng, precisao });
        setGpsStatus('validando');
        const loja = lojaSelecionada;
        if (!loja || loja.lat == null || loja.lng == null) {
          setGpsStatus('ok');
          await avancarParaFoto();
          return;
        }
        const dist = Math.round(haversine(lat, lng, loja.lat, loja.lng));
        setDistancia(dist);
        if (dist > RAIO_MAXIMO) { setGpsStatus('fora_raio'); return; }
        setGpsStatus('ok');
        await avancarParaFoto();
      },
      () => setGpsStatus('erro'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function selecionarFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function confirmarCheckin() {
    if (!fotoFile) return;
    setEtapa('enviando');
    setErroCheckin('');
    setTentativaAtual(1);
    const dup = await verificarDuplicado(lojaSelecionada?.id);
    if (dup) { setCheckinDuplicado(true); setEtapa('gps'); return; }
    try {
      const storageRef = ref(storage, `checkins/${currentUser.uid}/${Date.now()}.jpg`);
      const fotoURL = await uploadComRetry(storageRef, fotoFile, t => setTentativaAtual(t));
      await addDoc(collection(db, 'checkins'), {
        uid: currentUser.uid, nome,
        lat: coordsTemp?.lat ?? null, lng: coordsTemp?.lng ?? null, precisao: coordsTemp?.precisao ?? null,
        lojaId: lojaSelecionada?.id ?? null, lojaNome: lojaSelecionada?.nome ?? null,
        fotoFachada: fotoURL, tipo: 'checkin', timestamp: serverTimestamp(),
      });
      setLojaAtual(lojaSelecionada);
      setCheckinAtivo(true);
      setTempo(0);
      setSheet(false);
      setFotoFile(null);
      setFotoPreview(null);
      setEtapa('loja');
      setTentativaAtual(0);
    } catch (e) {
      try {
        const fotoBase64 = await fileParaBase64(fotoFile);
        const itemFila = {
          id: `${currentUser.uid}_${Date.now()}`, uid: currentUser.uid, nome,
          lat: coordsTemp?.lat ?? null, lng: coordsTemp?.lng ?? null, precisao: coordsTemp?.precisao ?? null,
          lojaId: lojaSelecionada?.id ?? null, lojaNome: lojaSelecionada?.nome ?? null,
          timestamp: Date.now(), fotoBase64,
        };
        adicionarFila(itemFila);
        setFilaOffline(lerFila());
        setLojaAtual(lojaSelecionada);
        setCheckinAtivo(true);
        setTempo(0);
        setSheet(false);
        setFotoFile(null);
        setFotoPreview(null);
        setEtapa('loja');
        setTentativaAtual(0);
      } catch {
        setErroCheckin('Erro ao salvar offline. Tente novamente.');
        setEtapa('foto');
        setTentativaAtual(0);
      }
    }
  }

  async function fazerCheckout() {
    setSalvando(true);
    try {
      await addDoc(collection(db, 'checkins'), {
        uid: currentUser.uid, nome, tipo: 'checkout',
        tempoVisita: tempo,
        lojaId: lojaAtual?.id ?? null, lojaNome: lojaAtual?.nome ?? null,
        timestamp: serverTimestamp(),
      });
    } catch (e) { console.error(e); }
    setSalvando(false);
    setCheckinAtivo(false);
    setTempo(0);
    setCoords(null);
    setDistancia(null);
    setLojaAtual(null);
    setCoordsTemp(null);
    setLojaSelecionada(null);
  }

  // GPS helpers
  const corStatus     = () => ({ fora_raio: T.red, ok: T.green, erro: '#ff6b6b' }[gpsStatus] || T.orange);
  const iconeStatus   = () => ({ buscando: '📡', validando: '📡', ok: '✅', erro: '❌', fora_raio: '⚠️' }[gpsStatus] || '📍');
  const mensagemStatus = () => ({
    buscando:  'Capturando sinal GPS...',
    validando: 'Verificando proximidade da loja...',
    ok:        'Localização confirmada!',
    erro:      'GPS indisponível. Ative a localização.',
    fora_raio: `Você está a ${distancia}m da loja — máximo: ${RAIO_MAXIMO}m.`,
  }[gpsStatus] || 'Sua localização será validada primeiro.');

  const tarefasFeitas   = tarefas.filter(t => t.feita).length;
  const fotosHoje       = fotosPDV.length;
  const stepIdx         = { loja: 0, gps: 1, foto: 2, enviando: 3 };

  // Fotos agrupadas por loja
  const fotosPorLoja = fotosPDV.reduce((acc, f) => {
    const k = f.lojaId || 'sem_loja';
    if (!acc[k]) acc[k] = { lojaNome: f.lojaNome, fotos: [] };
    acc[k].fotos.push(f);
    return acc;
  }, {});

  return (
    <div style={{
      background: `radial-gradient(ellipse at 30% 0%, #0a3572 0%, #032774 50%, #010e2e 100%)`,
      minHeight: '100dvh', fontFamily: T.fontBody, color: T.text,
      maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>

      <div style={{
        position: 'absolute', width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(224,104,32,0.12) 0%, transparent 70%)',
        top: -60, right: -60, pointerEvents: 'none',
      }} />

      {/* ── BANNER FILA OFFLINE ── */}
      {filaOffline.length > 0 && (
        <div style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, zIndex: 200,
          background: 'rgba(249,168,37,0.95)', backdropFilter: 'blur(8px)',
          padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 14, fontWeight: 700, color: '#000' }}>
              {reenviando ? '📤 Reenviando...' : `📦 ${filaOffline.length} check-in(s) na fila offline`}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(0,0,0,0.6)' }}>
              {reenviando ? 'Enviando ao servidor...' : 'Será enviado quando a conexão voltar'}
            </p>
          </div>
          {!reenviando && (
            <button onClick={reenviarFila} style={{
              background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: 8,
              padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#000', cursor: 'pointer',
            }}>Reenviar</button>
          )}
        </div>
      )}

      {/* ── BANNER REENVIO OK ── */}
      {reenviadoBanner && (
        <div style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, zIndex: 200,
          background: 'rgba(76,175,80,0.95)', backdropFilter: 'blur(8px)',
          padding: '10px 16px', textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 15, fontWeight: 700, color: '#fff' }}>
            ✅ Check-ins offline enviados com sucesso!
          </p>
        </div>
      )}

      {/* ── BANNER FOTO ENVIANDO ── */}
      {enviandoFoto && (
        <div style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, zIndex: 200,
          background: 'rgba(3,39,116,0.97)', backdropFilter: 'blur(8px)',
          padding: '10px 16px', textAlign: 'center',
          borderBottom: `2px solid ${T.orange}`,
        }}>
          <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 14, fontWeight: 700, color: T.orange }}>
            📤 Enviando foto...
          </p>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{
        padding: `${filaOffline.length > 0 || reenviadoBanner || enviandoFoto ? '88px' : '52px'} 20px 16px`,
        ...S.cardDark, borderRadius: '0 0 24px 24px', borderTop: 'none', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, textTransform: 'capitalize' }}>{hoje}</p>
            <h1 style={{ margin: '2px 0 0', fontFamily: T.fontTitle, fontSize: 28, fontWeight: 900 }}>
              {nome.split(' ')[0]} 👋
            </h1>
          </div>
          <div style={{
            ...S.card, padding: '6px 14px', borderRadius: T.pill,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: checkinAtivo ? T.green : T.muted,
              display: 'inline-block',
              boxShadow: checkinAtivo ? `0 0 8px ${T.green}` : 'none',
            }} />
            <span style={{ fontSize: 12, color: checkinAtivo ? T.green : T.muted, fontWeight: 600 }}>
              {checkinAtivo ? 'Em visita' : 'Offline'}
            </span>
          </div>
        </div>

        {checkinAtivo && (
          <div style={{
            marginTop: 16, padding: '12px 16px',
            background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.25)',
            borderRadius: T.r16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <span style={{ fontSize: 13, color: T.green }}>⏱ Tempo de visita</span>
              {lojaAtual && <p style={{ margin: '2px 0 0', fontSize: 11, color: T.muted }}>📍 {lojaAtual.nome}</p>}
            </div>
            <span style={{ fontFamily: T.fontTitle, fontSize: 24, fontWeight: 700, color: T.green }}>
              {formatTempo(tempo)}
            </span>
          </div>
        )}
      </div>

      {/* ── CONTEÚDO ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>

        {/* ── ABA INÍCIO ── */}
        {aba === 'inicio' && (
          <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Lojas hoje', valor: lojas.length,                         cor: T.orange },
                { label: 'Tarefas',    valor: `${tarefasFeitas}/${tarefas.length}`, cor: T.yellow },
                { label: 'Fotos',      valor: fotosHoje,                            cor: '#60a5fa' },
              ].map(c => (
                <div key={c.label} style={{ ...S.card, padding: 14, textAlign: 'center', borderLeft: `3px solid ${c.cor}` }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: T.muted }}>{c.label}</p>
                  <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 22, color: c.cor }}>{c.valor}</p>
                </div>
              ))}
            </div>

            {!carregandoRota && lojas.length === 0 && (
              <div style={{
                ...S.card, padding: '14px 16px', marginBottom: 16,
                borderLeft: `3px solid ${T.yellow}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>📭</span>
                <p style={{ margin: 0, fontSize: 13, color: T.yellow }}>
                  Nenhuma loja escalada para hoje. Fale com o gestor.
                </p>
              </div>
            )}

            {!checkinAtivo ? (
              <button
                onClick={() => abrirSheet()}
                disabled={lojas.length === 0 && !carregandoRota}
                style={{
                  ...S.btnOrange, width: '100%', padding: '18px',
                  fontSize: 20, borderRadius: T.r20, marginBottom: 12,
                  opacity: lojas.length === 0 && !carregandoRota ? 0.4 : 1,
                  cursor: lojas.length === 0 && !carregandoRota ? 'not-allowed' : 'pointer',
                }}>
                📍 Fazer Check-in
              </button>
            ) : (
              <button
                onClick={fazerCheckout}
                disabled={salvando}
                style={{
                  ...S.btnGhost, width: '100%', padding: '18px',
                  fontSize: 18, borderRadius: T.r20, marginBottom: 12,
                  color: '#ff6b6b', border: '1px solid rgba(244,67,54,0.3)',
                }}>
                {salvando ? 'Salvando...' : '🏁 Fazer Check-out'}
              </button>
            )}

            {checkinAtivo && coords && (
              <div style={{ ...S.card, padding: 16, marginBottom: 12 }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: T.muted }}>📍 Localização registrada</p>
                <p style={{ margin: '0 0 2px', fontSize: 13 }}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
                <p style={{ margin: 0, fontSize: 11, color: T.muted }}>
                  Precisão: ±{Math.round(coords.precisao)}m
                  {distancia != null && ` · ${distancia}m da loja`}
                </p>
              </div>
            )}

            <p style={{ fontFamily: T.fontTitle, fontSize: 18, margin: '20px 0 10px' }}>Acesso rápido</p>
            {[
              { icon: '🗺️', label: 'Rota do dia',    key: 'rota'    },
              { icon: '📷', label: 'Fotos do dia',   key: 'fotos'   },
              { icon: '✓',  label: 'Tarefas do dia', key: 'tarefas' },
            ].map(item => (
              <button key={item.key} onClick={() => setAba(item.key)} style={{
                ...S.btnGhost, padding: '16px', textAlign: 'left', fontSize: 15,
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', marginBottom: 8,
              }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        )}

        {/* ── ABA ROTA ── */}
        {aba === 'rota' && (
          <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontFamily: T.fontTitle, fontSize: 22, margin: 0 }}>ROTA DO DIA</p>
              {lojas.length > 0 && (
                <button
                  onClick={confirmarRota}
                  disabled={rotaConfirmada || confirmandoRota}
                  style={{
                    ...S.btnGhost, padding: '8px 14px', fontSize: 12,
                    borderRadius: T.pill, display: 'flex', alignItems: 'center', gap: 6,
                    color: rotaConfirmada ? T.green : T.orange,
                    borderColor: rotaConfirmada ? `${T.green}55` : 'rgba(224,104,32,0.4)',
                    background: rotaConfirmada ? 'rgba(76,175,80,0.1)' : undefined,
                    opacity: confirmandoRota ? 0.6 : 1,
                    cursor: rotaConfirmada ? 'default' : 'pointer',
                  }}>
                  {rotaConfirmada ? '✅ Confirmada' : confirmandoRota ? '⏳...' : '✓ Confirmar rota'}
                </button>
              )}
            </div>
            {carregandoRota && <div style={{ textAlign: 'center', padding: 40, color: T.muted }}>Carregando rota...</div>}
            {!carregandoRota && lojas.length === 0 && (
              <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p style={{ color: T.muted, margin: 0 }}>Nenhuma loja atribuída para hoje.</p>
              </div>
            )}
            {lojas.map((loja, i) => (
              <div key={loja.id} style={{
                ...S.card, marginBottom: 12,
                borderLeft: `3px solid ${T.orange}`,
                animation: `fadeInUp 0.4s ease ${i * 0.08}s both`,
              }}>
                {/* linha principal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 12px 0' }}>
                  <div
                    onClick={() => abrirDetalhe(loja)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, cursor: 'pointer' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: `${T.orange}22`, border: `1.5px solid ${T.orange}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: T.fontTitle, fontSize: 18, color: T.orange, flexShrink: 0,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: T.fontTitle, fontSize: 17 }}>{loja.nome}</div>
                      <div style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>📍 {loja.endereco || 'Sem endereço'}</div>
                    </div>
                  </div>
                  {!checkinAtivo && (
                    <button
                      onClick={() => { setSheetLoja(false); abrirSheet(loja); }}
                      style={{ ...S.btnOrange, padding: '8px 14px', fontSize: 12, borderRadius: T.pill, whiteSpace: 'nowrap' }}>
                      Check-in
                    </button>
                  )}
                </div>
                {/* ações rápidas */}
                <div style={{ display: 'flex', gap: 8, padding: '10px 12px 12px' }}>
                  <button onClick={() => abrirSheetFoto(loja)} style={{
                    ...S.btnGhost, flex: 1, padding: '8px 0', fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}>📷 Foto</button>
                  <button onClick={() => { setSheetLoja(false); abrirRuptura(loja); }} style={{
                    ...S.btnGhost, flex: 1, padding: '8px 0', fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    color: T.yellow, borderColor: 'rgba(249,168,37,0.3)',
                  }}>⚠️ Ruptura</button>
                  <button onClick={() => abrirDetalhe(loja)} style={{
                    ...S.btnGhost, flex: 1, padding: '8px 0', fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}>📦 Mix</button>
                  {loja.lat != null && loja.lng != null && (
                    <button
                      onClick={() => window.open(`https://maps.google.com/?q=${loja.lat},${loja.lng}`, '_blank')}
                      style={{
                        ...S.btnGhost, flex: 1, padding: '8px 0', fontSize: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)',
                      }}>🗺️ Rota</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ABA FOTOS ── */}
        {aba === 'fotos' && (
          <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontFamily: T.fontTitle, fontSize: 22, margin: 0 }}>FOTOS DO DIA</p>
              <span style={{
                background: 'rgba(96,165,250,0.15)', color: '#60a5fa',
                borderRadius: T.pill, padding: '4px 12px', fontSize: 12, fontWeight: 700,
              }}>{fotosHoje} foto{fotosHoje !== 1 ? 's' : ''}</span>
            </div>

            {/* Botão tirar foto — escolhe loja */}
            {lojas.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: T.muted, margin: '0 0 8px' }}>Tirar foto em qual loja?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lojas.map(loja => (
                    <button key={loja.id} onClick={() => abrirSheetFoto(loja)} style={{
                      ...S.btnGhost, padding: '12px 16px', textAlign: 'left', fontSize: 14,
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <span style={{ fontSize: 18 }}>📷</span>
                      <span style={{ flex: 1 }}>{loja.nome}</span>
                      <span style={{ color: T.orange, fontSize: 18 }}>›</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fotos do dia agrupadas por loja */}
            {carregandoFotos && <div style={{ textAlign: 'center', padding: 40, color: T.muted }}>Carregando fotos...</div>}

            {!carregandoFotos && fotosPDV.length === 0 && (
              <div style={{ ...S.card, padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
                <p style={{ color: T.muted, margin: 0 }}>Nenhuma foto registrada hoje.</p>
                <p style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>Use os botões acima para fotografar.</p>
              </div>
            )}

            {Object.entries(fotosPorLoja).map(([lojaId, grupo]) => (
              <div key={lojaId} style={{ marginBottom: 20 }}>
                <p style={{ fontFamily: T.fontTitle, fontSize: 15, color: T.muted, margin: '0 0 10px', letterSpacing: 1 }}>
                  🏪 {grupo.lojaNome?.toUpperCase() || 'LOJA'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {grupo.fotos.map((f, i) => {
                    const tipo = TIPOS_FOTO.find(t => t.id === f.tipo);
                    return (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={f.url} alt={tipo?.label} style={{
                          width: '100%', aspectRatio: '1',
                          objectFit: 'cover', borderRadius: T.r12,
                          border: `1px solid ${T.border}`,
                        }} />
                        <div style={{
                          position: 'absolute', bottom: 6, left: 6, right: 6,
                          background: 'rgba(2,29,90,0.88)', backdropFilter: 'blur(4px)',
                          borderRadius: T.r8, padding: '3px 8px',
                          fontSize: 11, fontWeight: 600, color: T.text,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <span>{tipo?.icon}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tipo?.label || f.tipo}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ABA TAREFAS ── */}
        {aba === 'tarefas' && (
          <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontFamily: T.fontTitle, fontSize: 22, margin: 0 }}>
                Tarefas — {tarefasFeitas}/{tarefas.length}
              </p>
              {tarefasSalvando && <span style={{ fontSize: 11, color: T.muted }}>Salvando...</span>}
              {!tarefasSalvando && tarefasFeitas > 0 && <span style={{ fontSize: 11, color: T.green }}>✓ Salvo</span>}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: T.pill, height: 6, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{
                width: `${tarefas.length > 0 ? (tarefasFeitas / tarefas.length) * 100 : 0}%`,
                height: '100%', background: T.green, borderRadius: T.pill, transition: 'width 0.4s ease',
              }} />
            </div>

            {tarefasCarregando ? (
              <div style={{ textAlign: 'center', padding: 40, color: T.muted }}>Carregando tarefas...</div>
            ) : (
              tarefas.map(tarefa => (
                <button key={tarefa.id} onClick={() => toggleTarefa(tarefa.id)} style={{
                  ...S.card, padding: '16px', width: '100%', marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', textAlign: 'left',
                  borderLeft: tarefa.feita ? `3px solid ${T.green}` : `3px solid ${T.border}`,
                  transition: T.smooth,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: tarefa.feita ? T.green : 'transparent',
                    border: `2px solid ${tarefa.feita ? T.green : T.muted}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: T.smooth,
                  }}>
                    {tarefa.feita && <span style={{ fontSize: 12, color: '#fff' }}>✓</span>}
                  </div>
                  <span style={{
                    fontSize: 15, color: tarefa.feita ? T.muted : T.text,
                    textDecoration: tarefa.feita ? 'line-through' : 'none', transition: T.smooth,
                  }}>
                    {tarefa.texto}
                  </span>
                </button>
              ))
            )}

            {!tarefasCarregando && tarefasFeitas === tarefas.length && tarefas.length > 0 && (
              <div style={{ ...S.card, padding: 24, textAlign: 'center', marginTop: 8, borderLeft: `3px solid ${T.green}` }}>
                <p style={{ fontSize: 32, margin: '0 0 8px' }}>🎉</p>
                <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 18, color: T.green }}>Todas as tarefas concluídas!</p>
              </div>
            )}
          </div>
        )}

        {/* ── ABA PERFIL ── */}
        {aba === 'perfil' && (
          <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{ ...S.cardDark, padding: 24, borderRadius: T.r20, textAlign: 'center', marginBottom: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: T.orange,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', fontFamily: T.fontTitle, fontSize: 28, fontWeight: 700,
              }}>{nome[0].toUpperCase()}</div>
              <p style={{ margin: '0 0 4px', fontFamily: T.fontTitle, fontSize: 22 }}>{nome}</p>
              <p style={{ margin: 0, fontSize: 13, color: T.muted }}>{currentUser?.email}</p>
              <span style={{
                display: 'inline-block', marginTop: 10,
                background: 'rgba(224,104,32,0.15)', color: T.orange,
                borderRadius: T.pill, padding: '4px 14px', fontSize: 12,
              }}>Promotor</span>
            </div>
            {filaOffline.length > 0 && (
              <div style={{
                ...S.card, padding: 16, marginBottom: 12,
                borderLeft: `3px solid ${T.yellow}`, background: 'rgba(249,168,37,0.08)',
              }}>
                <p style={{ margin: '0 0 4px', fontSize: 14, color: T.yellow, fontWeight: 600 }}>
                  📦 {filaOffline.length} check-in(s) pendente(s)
                </p>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: T.muted }}>
                  Aguardando conexão para enviar ao servidor.
                </p>
                <button onClick={reenviarFila} disabled={reenviando} style={{
                  ...S.btnGhost, width: '100%', padding: 12, fontSize: 13,
                  color: T.yellow, borderColor: 'rgba(249,168,37,0.3)',
                  opacity: reenviando ? 0.5 : 1,
                }}>
                  {reenviando ? 'Enviando...' : '📤 Tentar enviar agora'}
                </button>
              </div>
            )}
            <button onClick={async () => { await signOut(auth); navigate('/login'); }} style={{
              ...S.btnGhost, width: '100%', padding: 16,
              color: '#ff6b6b', border: '1px solid rgba(244,67,54,0.25)', fontSize: 15,
            }}>
              🚪 Sair da conta
            </button>
          </div>
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, ...S.cardDark,
        borderRadius: '20px 20px 0 0', borderBottom: 'none',
        display: 'flex', padding: '8px 0 20px', zIndex: 50,
      }}>
        {NAV.map(item => (
          <button key={item.key} onClick={() => setAba(item.key)} style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 0',
            position: 'relative',
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.key === 'perfil' && filaOffline.length > 0 && (
              <div style={{
                position: 'absolute', top: 4, right: 'calc(50% - 18px)',
                width: 16, height: 16, borderRadius: '50%',
                background: T.yellow, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#000',
              }}>{filaOffline.length}</div>
            )}
            {item.key === 'fotos' && fotosHoje > 0 && (
              <div style={{
                position: 'absolute', top: 4, right: 'calc(50% - 18px)',
                width: 16, height: 16, borderRadius: '50%',
                background: '#60a5fa', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#000',
              }}>{fotosHoje}</div>
            )}
            <span style={{ fontSize: 11, fontWeight: 600, color: aba === item.key ? T.orange : T.muted }}>
              {item.label}
            </span>
            {aba === item.key && <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.orange }} />}
          </button>
        ))}
      </div>

      {/* ── INPUT FOTO FACHADA ── */}
      <input ref={inputFotoRef} type="file" accept="image/*" capture="environment"
        onChange={selecionarFoto} style={{ display: 'none' }} />

      {/* ── INPUT FOTO PDV ── */}
      <input ref={inputFotoPDVRef} type="file" accept="image/*" capture="environment"
        onChange={onFotoPDVSelecionada} style={{ display: 'none' }} />

      {/* ── SHEET CHECK-IN ── */}
      {sheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div
            onClick={() => { if (etapa !== 'enviando') setSheet(false); }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 480, ...S.cardDark,
            borderRadius: '24px 24px 0 0', padding: '12px 24px 48px',
            animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            maxHeight: '90dvh', overflowY: 'auto',
          }}>
            <div style={S.grabber} />

            {/* Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
              {['Loja', 'GPS', 'Foto', 'Envio'].map((s, i) => {
                const idx   = stepIdx[etapa] ?? 0;
                const ativo = i === idx;
                const feito = i < idx;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: i < 3 ? 1 : 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: feito ? T.green : ativo ? T.orange : 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700,
                        color: (feito || ativo) ? '#fff' : T.muted, flexShrink: 0,
                      }}>{feito ? '✓' : i + 1}</div>
                      <span style={{ fontSize: 11, color: ativo ? T.orange : feito ? T.green : T.muted, fontWeight: 600 }}>{s}</span>
                    </div>
                    {i < 3 && <div style={{ flex: 1, height: 1, background: feito ? T.green : 'rgba(255,255,255,0.1)' }} />}
                  </div>
                );
              })}
            </div>

            {/* ETAPA LOJA */}
            {etapa === 'loja' && (
              <>
                <p style={{ fontFamily: T.fontTitle, fontSize: 22, margin: '0 0 4px' }}>Qual loja você está?</p>
                <p style={{ fontSize: 14, color: T.muted, margin: '0 0 20px' }}>Passo 1 — selecione a loja da sua rota.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {lojas.map(loja => {
                    const sel = lojaSelecionada?.id === loja.id;
                    return (
                      <button key={loja.id} onClick={() => { setLojaSelecionada(loja); setCheckinDuplicado(false); }} style={{
                        ...S.card, padding: '16px', cursor: 'pointer', textAlign: 'left',
                        borderLeft: `3px solid ${sel ? T.orange : T.border}`,
                        background: sel ? 'rgba(224,104,32,0.12)' : 'rgba(255,255,255,0.07)',
                        transition: T.smooth, display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: sel ? `${T.orange}33` : 'rgba(255,255,255,0.08)',
                          border: `2px solid ${sel ? T.orange : 'rgba(255,255,255,0.15)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, flexShrink: 0,
                        }}>
                          {sel ? '✓' : '🏪'}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 17, color: sel ? T.orange : T.text }}>{loja.nome}</p>
                          {loja.endereco && <p style={{ margin: '2px 0 0', fontSize: 12, color: T.muted }}>📍 {loja.endereco}</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => { if (lojaSelecionada) setEtapa('gps'); }} disabled={!lojaSelecionada} style={{
                  ...S.btnOrange, width: '100%', padding: 18, fontSize: 18, borderRadius: T.r16, marginTop: 20,
                  opacity: lojaSelecionada ? 1 : 0.4, cursor: lojaSelecionada ? 'pointer' : 'not-allowed',
                }}>
                  Continuar →
                </button>
              </>
            )}

            {/* ETAPA GPS */}
            {etapa === 'gps' && (
              <>
                <p style={{ fontFamily: T.fontTitle, fontSize: 22, margin: '0 0 4px' }}>Validar GPS</p>
                <p style={{ fontSize: 14, color: T.muted, margin: '0 0 6px' }}>Passo 2 — confirmar localização.</p>
                {lojaSelecionada && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(224,104,32,0.12)', border: `1px solid rgba(224,104,32,0.25)`,
                    borderRadius: T.pill, padding: '4px 12px', marginBottom: 16,
                  }}>
                    <span style={{ fontSize: 13 }}>🏪</span>
                    <span style={{ fontSize: 13, color: T.orange, fontWeight: 600 }}>{lojaSelecionada.nome}</span>
                  </div>
                )}

                {checkinDuplicado && (
                  <div style={{
                    ...S.card, padding: '14px 16px', marginBottom: 16,
                    borderLeft: `3px solid ${T.yellow}`, background: 'rgba(249,168,37,0.08)',
                  }}>
                    <p style={{ margin: 0, fontSize: 14, color: T.yellow, fontWeight: 600 }}>⚠️ Check-in já realizado hoje nesta loja.</p>
                    <button onClick={() => { setEtapa('loja'); setCheckinDuplicado(false); setGpsStatus('idle'); }} style={{ ...S.btnGhost, width: '100%', marginTop: 10, padding: 12, fontSize: 14 }}>
                      ← Escolher outra loja
                    </button>
                  </div>
                )}

                {!checkinDuplicado && gpsStatus !== 'idle' && (
                  <div style={{ ...S.card, padding: '16px 20px', marginBottom: 20, borderLeft: `3px solid ${corStatus()}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{iconeStatus()}</span>
                      <span style={{ fontSize: 14, color: corStatus(), fontWeight: 600 }}>{mensagemStatus()}</span>
                    </div>
                    {gpsStatus === 'fora_raio' && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: T.pill, height: 6, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min((RAIO_MAXIMO / distancia) * 100, 100)}%`, height: '100%', background: T.red, borderRadius: T.pill }} />
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: 11, color: T.muted }}>{RAIO_MAXIMO}m permitidos · {distancia}m de distância</p>
                      </div>
                    )}
                    {(gpsStatus === 'buscando' || gpsStatus === 'validando') && (
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: T.pill, overflow: 'hidden', marginTop: 8 }}>
                        <div style={{ height: '100%', width: '40%', background: T.orange, borderRadius: T.pill, animation: 'shimmer 1.2s ease-in-out infinite' }} />
                      </div>
                    )}
                  </div>
                )}

                {!checkinDuplicado && gpsStatus === 'idle' && (
                  <button onClick={validarGPS} style={{ ...S.btnOrange, width: '100%', padding: 18, fontSize: 18, borderRadius: T.r16 }}>
                    📍 Validar Localização
                  </button>
                )}
                {!checkinDuplicado && (gpsStatus === 'buscando' || gpsStatus === 'validando') && (
                  <button disabled style={{ ...S.btnOrange, width: '100%', padding: 18, fontSize: 18, borderRadius: T.r16, opacity: 0.5 }}>Aguarde...</button>
                )}
                {!checkinDuplicado && (gpsStatus === 'fora_raio' || gpsStatus === 'erro') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button onClick={validarGPS} style={{ ...S.btnOrange, width: '100%', padding: 16, fontSize: 16, borderRadius: T.r16 }}>🔄 Tentar novamente</button>
                    <button onClick={() => { setEtapa('loja'); setGpsStatus('idle'); }} style={{ ...S.btnGhost, width: '100%', padding: 14, fontSize: 14, borderRadius: T.r16 }}>← Trocar loja</button>
                  </div>
                )}
              </>
            )}

            {/* ETAPA FOTO */}
            {etapa === 'foto' && (
              <>
                <p style={{ fontFamily: T.fontTitle, fontSize: 22, margin: '0 0 4px' }}>Foto da Fachada</p>
                <p style={{ fontSize: 14, color: T.muted, margin: '0 0 20px' }}>Passo 3 — obrigatório. Foto da entrada.</p>
                {!fotoPreview ? (
                  <button onClick={() => inputFotoRef.current?.click()} style={{
                    width: '100%', height: 180,
                    background: 'rgba(255,255,255,0.04)', border: `2px dashed ${T.orange}`,
                    borderRadius: T.r16, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: T.orange,
                  }}>
                    <span style={{ fontSize: 40 }}>📷</span>
                    <span style={{ fontFamily: T.fontTitle, fontSize: 16, letterSpacing: 1 }}>TIRAR FOTO</span>
                    <span style={{ fontSize: 12, color: T.muted }}>Toque para abrir a câmera</span>
                  </button>
                ) : (
                  <div style={{ position: 'relative', marginBottom: 16 }}>
                    <img src={fotoPreview} alt="Fachada" style={{
                      width: '100%', height: 200, objectFit: 'cover',
                      borderRadius: T.r16, border: `2px solid ${T.green}`,
                    }} />
                    <button onClick={() => { setFotoFile(null); setFotoPreview(null); }} style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                      width: 32, height: 32, color: '#fff', cursor: 'pointer', fontSize: 14,
                    }}>✕</button>
                    <div style={{
                      position: 'absolute', bottom: 8, left: 8,
                      background: 'rgba(76,175,80,0.9)', borderRadius: T.pill,
                      padding: '4px 10px', fontSize: 12, color: '#fff', fontWeight: 600,
                    }}>✓ Foto selecionada</div>
                  </div>
                )}
                {erroCheckin && <p style={{ color: T.red, fontSize: 13, textAlign: 'center', margin: '8px 0 0' }}>{erroCheckin}</p>}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  {fotoPreview && (
                    <button onClick={() => inputFotoRef.current?.click()} style={{ ...S.btnGhost, flex: 1, padding: 14 }}>🔄 Trocar</button>
                  )}
                  <button onClick={confirmarCheckin} disabled={!fotoFile} style={{
                    ...S.btnOrange, flex: 2, padding: 14, fontSize: 16,
                    opacity: fotoFile ? 1 : 0.4, cursor: fotoFile ? 'pointer' : 'not-allowed',
                  }}>✅ Confirmar Check-in</button>
                </div>
              </>
            )}

            {/* ETAPA ENVIANDO */}
            {etapa === 'enviando' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📤</div>
                <p style={{ fontFamily: T.fontTitle, fontSize: 22, margin: '0 0 8px' }}>Enviando...</p>
                {tentativaAtual > 1 && (
                  <p style={{ color: T.yellow, fontSize: 13, margin: '0 0 8px' }}>⚠️ Tentativa {tentativaAtual} de {MAX_TENTATIVAS}...</p>
                )}
                <p style={{ color: T.muted, fontSize: 14, margin: '0 0 24px' }}>
                  {tentativaAtual <= 1 ? 'Salvando foto e registrando check-in.' : 'Reconectando e tentando novamente...'}
                </p>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: T.pill, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '60%', background: tentativaAtual > 1 ? T.yellow : T.orange, borderRadius: T.pill, animation: 'shimmer 1.2s ease-in-out infinite' }} />
                </div>
                <p style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>Se falhar, será salvo offline.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SHEET DETALHE LOJA (MIX DE PRODUTOS) ── */}
      {sheetLoja && lojaDetalhe && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div onClick={() => setSheetLoja(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 480, ...S.cardDark,
            borderRadius: '24px 24px 0 0', padding: '12px 24px 48px',
            maxHeight: '85vh', overflowY: 'auto',
            animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={S.grabber} />
            <h2 style={{ fontFamily: T.fontTitle, fontSize: 24, margin: '0 0 4px' }}>{lojaDetalhe.nome}</h2>
            <p style={{ color: T.muted, fontSize: 13, margin: '0 0 20px' }}>📍 {lojaDetalhe.endereco || 'Sem endereço'}</p>

            {clientesLoja.length === 0 && (
              <p style={{ color: T.muted, fontSize: 13, textAlign: 'center', padding: 20 }}>Nenhum cliente vinculado.</p>
            )}

            {clientesLoja.map(cliente => (
              <div key={cliente.id} style={{ marginBottom: 16 }}>
                <div style={{ ...S.card, padding: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: T.r8,
                    background: `${T.orange}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  }}>🏷️</div>
                  <div>
                    <div style={{ fontFamily: T.fontTitle, fontSize: 16 }}>{cliente.nome}</div>
                    <div style={{ color: T.muted, fontSize: 12 }}>{cliente.produtos?.length || 0} SKU(s) no mix</div>
                  </div>
                </div>

                {/* Lista de SKUs */}
                {cliente.produtos && cliente.produtos.length > 0 && (
                  <div style={{ paddingLeft: 8 }}>
                    <p style={{ fontFamily: T.fontTitle, fontSize: 13, color: T.muted, margin: '0 0 8px', letterSpacing: 1 }}>
                      MIX DE PRODUTOS
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {cliente.produtos.map((sku, i) => (
                        <span key={i} style={{
                          background: 'rgba(224,104,32,0.12)',
                          border: `1px solid rgba(224,104,32,0.3)`,
                          borderRadius: T.pill, padding: '5px 12px',
                          fontSize: 13, fontWeight: 600, color: T.orange,
                          fontFamily: T.fontTitle,
                        }}>📦 {sku}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              {!checkinAtivo && (
                <button onClick={() => { setSheetLoja(false); abrirSheet(lojaDetalhe); }} style={{ ...S.btnOrange, flex: 1 }}>
                  📍 Check-in
                </button>
              )}
              <button onClick={() => { setSheetLoja(false); abrirRuptura(lojaDetalhe); }} style={{
                ...S.btnGhost, flex: 1,
                color: T.yellow, borderColor: 'rgba(249,168,37,0.3)',
              }}>⚠️ Ruptura</button>
            </div>
            <button onClick={() => setSheetLoja(false)} style={{ ...S.btnGhost, width: '100%', marginTop: 10 }}>Fechar</button>
          </div>
        </div>
      )}

      {/* ── SHEET SELEÇÃO TIPO FOTO ── */}
      {sheetFoto && lojaPDVAtual && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110 }}>
          <div onClick={() => setSheetFoto(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 480, ...S.cardDark,
            borderRadius: '24px 24px 0 0', padding: '12px 20px 48px',
            maxHeight: '85vh', overflowY: 'auto',
            animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={S.grabber} />
            <p style={{ fontFamily: T.fontTitle, fontSize: 22, margin: '0 0 4px' }}>Tipo de Foto</p>
            <p style={{ fontSize: 13, color: T.muted, margin: '0 0 20px' }}>
              📍 {lojaPDVAtual.nome} — escolha a categoria
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TIPOS_FOTO.map(tipo => {
                const jaFez = fotosPDV.some(f => f.tipo === tipo.id && f.lojaId === lojaPDVAtual.id);
                return (
                  <button key={tipo.id} onClick={() => selecionarTipoFoto(tipo.id)} style={{
                    ...S.card, padding: '16px 12px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    border: jaFez ? `1px solid ${T.green}` : '1px solid rgba(255,255,255,0.12)',
                    background: jaFez ? 'rgba(76,175,80,0.08)' : 'rgba(255,255,255,0.07)',
                    position: 'relative',
                  }}>
                    {jaFez && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 18, height: 18, borderRadius: '50%',
                        background: T.green, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700,
                      }}>✓</div>
                    )}
                    <span style={{ fontSize: 28 }}>{tipo.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', color: jaFez ? T.green : T.text }}>
                      {tipo.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setSheetFoto(false)} style={{ ...S.btnGhost, width: '100%', marginTop: 16 }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ── SHEET RUPTURA ── */}
      {sheetRuptura && lojaRuptura && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110 }}>
          <div onClick={() => setSheetRuptura(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 480, ...S.cardDark,
            borderRadius: '24px 24px 0 0', padding: '12px 24px 48px',
            maxHeight: '85vh', overflowY: 'auto',
            animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={S.grabber} />
            <p style={{ fontFamily: T.fontTitle, fontSize: 22, margin: '0 0 4px' }}>Ruptura de Estoque</p>
            <p style={{ fontSize: 13, color: T.muted, margin: '0 0 20px' }}>
              📍 {lojaRuptura.nome} — marque os produtos em falta
            </p>

            {skusLoja.length === 0 && (
              <div style={{ ...S.card, padding: 32, textAlign: 'center' }}>
                <p style={{ color: T.muted, margin: 0 }}>Nenhum produto no mix desta loja.</p>
                <p style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>Vincule clientes/produtos pelo gestor.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {skusLoja.map(item => (
                <button key={item.sku} onClick={() => toggleRuptura(item.sku)} style={{
                  ...S.card, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 12,
                  borderLeft: `3px solid ${item.ruptura ? T.red : T.border}`,
                  background: item.ruptura ? 'rgba(244,67,54,0.08)' : 'rgba(255,255,255,0.07)',
                  transition: T.smooth,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: T.r8,
                    background: item.ruptura ? 'rgba(244,67,54,0.2)' : 'rgba(255,255,255,0.08)',
                    border: `2px solid ${item.ruptura ? T.red : 'rgba(255,255,255,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0, transition: T.smooth,
                  }}>
                    {item.ruptura ? '⚠️' : '📦'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 16, color: item.ruptura ? T.red : T.text }}>
                      {item.sku}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: T.muted }}>
                      {item.ruptura ? 'PRODUTO EM FALTA' : 'Disponível'}
                    </p>
                  </div>
                  <span style={{ fontSize: 18, color: item.ruptura ? T.red : T.muted }}>
                    {item.ruptura ? '✕' : '✓'}
                  </span>
                </button>
              ))}
            </div>

            {skusLoja.length > 0 && (
              <>
                <div style={{
                  ...S.card, padding: '12px 16px', marginTop: 16,
                  background: 'rgba(244,67,54,0.06)', border: `1px solid rgba(244,67,54,0.15)`,
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 13, color: T.muted }}>Produtos em ruptura</span>
                  <span style={{ fontFamily: T.fontTitle, fontSize: 18, color: T.red }}>
                    {skusLoja.filter(s => s.ruptura).length}/{skusLoja.length}
                  </span>
                </div>
                <button onClick={salvarRuptura} disabled={rupturasSalvando} style={{
                  ...S.btnOrange, width: '100%', marginTop: 12,
                  opacity: rupturasSalvando ? 0.6 : 1,
                }}>
                  {rupturasSalvando ? 'Salvando...' : '✅ Salvar Ruptura'}
                </button>
              </>
            )}
            <button onClick={() => setSheetRuptura(false)} style={{ ...S.btnGhost, width: '100%', marginTop: 10 }}>Cancelar</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp  { from { transform:translateX(-50%) translateY(100%); } to { transform:translateX(-50%) translateY(0); } }
        @keyframes shimmer  { 0% { transform:translateX(-200%); } 100% { transform:translateX(400%); } }
        @keyframes slideLeft { from { transform:translateX(100%); } to { transform:translateX(0); } }
      `}</style>
    </div>
  );
}