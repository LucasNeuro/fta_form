# 🔧 Instruções para Ativar CRUD Completo

## ⚠️ IMPORTANTE: Execute o SQL Primeiro!

Para que as funcionalidades de **excluir** e **desativar** equipes funcionem, você **DEVE** executar o script SQL no Supabase.

## 📋 Passo a Passo

### 1. Acesse o Supabase SQL Editor
- Vá para o Dashboard do Supabase
- Clique em **SQL Editor**
- Clique em **New Query**

### 2. Execute o Script SQL
- Abra o arquivo `schema-fix-crud-completo.sql`
- Copie **TODO** o conteúdo
- Cole no SQL Editor do Supabase
- Clique em **Run** (ou pressione Ctrl+Enter)

### 3. Verifique se Funcionou
O script mostrará:
- ✅ Campos `ativo` adicionados nas tabelas
- ✅ Políticas RLS atualizadas
- ✅ Lista de políticas criadas

## 🎯 O que o Script Faz

1. **Adiciona campo `ativo`** nas tabelas:
   - `equipes` → campo `ativo boolean DEFAULT true`
   - `cadastro_links` → campo `ativo boolean DEFAULT true`

2. **Remove políticas RLS antigas** que podem estar bloqueando

3. **Cria novas políticas RLS** que permitem:
   - ✅ SELECT (ler)
   - ✅ INSERT (criar)
   - ✅ UPDATE (atualizar/desativar)
   - ✅ DELETE (excluir)

4. **Cria índices** para melhor performance

## ✅ Funcionalidades Disponíveis Após Executar o SQL

### Na Lista de Equipes:
- 👁️ **Ver detalhes** - Abre sideover com informações
- ⚠️ **Desativar/Ativar** - Toggle do status da equipe
- 🗑️ **Excluir** - Remove equipe permanentemente (com confirmação)

### No Sideover da Equipe:
- **Ver links criados** - Lista todos os links de operador
- **Criar novo link** - Gera novo link de cadastro
- **Copiar link** - Copia link para área de transferência
- **Ativar/Desativar link** - Toggle do status do link
- **Status visual** - Mostra se link está Ativo, Desativado ou Usado

### No Painel Admin:
- **Ver todos os links de equipe**
- **Copiar link**
- **Ativar/Desativar link**
- **Excluir link**

## 🐛 Troubleshooting

### Erro: "new row violates row-level security policy"
- **Causa**: Políticas RLS não foram atualizadas
- **Solução**: Execute o script SQL novamente

### Erro: "column 'ativo' does not exist"
- **Causa**: Campo `ativo` não foi adicionado
- **Solução**: Execute o script SQL novamente

### Botões não aparecem
- **Causa**: Você não está logado como admin
- **Solução**: Faça login com `renatoadm@teste.com` / `@123456`

### Erro ao excluir/desativar
- **Causa**: Políticas RLS bloqueando
- **Solução**: 
  1. Verifique se executou o SQL
  2. Verifique no console do navegador (F12) qual erro específico
  3. Execute o SQL novamente se necessário

## 📝 Verificação Manual

Após executar o SQL, você pode verificar se funcionou:

```sql
-- Verificar se campo ativo existe
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name IN ('equipes', 'cadastro_links')
  AND column_name = 'ativo';

-- Verificar políticas RLS
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('equipes', 'cadastro_links');
```

## ✅ Checklist Final

- [ ] SQL executado no Supabase
- [ ] Campos `ativo` adicionados
- [ ] Políticas RLS criadas
- [ ] Login como admin feito
- [ ] Testar desativar equipe
- [ ] Testar excluir equipe
- [ ] Testar ativar/desativar link
- [ ] Testar excluir link

## 🚀 Pronto!

Após executar o SQL, todas as funcionalidades de CRUD estarão funcionando!


