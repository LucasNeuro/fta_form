import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'
import { readFileSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 10000

// Servir arquivos estáticos da pasta dist
app.use(express.static(join(__dirname, 'dist')))

// Para todas as rotas, servir o index.html (SPA)
app.get('*', (req, res) => {
  const indexPath = join(__dirname, 'dist', 'index.html')
  
  if (!existsSync(indexPath)) {
    return res.status(500).send('Aplicação não encontrada. Execute npm run build primeiro.')
  }
  
  try {
    const html = readFileSync(indexPath, 'utf-8')
    res.setHeader('Content-Type', 'text/html')
    res.send(html)
  } catch (error) {
    console.error('Erro ao servir index.html:', error)
    res.status(500).send('Erro ao carregar aplicação')
  }
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})

