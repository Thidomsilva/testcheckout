# Documentação API PayPloc - PIX

**Data:** 18 de Dezembro de 2025  
**Endpoint:** `/create-pix-payment`  
**Método:** POST  
**Status:** ✅ Funcionando

---

## 📋 Estrutura do Payload

### Request

```json
{
  "amount": 78.99,
  "description": "Pagamento FlexiPay no valor de R$ 78.99",
  "customer": {
    "name": "Thiago Domingos da Silva",
    "cpf_cnpj": "34238397835",
    "email": "f5mult@gmail.com",
    "phone": "43999027395"
  }
}
```

### Campos Obrigatórios

| Campo | Tipo | Descrição | Validação |
|-------|------|-----------|-----------|
| `amount` | number | Valor em reais | Positivo |
| `description` | string | Descrição do pagamento | - |
| `customer.name` | string | Nome completo | Mínimo 1 caractere |
| `customer.cpf_cnpj` | string | CPF sem formatação | Exatamente 11 dígitos |
| `customer.email` | string | Email válido | Formato email |
| `customer.phone` | string | Telefone sem formatação | Mínimo 10 dígitos |

### Response de Sucesso (200)

```json
{
  "success": true,
  "transaction": {
    "id": "5bfcbc0a-8629-47e6-9978-92588a7ca1f6",
    "amount": 78.99,
    "status": "pending",
    "pixQrCode": "iVBORw0KGgoAAAANSUhEUgAA...",
    "pixCopyPaste": "00020101021226820014br.gov.bcb.pix...",
    "expirationDate": "2026-12-19 23:59:59",
    "invoiceUrl": "https://sandbox.asaas.com/i/c7armc6n5dvffrdq"
  }
}
```

---

## 🐛 Problemas Encontrados e Resolvidos

### 1. Customer ID de Produção no Sandbox
**Problema:**
```json
{
  "error": "Falha ao processar pagamento PIX",
  "code": "PAYMENT_ERROR"
}
```

**Causa:**  
Customer IDs criados no ambiente de produção estavam sendo reutilizados no sandbox.

**Solução Implementada pela PayPloc:**
- Sandbox agora sempre cria um novo cliente no Asaas
- Não reutiliza customer IDs de produção

**Status:** ✅ Resolvido

---

## ✅ Pontos Positivos

1. **Estrutura Simples:** Apenas 4 campos no customer, fácil de implementar
2. **Erro Corrigido Rapidamente:** Problema do sandbox resolvido pelo time
3. **Response Completo:** Retorna QR Code e código copia-e-cola
4. **Sem Necessidade de Endereço:** PIX não exige campos de endereço (independente do valor)

---

## 📝 Sugestões de Melhorias

### 1. Mensagens de Erro Mais Específicas
**Atual:**
```json
{
  "error": "Falha ao processar pagamento PIX",
  "code": "PAYMENT_ERROR"
}
```

**Sugestão:**
```json
{
  "error": "CPF inválido",
  "code": "INVALID_CPF",
  "details": {
    "field": "customer.cpf_cnpj",
    "value": "12345678901",
    "message": "CPF não passou na validação de dígitos verificadores"
  }
}
```

### 2. Validação de CPF
- Adicionar validação de dígitos verificadores
- Retornar erro específico se CPF inválido
- Documentar CPFs de teste para sandbox

### 3. Webhook de Status
- Notificar quando o PIX for pago
- Incluir transaction_id no webhook payload
- Documentar estrutura do webhook

---

## 🧪 Casos de Teste

### ✅ Teste 1: Pagamento Bem-Sucedido
```bash
POST /create-pix-payment
{
  "amount": 78.99,
  "description": "Teste",
  "customer": {
    "name": "Cliente Teste",
    "cpf_cnpj": "11144477735",
    "email": "teste@exemplo.com",
    "phone": "11999999999"
  }
}

Resultado: 200 OK
```

### ✅ Teste 2: Valores Diferentes
- R$ 10,00: ✅ Sucesso
- R$ 100,00: ✅ Sucesso
- R$ 1000,00: ✅ Sucesso

### ✅ Teste 3: CPF Válido
- CPF com dígitos verificadores corretos: ✅ Sucesso

---

## 📊 Estatísticas de Integração

- **Tempo de Integração:** 1 dia
- **Taxa de Sucesso Atual:** 100%
- **Problemas Encontrados:** 1 (resolvido)
- **Funcionalidade:** Completa

---

## 🎯 Conclusão

A API de PIX está **funcionando perfeitamente** após a correção do problema de customer IDs. A estrutura é simples e direta, facilitando a integração.

**Recomendação:** Manter a simplicidade atual, apenas melhorar as mensagens de erro para facilitar debugging.

---

**Desenvolvedor:** Thiago Domingos da Silva  
**Email:** f5mult@gmail.com  
**Ambiente:** Sandbox  
**Última Atualização:** 18/12/2025
