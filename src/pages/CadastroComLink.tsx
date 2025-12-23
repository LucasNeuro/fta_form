import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Input } from '../components/UI/Input'
import { Button } from '../components/UI/Button'
import { Equipe } from '../lib/types'

export const CadastroComLink: React.FC = () => {
  const { tipo, token } = useParams<{ tipo: string; token: string }>()
  const navigate = useNavigate()
  const [link, setLink] = useState<any>(null)
  const [equipe, setEquipe] = useState<Equipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formDataOperador, setFormDataOperador] = useState({
    nome: '',
    codinome: '',
    cidade: '',
    estado: '',
    nascimento: '',
    email: '',
    telefone: '',
    equipe_id: ''
  })

  const [formDataEquipe, setFormDataEquipe] = useState({
    nome: '',
    total_membros: 0,
    ativos: 0,
    capitao: '',
    cidade: '',
    estado: '',
    membro_desde: '',
    graduacao_fta: 'Cadete' as const,
    instagram: ''
  })

  useEffect(() => {
    validarLink()
  }, [token])

  const validarLink = async () => {
    try {
      const { data, error } = await supabase
        .from('cadastro_links')
        .select('*')
        .eq('token', token)
        .eq('tipo', tipo)
        .eq('usado', false)
        .eq('ativo', true)
        .single()

      if (error || !data) {
        alert('Link inválido, já utilizado ou desativado!')
        navigate('/')
        return
      }

      setLink(data)
      
      if (data.tipo === 'operador' && data.equipe_id) {
        const { data: equipeData } = await supabase
          .from('equipes')
          .select('*')
          .eq('id', data.equipe_id)
          .single()
        
        if (equipeData) {
          setEquipe(equipeData)
          setFormDataOperador(prev => ({ ...prev, equipe_id: data.equipe_id }))
        }
      }
    } catch (error: any) {
      alert('Erro ao validar link: ' + error.message)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (tipo === 'operador') {
        // Cadastrar operador
        const { error } = await supabase
          .from('operadores')
          .insert([formDataOperador])

        if (error) throw error

        // Marcar link como usado
        const { error: linkError } = await supabase
          .from('cadastro_links')
          .update({ 
            usado: true, 
            usado_em: new Date().toISOString() 
          })
          .eq('id', link.id)

        if (linkError) throw linkError

        alert('Operador cadastrado com sucesso!')
        navigate('/')
      } else if (tipo === 'equipe') {
        // Cadastrar equipe
        const { error } = await supabase
          .from('equipes')
          .insert([formDataEquipe])

        if (error) throw error

        // Marcar link como usado
        const { error: linkError } = await supabase
          .from('cadastro_links')
          .update({ 
            usado: true, 
            usado_em: new Date().toISOString() 
          })
          .eq('id', link.id)

        if (linkError) throw linkError

        alert('Equipe cadastrada com sucesso!')
        navigate('/')
      }
    } catch (error: any) {
      alert('Erro ao cadastrar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fta-dark text-white p-8 flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    )
  }

  if (tipo === 'operador') {
    return (
      <div className="min-h-screen bg-fta-dark text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Cadastro de Operador</h1>

          {equipe && (
            <div className="bg-fta-green/20 border border-fta-green/50 p-4 rounded-lg mb-6">
              <p className="text-fta-green font-semibold">Equipe: {equipe.nome}</p>
              <p className="text-white/80 text-sm mt-1">
                Cidade: {equipe.cidade} / Estado: {equipe.estado} | Capitão: {equipe.capitao}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
              <h2 className="text-2xl font-semibold mb-6 text-fta-green">Dados Pessoais</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nome Completo"
                  value={formDataOperador.nome}
                  onChange={(e) => setFormDataOperador({ ...formDataOperador, nome: e.target.value })}
                  required
                />
                
                <Input
                  label="Codinome"
                  value={formDataOperador.codinome}
                  onChange={(e) => setFormDataOperador({ ...formDataOperador, codinome: e.target.value })}
                  required
                />
                
                <Input
                  label="Cidade"
                  value={formDataOperador.cidade}
                  onChange={(e) => setFormDataOperador({ ...formDataOperador, cidade: e.target.value })}
                  required
                />
                
                <Input
                  label="Estado"
                  value={formDataOperador.estado}
                  onChange={(e) => setFormDataOperador({ ...formDataOperador, estado: e.target.value })}
                  required
                />
                
                <Input
                  label="Data de Nascimento"
                  type="date"
                  value={formDataOperador.nascimento}
                  onChange={(e) => setFormDataOperador({ ...formDataOperador, nascimento: e.target.value })}
                  required
                />
                
                <Input
                  label="Email"
                  type="email"
                  value={formDataOperador.email}
                  onChange={(e) => setFormDataOperador({ ...formDataOperador, email: e.target.value })}
                  required
                />
                
                <Input
                  label="Telefone (com DDD)"
                  placeholder="(00) 00000-0000"
                  value={formDataOperador.telefone}
                  onChange={(e) => setFormDataOperador({ ...formDataOperador, telefone: e.target.value })}
                  required
                />
              </div>
            </section>

            <div className="flex justify-end gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Cadastrar Operador'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Formulário de equipe (similar ao CadastroEquipe, mas sem campo de transgressões)
  return (
    <div className="min-h-screen bg-fta-dark text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Cadastro de Equipe</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-fta-green">Dados da Equipe</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nome da Equipe"
                value={formDataEquipe.nome}
                onChange={(e) => setFormDataEquipe({ ...formDataEquipe, nome: e.target.value })}
                required
              />
              
              <Input
                label="Total de Membros"
                type="number"
                value={formDataEquipe.total_membros}
                onChange={(e) => setFormDataEquipe({ ...formDataEquipe, total_membros: parseInt(e.target.value) || 0 })}
                required
              />
              
              <Input
                label="Membros Ativos"
                type="number"
                value={formDataEquipe.ativos}
                onChange={(e) => setFormDataEquipe({ ...formDataEquipe, ativos: parseInt(e.target.value) || 0 })}
                required
              />
              
              <Input
                label="Capitão"
                value={formDataEquipe.capitao}
                onChange={(e) => setFormDataEquipe({ ...formDataEquipe, capitao: e.target.value })}
                required
              />
              
              <Input
                label="Cidade"
                value={formDataEquipe.cidade}
                onChange={(e) => setFormDataEquipe({ ...formDataEquipe, cidade: e.target.value })}
                required
              />
              
              <Input
                label="Estado"
                value={formDataEquipe.estado}
                onChange={(e) => setFormDataEquipe({ ...formDataEquipe, estado: e.target.value })}
                required
              />
              
              <Input
                label="Membro Desde"
                type="date"
                value={formDataEquipe.membro_desde}
                onChange={(e) => setFormDataEquipe({ ...formDataEquipe, membro_desde: e.target.value })}
                required
              />
              
              <div className="flex flex-col gap-2">
                <label className="text-white/90 text-sm font-semibold">Graduação FTA</label>
                <select
                  className="px-4 py-3 bg-fta-gray border border-fta-green/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fta-green focus:border-fta-green transition-all"
                  value={formDataEquipe.graduacao_fta}
                  onChange={(e) => setFormDataEquipe({ ...formDataEquipe, graduacao_fta: e.target.value as any })}
                  required
                >
                  <option value="Cadete" className="bg-fta-gray">Cadete</option>
                  <option value="Efetivo" className="bg-fta-gray">Efetivo</option>
                  <option value="Graduado" className="bg-fta-gray">Graduado</option>
                  <option value="Estado Maior" className="bg-fta-gray">Estado Maior</option>
                  <option value="Conselheiro" className="bg-fta-gray">Conselheiro</option>
                </select>
              </div>

              <Input
                label="Link do Instagram"
                type="url"
                value={formDataEquipe.instagram}
                onChange={(e) => setFormDataEquipe({ ...formDataEquipe, instagram: e.target.value })}
                placeholder="https://instagram.com/equipe_nome"
              />
            </div>
          </section>

          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Cadastrar Equipe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

