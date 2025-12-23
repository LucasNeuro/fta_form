import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Header } from './components/Layout/Header'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { AdminPanel } from './pages/AdminPanel'
import { CadastroComLink } from './pages/CadastroComLink'
import { ListaOperadores } from './pages/ListaOperadores'
import { ListaEquipes } from './pages/ListaEquipes'
import { RelatorioEquipes } from './pages/RelatorioEquipes'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-fta-dark">
        <Routes>
          {/* Rota pública: Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rota pública: Cadastro via link (não precisa estar logado) */}
          <Route path="/cadastro/:tipo/:token" element={<CadastroComLink />} />
          
          {/* Rotas protegidas: Todas com Header/Navbar */}
          <Route
            path="/*"
            element={
              <>
                <Header />
                <Routes>
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
                  <Route path="/operadores" element={<ProtectedRoute><ListaOperadores /></ProtectedRoute>} />
                  <Route path="/equipes" element={<ProtectedRoute><ListaEquipes /></ProtectedRoute>} />
                  <Route path="/relatorio-equipes" element={<ProtectedRoute requireAdmin><RelatorioEquipes /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
