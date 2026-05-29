import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login              from './pages/auth/Login';
import GestorDashboard    from './pages/gestor/Dashboard';
import GestorPromotores   from './pages/gestor/Promotores';
import GestorLojas        from './pages/gestor/Lojas';
import GestorClientes     from './pages/gestor/Clientes';
import GestorEscala       from './pages/gestor/Escala';
import GestorRelatorios   from './pages/gestor/Relatorios';
import GestorConfiguracoes from './pages/gestor/Configuracoes';
import GestorMapa         from './pages/gestor/Mapa';
import PromotorDashboard  from './pages/promotor/Dashboard';
import ClienteDashboard   from './pages/cliente/Dashboard';

function RotaProtegida({ children, perfil }) {
  const { currentUser, userData, carregando } = useAuth();
  if (carregando) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (perfil && userData?.perfil !== perfil) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/gestor" element={
          <RotaProtegida perfil="gestor"><GestorDashboard /></RotaProtegida>
        } />
        <Route path="/gestor/promotores" element={
          <RotaProtegida perfil="gestor"><GestorPromotores /></RotaProtegida>
        } />
        <Route path="/gestor/lojas" element={
          <RotaProtegida perfil="gestor"><GestorLojas /></RotaProtegida>
        } />
        <Route path="/gestor/clientes" element={
          <RotaProtegida perfil="gestor"><GestorClientes /></RotaProtegida>
        } />
        <Route path="/gestor/escala" element={
          <RotaProtegida perfil="gestor"><GestorEscala /></RotaProtegida>
        } />
        <Route path="/gestor/relatorios" element={
          <RotaProtegida perfil="gestor"><GestorRelatorios /></RotaProtegida>
        } />
        <Route path="/gestor/configuracoes" element={
          <RotaProtegida perfil="gestor"><GestorConfiguracoes /></RotaProtegida>
        } />
        <Route path="/gestor/mapa" element={
          <RotaProtegida perfil="gestor"><GestorMapa /></RotaProtegida>
        } />

        <Route path="/promotor" element={
          <RotaProtegida perfil="promotor"><PromotorDashboard /></RotaProtegida>
        } />
        <Route path="/cliente" element={
          <RotaProtegida perfil="cliente"><ClienteDashboard /></RotaProtegida>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}