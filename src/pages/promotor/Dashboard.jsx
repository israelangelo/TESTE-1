import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../../firebase/config';
import {
  collection, addDoc, serverTimestamp,
  query, where, getDocs, doc, getDoc,
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

const RAIO_MAXIMO = 200;

const NAV = [
  { key: 'inicio',  icon: '⊞', label: 'Início' },
  { key: 'rota',    icon: '🗺️', label: 'Rota' },
  { key: 'tarefas', icon: '✓',  label: 'Tarefas' },
  { key: 'perfil',  icon: '👤', label: 'Perfil' },
];

const TAREFAS_INIT = [
  { id: 1, texto: 'Verificar validade dos produtos', feita: false },
  { id: 2, texto: 'Organizar gôndola principal', feita: false },
  { id: 3, texto: 'Repor estoque de bebidas', feita: false },
  { id: 4, texto: 'Foto da entrada da loja', feita: false },
  { id: 5, texto: 'Preencher relatório de ruptura', feita: false },
];

export default function PromotorDashboard() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const inputFotoRef = useRef(null);

  const [aba, setAba] = useState('inicio');
  const [tarefas, setTarefas] = useState(TAREFAS_INIT);
  const [checkinAtivo, setCheckinAtivo] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [coords, setCoords] = useState(null);
  const [distancia, setDistancia] = useState(null);
  const [lojaAtual, setLojaAtual] = useState(null);
  const [tempo, setTempo] = useState(0);
  const [salvando, setSalvando] = useState(false);

  // Foto fachada
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [uploadando, setUploadando] = useState(false);
  const [etapa, setEtapa] = useState('gps'); // 'gps' | 'foto' | 'enviando'

  // Rota
  const [lojas, setLojas] = useState([]);
  const [carregandoRota, setCarregandoRota] = useState(true);
  const [lojaSelecionada, setLojaSelecionada] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [sheetLoja, setSheetLoja] = useState(false);

  // GPS temporário (salvo entre etapas)
  const [coordsTemp, setCoordsTemp] = useState(null);
  const [lojaTemp, setLojaTemp] = useState(null);

  const nome = userData?.nome || currentUser?.email?.split('@')[0] || 'Promotor';

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });

  useEffect(() => {
    if (!checkinAtivo) return;
    const t = setInterval(() => setTempo((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, [checkinAtivo]);

  function formatTempo(s) {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const seg = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${seg}`;
  }

  useEffect(() => {
    async function buscarRota() {
      if (!currentUser) return;
      try {
        const diaStr = new Date().toISOString().split('T')[0];
        const escalaQ = query(
          collection(db, 'escalas'),
          where('promotorId', '==', currentUser.uid),
          where('data', '==', diaStr)
        );
        const escalaSnap = await getDocs(escalaQ);
        let lojasIds = [];
        escalaSnap.forEach(d => {
          const data = d.data();
          if (data.lojas) lojasIds = [...lojasIds, ...data.lojas];
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

  async function abrirLoja(loja) {
    setLojaSelecionada(loja);
    setSheetLoja(true);
    setClientes([]);
    try {
      const q = query(collection(db, 'clientes'), where('lojas', 'array-contains', loja.id));
      const snap = await getDocs(q);
      const lista = [];
      snap.forEach(d => lista.push({ id: d.id, ...d.data() }));
      setClientes(lista);
    } catch (e) { console.error(e); }
  }

  async function buscarLojaGPS() {
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', currentUser.uid));
      const lojaId = userDoc.data()?.lojaId;
      if (!lojaId) return null;
      const lojaDoc = await getDoc(doc(db, 'lojas', lojaId));
      if (!lojaDoc.exists()) return null;
      return { id: lojaId, ...lojaDoc.data() };
    } catch { return null; }
  }

  // ETAPA 1 — valida GPS
  async function validarGPS() {
    if (!navigator.geolocation) { setGpsStatus('erro'); return; }
    setGpsStatus('buscando');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const precisao = pos.coords.accuracy;
        setCoords({ lat, lng, precisao });
        setGpsStatus('validando');
        const loja = await buscarLojaGPS();
        if (!loja || loja.lat == null || loja.lng == null) {
          setCoordsTemp({ lat, lng, precisao });
          setLojaTemp(loja);
          setGpsStatus('ok');
          setEtapa('foto'); // avança para foto
          return;
        }
        const dist = Math.round(haversine(lat, lng, loja.lat, loja.lng));
        setDistancia(dist);
        setLojaTemp(loja);
        setCoordsTemp({ lat, lng, precisao });
        if (dist > RAIO_MAXIMO) { setGpsStatus('fora_raio'); return; }
        setGpsStatus('ok');
        setEtapa('foto'); // avança para foto
      },
      () => setGpsStatus('erro'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  // Seleciona foto da câmera
  function selecionarFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  // ETAPA 2 — envia foto + salva checkin
  async function confirmarCheckin() {
    if (!fotoFile) return;
    setEtapa('enviando');
    setUploadando(true);
    try {
      // Upload foto no Storage
      const nomeArq = `checkins/${currentUser.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, nomeArq);
      await uploadBytes(storageRef, fotoFile);
      const fotoURL = await getDownloadURL(storageRef);

      // Salva checkin no Firestore com URL da foto
      await addDoc(collection(db, 'checkins'), {
        uid: currentUser.uid,
        nome,
        lat: coordsTemp.lat,
        lng: coordsTemp.lng,
        precisao: coordsTemp.precisao,
        lojaId: lojaTemp?.id || null,
        lojaNome: lojaTemp?.nome || null,
        fotoFachada: fotoURL,
        tipo: 'checkin',
        timestamp: serverTimestamp(),
      });

      setLojaAtual(lojaTemp);
      setCheckinAtivo(true);
      setTempo(0);
      setSheet(false);
      setFotoFile(null);
      setFotoPreview(null);
      setEtapa('gps');
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar foto. Tente novamente.');
      setEtapa('foto');
    }
    setUploadando(false);
  }

  async function fazerCheckout() {
    setSalvando(true);
    try {
      await addDoc(collection(db, 'checkins'), {
        uid: currentUser.uid, nome, tipo: 'checkout',
        tempoVisita: tempo, lojaId: lojaAtual?.id || null,
        timestamp: serverTimestamp(),
      });
    } catch (e) { console.error(e); }
    setSalvando(false);
    setCheckinAtivo(false);
    setTempo(0); setCoords(null); setDistancia(null);
    setLojaAtual(null); setCoordsTemp(null); setLojaTemp(null);
  }

  function abrirSheet() {
    setSheet(true);
    setGpsStatus('idle');
    setDistancia(null);
    setFotoFile(null);
    setFotoPreview(null);
    setEtapa('gps');
  }

  const tarefasFeitas = tarefas.filter(t => t.feita).length;

  function corStatus() {
    if (gpsStatus === 'fora_raio') return T.red;
    if (gpsStatus === 'ok') return T.green;
    if (gpsStatus === 'erro') return '#ff6b6b';
    return T.orange;
  }
  function iconeStatus() {
    if (gpsStatus === 'buscando' || gpsStatus === 'validando') return '📡';
    if (gpsStatus === 'fora_raio') return '⚠️';
    if (gpsStatus === 'ok') return '✅';
    if (gpsStatus === 'erro') return '❌';
    return '📍';
  }
  function mensagemStatus() {
    if (gpsStatus === 'buscando') return 'Capturando sinal GPS...';
    if (gpsStatus === 'validando') return 'Verificando proximidade da loja...';
    if (gpsStatus === 'ok') return 'Localização confirmada! Tire a foto da fachada.';
    if (gpsStatus === 'erro') return 'GPS indisponível. Ative a localização.';
    if (gpsStatus === 'fora_raio') return `Você está a ${distancia}m da loja — máximo: ${RAIO_MAXIMO}m.`;
    return 'Sua localização será validada primeiro.';
  }

  const statusCor = (status) => {
    if (status === 'concluido') return T.green;
    if (status === 'pendente') return T.yellow;
    return T.muted;
  };

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

      {/* HEADER */}
      <div style={{
        padding: '52px 20px 16px', ...S.cardDark,
        borderRadius: '0 0 24px 24px', borderTop: 'none', marginBottom: 16,
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
            background: 'rgba(76,175,80,0.1)',
            border: '1px solid rgba(76,175,80,0.25)',
            borderRadius: T.r16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
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

      {/* CONTEÚDO */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>

        {/* ABA INÍCIO */}
        {aba === 'inicio' && (
          <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Lojas hoje', valor: lojas.length, cor: T.orange },
                { label: 'Tarefas', valor: `${tarefasFeitas}/${tarefas.length}`, cor: T.yellow },
                { label: 'Status', valor: checkinAtivo ? 'Ativo' : 'Parado', cor: checkinAtivo ? T.green : T.muted },
              ].map(c => (
                <div key={c.label} style={{ ...S.card, padding: 14, textAlign: 'center', borderLeft: `3px solid ${c.cor}` }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: T.muted }}>{c.label}</p>
                  <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 22, color: c.cor }}>{c.valor}</p>
                </div>
              ))}
            </div>

            {!checkinAtivo ? (
              <button onClick={abrirSheet}
                style={{ ...S.btnOrange, width: '100%', padding: '18px', fontSize: 20, borderRadius: T.r20, marginBottom: 12 }}>
                📍 Fazer Check-in
              </button>
            ) : (
              <button onClick={fazerCheckout} disabled={salvando}
                style={{ ...S.btnGhost, width: '100%', padding: '18px', fontSize: 18, borderRadius: T.r20, marginBottom: 12, color: '#ff6b6b', border: '1px solid rgba(244,67,54,0.3)' }}>
                {salvando ? 'Salvando...' : '🏁 Fazer Check-out'}
              </button>
            )}

            {checkinAtivo && coords && (
              <div style={{ ...S.card, padding: 16, marginBottom: 12 }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: T.muted }}>📍 Localização registrada</p>
                <p style={{ margin: '0 0 2px', fontSize: 13 }}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
                <p style={{ margin: 0, fontSize: 11, color: T.muted }}>Precisão: ±{Math.round(coords.precisao)}m{distancia != null && ` · ${distancia}m da loja`}</p>
              </div>
            )}

            <p style={{ fontFamily: T.fontTitle, fontSize: 18, margin: '20px 0 10px' }}>Acesso rápido</p>
            {[
              { icon: '🗺️', label: 'Rota do dia', key: 'rota' },
              { icon: '✓', label: 'Tarefas do dia', key: 'tarefas' },
            ].map(item => (
              <button key={item.key} onClick={() => setAba(item.key)}
                style={{ ...S.btnGhost, padding: '16px', textAlign: 'left', fontSize: 15, display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        )}

        {/* ABA ROTA */}
        {aba === 'rota' && (
          <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <p style={{ fontFamily: T.fontTitle, fontSize: 22, margin: '0 0 16px' }}>ROTA DO DIA</p>
            {carregandoRota && <div style={{ textAlign: 'center', padding: 40, color: T.muted }}>Carregando rota...</div>}
            {!carregandoRota && lojas.length === 0 && (
              <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p style={{ color: T.muted, margin: 0 }}>Nenhuma loja atribuída para hoje.</p>
                <p style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>Fale com o gestor.</p>
              </div>
            )}
            {lojas.map((loja, i) => (
              <div key={loja.id} onClick={() => abrirLoja(loja)} style={{
                ...S.card, marginBottom: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                borderLeft: `3px solid ${statusCor(loja.status)}`,
                animation: `fadeInUp 0.4s ease ${i * 0.08}s both`,
              }}>
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
                <div style={{
                  padding: '4px 10px', borderRadius: T.pill,
                  background: `${statusCor(loja.status)}22`,
                  color: statusCor(loja.status),
                  fontSize: 11, fontFamily: T.fontTitle,
                }}>{loja.status === 'concluido' ? '✓ OK' : 'PENDENTE'}</div>
                <div style={{ color: T.muted, fontSize: 18 }}>›</div>
              </div>
            ))}
          </div>
        )}

        {/* ABA TAREFAS */}
        {aba === 'tarefas' && (
          <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <p style={{ fontFamily: T.fontTitle, fontSize: 22, margin: '0 0 16px' }}>
              Tarefas — {tarefasFeitas}/{tarefas.length}
            </p>
            {tarefas.map(tarefa => (
              <button key={tarefa.id}
                onClick={() => setTarefas(prev => prev.map(t => t.id === tarefa.id ? { ...t, feita: !t.feita } : t))}
                style={{
                  ...S.card, padding: '16px', width: '100%', marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
                  borderLeft: tarefa.feita ? `3px solid ${T.green}` : `3px solid ${T.border}`,
                }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: tarefa.feita ? T.green : 'transparent',
                  border: `2px solid ${tarefa.feita ? T.green : T.muted}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {tarefa.feita && <span style={{ fontSize: 12, color: '#fff' }}>✓</span>}
                </div>
                <span style={{ fontSize: 15, color: tarefa.feita ? T.muted : T.text, textDecoration: tarefa.feita ? 'line-through' : 'none' }}>
                  {tarefa.texto}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ABA PERFIL */}
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
            <button onClick={async () => { await signOut(auth); navigate('/login'); }}
              style={{ ...S.btnGhost, width: '100%', padding: 16, color: '#ff6b6b', border: '1px solid rgba(244,67,54,0.25)', fontSize: 15 }}>
              🚪 Sair da conta
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
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
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: aba === item.key ? T.orange : T.muted }}>
              {item.label}
            </span>
            {aba === item.key && <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.orange }} />}
          </button>
        ))}
      </div>

      {/* INPUT FOTO OCULTO */}
      <input
        ref={inputFotoRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={selecionarFoto}
        style={{ display: 'none' }}
      />

      {/* SHEET CHECK-IN */}
      {sheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div onClick={() => { if (etapa !== 'enviando') setSheet(false); }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 480, ...S.cardDark,
            borderRadius: '24px 24px 0 0', padding: '12px 24px 48px',
            animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={S.grabber} />

            {/* Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              {['GPS', 'Foto', 'Envio'].map((s, i) => {
                const etapaIdx = etapa === 'gps' ? 0 : etapa === 'foto' ? 1 : 2;
                const ativo = i === etapaIdx;
                const feito = i < etapaIdx;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < 2 ? 1 : 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: feito ? T.green : ativo ? T.orange : 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700,
                        color: (feito || ativo) ? '#fff' : T.muted,
                        flexShrink: 0,
                      }}>{feito ? '✓' : i + 1}</div>
                      <span style={{ fontSize: 12, color: ativo ? T.orange : feito ? T.green : T.muted, fontWeight: 600 }}>{s}</span>
                    </div>
                    {i < 2 && <div style={{ flex: 1, height: 1, background: feito ? T.green : 'rgba(255,255,255,0.1)' }} />}
                  </div>
                );
              })}
            </div>

            {/* ETAPA GPS */}
            {etapa === 'gps' && (
              <>
                <p style={{ fontFamily: T.fontTitle, fontSize: 22, margin: '0 0 4px' }}>Check-in GPS</p>
                <p style={{ fontSize: 14, color: T.muted, margin: '0 0 20px' }}>Passo 1 — valida sua localização.</p>

                {gpsStatus !== 'idle' && (
                  <div style={{ ...S.card, padding: '16px 20px', marginBottom: 20, borderLeft: `3px solid ${corStatus()}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{iconeStatus()}</span>
                      <span style={{ fontSize: 14, color: corStatus(), fontWeight: 600 }}>{mensagemStatus()}</span>
                    </div>
                    {gpsStatus === 'fora_raio' && distancia != null && (
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

                {gpsStatus === 'idle' && (
                  <button onClick={validarGPS} style={{ ...S.btnOrange, width: '100%', padding: 18, fontSize: 18, borderRadius: T.r16 }}>
                    📍 Validar Localização
                  </button>
                )}
                {(gpsStatus === 'buscando' || gpsStatus === 'validando') && (
                  <button disabled style={{ ...S.btnOrange, width: '100%', padding: 18, fontSize: 18, borderRadius: T.r16, opacity: 0.5 }}>Aguarde...</button>
                )}
                {(gpsStatus === 'fora_raio' || gpsStatus === 'erro') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button onClick={validarGPS} style={{ ...S.btnOrange, width: '100%', padding: 16, fontSize: 16, borderRadius: T.r16 }}>🔄 Tentar novamente</button>
                    <p style={{ textAlign: 'center', fontSize: 12, color: T.muted, margin: 0 }}>
                      {gpsStatus === 'fora_raio' ? 'Aproxime-se da loja e tente de novo.' : 'Ative o GPS e tente novamente.'}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ETAPA FOTO */}
            {etapa === 'foto' && (
              <>
                <p style={{ fontFamily: T.fontTitle, fontSize: 22, margin: '0 0 4px' }}>Foto da Fachada</p>
                <p style={{ fontSize: 14, color: T.muted, margin: '0 0 20px' }}>
                  Passo 2 — obrigatório. Tire uma foto da entrada da loja.
                </p>

                {!fotoPreview ? (
                  <button onClick={() => inputFotoRef.current?.click()} style={{
                    width: '100%', height: 180,
                    background: 'rgba(255,255,255,0.04)',
                    border: `2px dashed ${T.orange}`,
                    borderRadius: T.r16, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 10,
                    color: T.orange,
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
                    <button onClick={() => { setFotoFile(null); setFotoPreview(null); }}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'rgba(0,0,0,0.6)', border: 'none',
                        borderRadius: '50%', width: 32, height: 32,
                        color: '#fff', cursor: 'pointer', fontSize: 14,
                      }}>✕</button>
                    <div style={{
                      position: 'absolute', bottom: 8, left: 8,
                      background: 'rgba(76,175,80,0.9)', borderRadius: T.pill,
                      padding: '4px 10px', fontSize: 12, color: '#fff', fontWeight: 600,
                    }}>✓ Foto selecionada</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  {fotoPreview && (
                    <button onClick={() => inputFotoRef.current?.click()}
                      style={{ ...S.btnGhost, flex: 1, padding: 14 }}>
                      🔄 Trocar foto
                    </button>
                  )}
                  <button onClick={confirmarCheckin} disabled={!fotoFile}
                    style={{
                      ...S.btnOrange, flex: 2, padding: 14, fontSize: 16,
                      opacity: fotoFile ? 1 : 0.4,
                      cursor: fotoFile ? 'pointer' : 'not-allowed',
                    }}>
                    ✅ Confirmar Check-in
                  </button>
                </div>
              </>
            )}

            {/* ETAPA ENVIANDO */}
            {etapa === 'enviando' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📤</div>
                <p style={{ fontFamily: T.fontTitle, fontSize: 22, margin: '0 0 8px' }}>Enviando...</p>
                <p style={{ color: T.muted, fontSize: 14, margin: '0 0 24px' }}>Salvando foto e registrando check-in.</p>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: T.pill, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '60%', background: T.orange, borderRadius: T.pill, animation: 'shimmer 1.2s ease-in-out infinite' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHEET LOJA */}
      {sheetLoja && lojaSelecionada && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div onClick={() => setSheetLoja(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 480, ...S.cardDark,
            borderRadius: '24px 24px 0 0', padding: '12px 24px 48px',
            maxHeight: '80vh', overflowY: 'auto',
            animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={S.grabber} />
            <h2 style={{ fontFamily: T.fontTitle, fontSize: 24, margin: '0 0 4px' }}>{lojaSelecionada.nome}</h2>
            <p style={{ color: T.muted, fontSize: 13, margin: '0 0 20px' }}>📍 {lojaSelecionada.endereco || 'Sem endereço'}</p>
            <p style={{ fontFamily: T.fontTitle, fontSize: 16, color: T.muted, margin: '0 0 12px', letterSpacing: 1 }}>CLIENTES NESTA LOJA</p>
            {clientes.length === 0 && <p style={{ color: T.muted, fontSize: 13, textAlign: 'center', padding: 20 }}>Nenhum cliente vinculado.</p>}
            {clientes.map(cliente => (
              <div key={cliente.id} style={{ ...S.card, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: T.r8,
                  background: `${T.orange}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                }}>🏷️</div>
                <div>
                  <div style={{ fontFamily: T.fontTitle, fontSize: 16 }}>{cliente.nome}</div>
                  <div style={{ color: T.muted, fontSize: 12 }}>{cliente.produtos?.length || 0} produto(s) no mix</div>
                </div>
              </div>
            ))}
            <button onClick={() => { setSheetLoja(false); abrirSheet(); }}
              style={{ ...S.btnOrange, width: '100%', marginTop: 16 }}>
              📍 Fazer Check-in nesta loja
            </button>
            <button onClick={() => setSheetLoja(false)} style={{ ...S.btnGhost, width: '100%', marginTop: 10 }}>Fechar</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { transform:translateX(-50%) translateY(100%); } to { transform:translateX(-50%) translateY(0); } }
        @keyframes shimmer { 0% { transform:translateX(-200%); } 100% { transform:translateX(400%); } }
      `}</style>
    </div>
  );
}