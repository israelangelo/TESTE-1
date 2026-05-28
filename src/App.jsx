import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import GestorDashboard from "./pages/gestor/Dashboard";
import PromotorDashboard from "./pages/promotor/Dashboard";
import ClienteDashboard from "./pages/cliente/Dashboard";
import Promotores from "./pages/gestor/Promotores";
import Lojas from "./pages/gestor/Lojas";
import Escala from "./pages/gestor/Escala";
import Relatorios from "./pages/gestor/Relatorios";
import Clientes from "./pages/gestor/Clientes";
import Configuracoes from "./pages/gestor/Configuracoes";

function RotaProtegida({ children }) {
  const { currentUser, carregando } = useAuth();
  if (carregando) return (
    <div style={{ background: "#010e2e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#E06820", fontFamily: "Barlow", fontSize: 18 }}>Carregando...</p>
    </div>
  );
  return currentUser ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/gestor" element={<RotaProtegida><GestorDashboard /></RotaProtegida>} />
      <Route path="/gestor/promotores" element={<RotaProtegida><Promotores /></RotaProtegida>} />
      <Route path="/gestor/lojas" element={<RotaProtegida><Lojas /></RotaProtegida>} />
      <Route path="/gestor/escala" element={<RotaProtegida><Escala /></RotaProtegida>} />
      <Route path="/gestor/relatorios" element={<RotaProtegida><Relatorios /></RotaProtegida>} />
      <Route path="/gestor/clientes" element={<RotaProtegida><Clientes /></RotaProtegida>} />
      <Route path="/gestor/configuracoes" element={<RotaProtegida><Configuracoes /></RotaProtegida>} />
      <Route path="/promotor" element={<RotaProtegida><PromotorDashboard /></RotaProtegida>} />
      <Route path="/cliente" element={<RotaProtegida><ClienteDashboard /></RotaProtegida>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}