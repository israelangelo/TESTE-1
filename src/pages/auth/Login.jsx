import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { T, S } from '../../theme/tokens';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [aba, setAba]           = useState('entrar');
  const [email, setEmail]       = useState('');
  const [senha, setSenha]       = useState('');
  const [nome, setNome]         = useState('');
  const [perfilSel, setPerfilSel] = useState('promotor');
  const [lembrar, setLembrar]   = useState(true);
  const [erro, setErro]         = useState('');
  const [sucesso, setSucesso]   = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro(''); setCarregando(true);
    try {
      const auth = getAuth();
      await setPersistence(
        auth,
        lembrar ? browserLocalPersistence : browserSessionPersistence
      );
      const perfil = await login(email, senha);
      if (perfil === 'gestor') navigate('/gestor');
      else if (perfil === 'promotor') navigate('/promotor');
      else navigate('/cliente');
    } catch {
      setErro('E-mail ou senha incorretos.');
    }
    setCarregando(false);
  }

  async function cadastrar(e) {
    e.preventDefault();
    if (!nome || !email || !senha) { setErro('Preencha todos os campos.'); return; }
    if (senha.length < 6) { setErro('Senha deve ter ao menos 6 caracteres.'); return; }
    setErro(''); setCarregando(true);
    try {
      const auth = getAuth();
      await setPersistence(
        auth,
        lembrar ? browserLocalPersistence : browserSessionPersistence
      );
      const { user } = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(user, { displayName: nome });
      await setDoc(doc(db, 'usuarios', user.uid), {
        nome, email, perfil: perfilSel,
        criadoEm: new Date().toISOString(), ativo: true,
      });
      setSucesso('Conta criada! Entrando...');
      setTimeout(() => {
        if (perfilSel === 'gestor') navigate('/gestor');
        else if (perfilSel === 'promotor') navigate('/promotor');
        else navigate('/cliente');
      }, 1200);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setErro('E-mail já cadastrado.');
      else setErro('Erro: ' + err.message);
    }
    setCarregando(false);
  }

  const lembrarRow = {
    display: 'flex', alignItems: 'center',
    gap: 10, marginTop: 4, cursor: 'pointer',
    userSelect: 'none',
  };
  const checkboxBox = {
    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
    border: `2px solid ${lembrar ? '#E06820' : 'rgba(255,255,255,0.2)'}`,
    background: lembrar ? '#E06820' : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .2s',
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: `radial-gradient(ellipse at 30% 20%, #0a3572 0%, #032774 40%, #021d5a 100%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Barlow', sans-serif", padding: '20px',
      boxSizing: 'border-box',
    }}>

      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Logo */}
      <div style={{
        background: '#021d5a', borderRadius: 20,
        padding: '24px 32px', marginBottom: 32, textAlign: 'center',
        border: '1px solid #0a3572',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 52, fontWeight: 800, color: '#E06820', lineHeight: 1 }}>BOX</div>
        <div style={{ width: '100%', height: 2, background: '#E06820', margin: '6px 0' }} />
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: 6 }}>AGÊNCIA</div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'rgba(3,39,116,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 20, padding: '32px 28px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        boxSizing: 'border-box',
      }}>

        {/* Abas */}
        <div style={{ display: 'flex', background: 'rgba(2,29,90,0.8)', borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 }}>
          {['entrar', 'cadastrar'].map(a => (
            <button key={a} onClick={() => { setAba(a); setErro(''); setSucesso(''); }} style={{
              flex: 1, padding: '10px 0', borderRadius: 9,
              border: 'none',
              background: aba === a ? '#E06820' : 'transparent',
              color: aba === a ? '#fff' : '#aab4cc',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 15, fontWeight: 700, letterSpacing: 1,
              cursor: 'pointer', transition: 'all 0.2s',
              textTransform: 'uppercase',
            }}>{a === 'entrar' ? 'Entrar' : 'Criar Conta'}</button>
          ))}
        </div>

        {/* ── ENTRAR ── */}
        {aba === 'entrar' && (
          <form
            id="login-form"
            autoComplete="on"
            onSubmit={entrar}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <input
              id="email-login"
              name="email"
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username email"
              inputMode="email"
              required
              style={inputStyle}
            />
            <input
              id="senha-login"
              name="password"
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              autoComplete="current-password"
              required
              style={inputStyle}
            />

            {/* Lembrar de mim */}
            <div style={lembrarRow} onClick={() => setLembrar(v => !v)}>
              <div style={checkboxBox}>
                {lembrar && <span style={{ fontSize: 12, color: '#fff', fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ fontSize: 14, color: '#aab4cc' }}>Lembrar de mim</span>
            </div>

            {erro && <p style={erroStyle}>{erro}</p>}
            <button type="submit" disabled={carregando} style={btnStyle}>
              {carregando ? 'Entrando...' : 'ENTRAR'}
            </button>
          </form>
        )}

        {/* ── CADASTRAR ── */}
        {aba === 'cadastrar' && (
          <form
            id="signup-form"
            autoComplete="on"
            onSubmit={cadastrar}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <input
              id="nome-criar"
              name="name"
              type="text"
              placeholder="Nome completo"
              value={nome}
              onChange={e => setNome(e.target.value)}
              autoComplete="name"
              required
              style={inputStyle}
            />
            <input
              id="email-criar"
              name="email"
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username email"
              inputMode="email"
              required
              style={inputStyle}
            />
            <input
              id="senha-criar"
              name="password"
              type="password"
              placeholder="Senha (mín. 6 caracteres)"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
              style={inputStyle}
            />

            {/* Perfil */}
            <p style={{ color: '#aab4cc', fontSize: 13, margin: '4px 0 2px', textAlign: 'center' }}>Você é:</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['promotor', 'cliente', 'gestor'].map(p => (
                <button type="button" key={p} onClick={() => setPerfilSel(p)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: `1.5px solid ${perfilSel === p ? '#E06820' : 'rgba(255,255,255,0.1)'}`,
                  background: perfilSel === p ? 'rgba(224,104,32,0.15)' : 'rgba(2,29,90,0.5)',
                  color: perfilSel === p ? '#E06820' : '#aab4cc',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 13, fontWeight: 700, letterSpacing: 1,
                  cursor: 'pointer', transition: 'all 0.2s',
                  textTransform: 'uppercase',
                }}>{p}</button>
              ))}
            </div>

            {/* Lembrar de mim */}
            <div style={lembrarRow} onClick={() => setLembrar(v => !v)}>
              <div style={checkboxBox}>
                {lembrar && <span style={{ fontSize: 12, color: '#fff', fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ fontSize: 14, color: '#aab4cc' }}>Lembrar de mim</span>
            </div>

            {erro && <p style={erroStyle}>{erro}</p>}
            {sucesso && <p style={{ color: '#4ade80', fontSize: 13, textAlign: 'center', margin: 0 }}>{sucesso}</p>}
            <button type="submit" disabled={carregando} style={btnStyle}>
              {carregando ? 'Criando conta...' : 'CRIAR CONTA'}
            </button>
          </form>
        )}
      </div>

      <p style={{ color: '#aab4cc', fontSize: 12, marginTop: 24, opacity: 0.6 }}>
        Box Agência © 2026 — Grande Vitória/ES
      </p>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '14px 16px',
  background: 'rgba(2,29,90,0.8)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12, color: '#fff',
  fontSize: 15, fontFamily: "'Barlow', sans-serif",
  outline: 'none', boxSizing: 'border-box',
};

const btnStyle = {
  width: '100%', padding: '15px',
  background: 'linear-gradient(135deg, #E06820, #c45a1a)',
  border: 'none', borderRadius: 12,
  color: '#fff', fontSize: 16,
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 700, letterSpacing: 2,
  cursor: 'pointer', marginTop: 4,
  boxShadow: '0 4px 20px rgba(224,104,32,0.4)',
};

const erroStyle = {
  color: '#f87171', fontSize: 13,
  textAlign: 'center', margin: 0,
};