import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Input } from '../components/UI/Input'
import { Button } from '../components/UI/Button'
import { Equipe } from '../lib/types'

export const CadastroOperador: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nome: '',
    codinome: '',
    cidade: '',
    estado: '',
    nascimento: '',
    email: '',
    telefone: '',
    equipe_id: ''
  })

  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [equipeSelecionada, setEquipeSelecionada] = useState<Equipe | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    carregarEquipes()
  }, [])

  const carregarEquipes = async () => {
    try {
      const { data, error } = await supabase
        .from('equipes')
        .select('*')
        .order('nome')
      
      if (error) throw error
      if (data) setEquipes(data)
    } catch (error: any) {
      console.error('Erro ao carregar equipes:', error.message)
    }
  }

  const handleEquipeChange = (equipeId: string) => {
    const equipe = equipes.find(e => e.id === equipeId)
    setEquipeSelecionada(equipe || null)
    setFormData(prev => ({ ...prev, equipe_id: equipeId }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('operadores')
        .insert([formData])

      if (error) throw error

      alert('Operador cadastrado com sucesso!')
      // Reset form
      setFormData({
        nome: '',
        codinome: '',
        cidade: '',
        estado: '',
        nascimento: '',
        email: '',
        telefone: '',
        equipe_id: ''
      })
      setEquipeSelecionada(null)
      // Redirecionar para lista
      navigate('/operadores')
    } catch (error: any) {
      alert('Erro ao cadastrar operador: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-fta-dark text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Cadastro de Operador</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Seção 1: Dados Pessoais */}
          <section className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-fta-green">
              Dados Pessoais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nome Completo"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
              
              <Input
                label="Codinome"
                value={formData.codinome}
                onChange={(e) => setFormData({ ...formData, codinome: e.target.value })}
                required
              />
              
              <Input
                label="Cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                required
              />
              
              <Input
                label="Estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                required
              />
              
              <Input
                label="Data de Nascimento"
                type="date"
                value={formData.nascimento}
                onChange={(e) => setFormData({ ...formData, nascimento: e.target.value })}
                required
              />
              
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              
              <Input
                label="Telefone (com DDD)"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                required
              />
            </div>
          </section>

          {/* Seção 2: Dados FTA Brasil */}
          <section className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-fta-green">
              Dados FTA Brasil
            </h2>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-white/90 text-sm font-semibold">Equipe</label>
                <select
                  className="px-4 py-3 bg-fta-gray border border-fta-green/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fta-green focus:border-fta-green transition-all"
                  value={formData.equipe_id}
                  onChange={(e) => handleEquipeChange(e.target.value)}
                  required
                >
                  <option value="" className="bg-fta-gray">Selecione uma equipe</option>
                  {equipes.map(equipe => (
                    <option key={equipe.id} value={equipe.id} className="bg-fta-gray">
                      {equipe.nome}
                    </option>
                  ))}
                </select>
              </div>

              {equipeSelecionada && (
                <div className="mt-4 p-4 bg-fta-dark/50 rounded-lg border border-fta-green/30">
                  <h3 className="font-semibold mb-2 text-fta-green">Informações da Equipe</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-white/60">Cidade:</span>
                      <span className="ml-2 text-white">{equipeSelecionada.cidade}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Estado:</span>
                      <span className="ml-2 text-white">{equipeSelecionada.estado}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Capitão:</span>
                      <span className="ml-2 text-white">{equipeSelecionada.capitao}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Graduação FTA:</span>
                      <span className="ml-2 text-white">{equipeSelecionada.graduacao_fta}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar Operador'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

