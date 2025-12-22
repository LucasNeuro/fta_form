import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Input } from '../components/UI/Input'
import { Button } from '../components/UI/Button'
import { useAuth } from '../hooks/useAuth'

export const CadastroEquipe: React.FC = () => {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [formData, setFormData] = useState({
    nome: '',
    total_membros: 0,
    ativos: 0,
    capitao: '',
    cidade: '',
    estado: '',
    membro_desde: '',
    historico_transgressoes: '',
    graduacao_fta: 'Cadete' as const
  })

  const [loading, setLoading] = useState(false)

  const graduacoes = ['Cadete', 'Efetivo', 'Graduado', 'Estado Maior', 'Conselheiro'] as const

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('equipes')
        .insert([formData])

      if (error) throw error

      alert('Equipe cadastrada com sucesso!')
      // Reset form
      setFormData({
        nome: '',
        total_membros: 0,
        ativos: 0,
        capitao: '',
        cidade: '',
        estado: '',
        membro_desde: '',
        historico_transgressoes: '',
        graduacao_fta: 'Cadete'
      })
      // Redirecionar para lista
      navigate('/equipes')
    } catch (error: any) {
      alert('Erro ao cadastrar equipe: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-fta-dark text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Cadastro de Equipe</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-fta-green">
              Dados da Equipe
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nome da Equipe"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
              
              <Input
                label="Total de Membros"
                type="number"
                value={formData.total_membros}
                onChange={(e) => setFormData({ ...formData, total_membros: parseInt(e.target.value) || 0 })}
                required
              />
              
              <Input
                label="Membros Ativos"
                type="number"
                value={formData.ativos}
                onChange={(e) => setFormData({ ...formData, ativos: parseInt(e.target.value) || 0 })}
                required
              />
              
              <Input
                label="Capitão"
                value={formData.capitao}
                onChange={(e) => setFormData({ ...formData, capitao: e.target.value })}
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
                label="Membro Desde"
                type="date"
                value={formData.membro_desde}
                onChange={(e) => setFormData({ ...formData, membro_desde: e.target.value })}
                required
              />
              
              <div className="flex flex-col gap-2">
                <label className="text-white/90 text-sm font-semibold">Graduação FTA</label>
                <select
                  className="px-4 py-3 bg-fta-gray border border-fta-green/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fta-green focus:border-fta-green transition-all"
                  value={formData.graduacao_fta}
                  onChange={(e) => setFormData({ ...formData, graduacao_fta: e.target.value as any })}
                  required
                >
                  {graduacoes.map(grad => (
                    <option key={grad} value={grad} className="bg-fta-gray">{grad}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="flex flex-col gap-2">
                  <label className="text-white/90 text-sm font-semibold">
                    Histórico de Transgressões
                    {!isAdmin && <span className="text-white/40 ml-2">(Somente Administrador)</span>}
                  </label>
                  <textarea
                    className="px-4 py-3 bg-fta-gray border border-fta-green/30 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-fta-green focus:border-fta-green transition-all min-h-[120px] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    value={formData.historico_transgressoes}
                    onChange={(e) => setFormData({ ...formData, historico_transgressoes: e.target.value })}
                    disabled={!isAdmin}
                    placeholder={isAdmin ? "Informe o histórico de transgressões..." : "Apenas administradores podem editar este campo"}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar Equipe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

