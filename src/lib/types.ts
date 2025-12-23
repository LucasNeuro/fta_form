export interface Operador {
  id?: string
  nome: string
  codinome: string
  cidade: string
  estado: string
  nascimento: string
  email: string
  telefone: string
  equipe_id?: string
  created_at?: string
  updated_at?: string
}

export interface Equipe {
  id?: string
  nome: string
  total_membros: number
  ativos: number
  capitao: string
  cidade: string
  estado: string
  membro_desde: string
  historico_transgressoes?: string
  graduacao_fta: 'Cadete' | 'Efetivo' | 'Graduado' | 'Estado Maior' | 'Conselheiro'
  instagram?: string // Link do Instagram da equipe
  ativo?: boolean
  created_at?: string
  updated_at?: string
}

export type UserRole = 'admin' | 'responsavel_equipe' | 'user'

export interface UserWithRole {
  id: string
  email: string
  role: UserRole
  is_admin: boolean
  equipe_id?: string
}

export interface CadastroLink {
  id?: string
  token: string
  tipo: 'equipe' | 'operador'
  equipe_id?: string
  criado_por: string
  usado: boolean
  ativo?: boolean
  usado_em?: string
  usado_por?: string
  expires_at?: string
  created_at?: string
  nome?: string // Nome/descrição do link para identificação
}

