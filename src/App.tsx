import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Header } from './components/Layout/Header'
import { Sidebar } from './components/Layout/Sidebar'
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
          
          {/* Rotas protegidas: Todas com Header/Sidebar */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <div className="flex flex-1" style={{ marginTop: '80px' }}>
                    <Sidebar />
                    <main className="flex-1 overflow-y-auto ml-64">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
                        <Route path="/operadores" element={<ListaOperadores />} />
                        <Route path="/equipes" element={<ListaEquipes />} />
                        <Route path="/relatorio-equipes" element={<ProtectedRoute requireAdmin><RelatorioEquipes /></ProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
