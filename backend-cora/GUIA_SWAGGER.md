# 📚 Guia do Swagger - Backend Cora

## ✅ Swagger já está configurado!

O backend já possui Swagger configurado e funcionando. Você pode acessar a documentação interativa da API.

---

## 🌐 Como Acessar

### **No Render (Produção)**

Após o deploy, acesse:

```
https://backend-cora.onrender.com/api-docs
```

**Nota:** O nome exato do serviço pode variar. Verifique a URL no dashboard do Render.

### **Localmente (Desenvolvimento)**

```bash
cd backend-cora
npm start
```

Depois acesse:

```
http://localhost:3001/api-docs
```

---

## 📋 Endpoints Documentados

O Swagger documenta os seguintes endpoints:

### 1. **POST /api/cora/token**
- **Descrição:** Obter token de acesso da API Cora
- **Uso:** Autentica usando certificado TLS client e retorna token JWT
- **Body:**
  ```json
  {
    "clientId": "int-1ZVwf7iYC106q3iRWEmyJP",
    "env": "production" // ou "stage"
  }
  ```

### 2. **POST /api/cora/invoices**
- **Descrição:** Criar boleto na API Cora
- **Uso:** Cria um boleto registrado usando o token de acesso
- **Body:**
  ```json
  {
    "accessToken": "TOKEN_OBTIDO_EM_/api/cora/token",
    "invoiceData": {
      "code": "BOL-001",
      "customer": { ... },
      "services": [ ... ],
      "payment_terms": { ... }
    },
    "env": "production",
    "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```

### 3. **GET /api/cora/invoices/{invoiceId}**
- **Descrição:** Consultar status de boleto/QR Code Pix
- **Uso:** Verifica se o pagamento foi realizado
- **Headers:**
  ```
  Authorization: Bearer TOKEN_DE_ACESSO
  ```

### 4. **DELETE /api/cora/invoices/{invoiceId}**
- **Descrição:** Cancelar boleto/QR Code Pix
- **Uso:** Cancela um boleto que ainda não foi pago
- **Headers:**
  ```
  Authorization: Bearer TOKEN_DE_ACESSO
  ```

---

## 🧪 Testando no Swagger UI

### **Passo 1: Obter Token**

1. Acesse `/api-docs`
2. Expanda o endpoint `POST /api/cora/token`
3. Clique em "Try it out"
4. Preencha o `clientId` e `env`
5. Clique em "Execute"
6. Copie o `access_token` da resposta

### **Passo 2: Criar Boleto**

1. Expanda o endpoint `POST /api/cora/invoices`
2. Clique em "Try it out"
3. Cole o `accessToken` obtido no passo anterior
4. Preencha o `invoiceData` com os dados do boleto
5. Clique em "Execute"

### **Passo 3: Consultar Status**

1. Expanda o endpoint `GET /api/cora/invoices/{invoiceId}`
2. Clique em "Try it out"
3. Cole o `invoiceId` retornado na criação
4. Adicione o header `Authorization: Bearer TOKEN`
5. Clique em "Execute"

---

## 🔧 Configuração

O Swagger está configurado em `server.js`:

- **Biblioteca:** `swagger-ui-express` e `swagger-jsdoc`
- **Rota:** `/api-docs`
- **Versão OpenAPI:** 3.0.0
- **Documentação:** JSDoc nos endpoints

---

## 📝 Adicionando Novos Endpoints

Para documentar um novo endpoint, adicione comentários JSDoc antes da rota:

```javascript
/**
 * @swagger
 * /api/cora/novo-endpoint:
 *   get:
 *     summary: Descrição do endpoint
 *     description: Descrição detalhada
 *     tags: [Tag]
 *     responses:
 *       200:
 *         description: Sucesso
 */
app.get('/api/cora/novo-endpoint', (req, res) => {
  // código do endpoint
})
```

---

## ✅ Status

- ✅ Swagger configurado
- ✅ Endpoints documentados
- ✅ Schemas definidos
- ✅ Exemplos incluídos
- ✅ URLs do servidor configuradas (local e Render)

---

## 🎉 Pronto para usar!

Acesse `/api-docs` e comece a testar a API! 🚀
