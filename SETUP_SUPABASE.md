# 🗄️ Configuração do Supabase

Este arquivo contém todos os scripts SQL necessários para configurar o banco de dados no Supabase.

## 📋 Ordem de Execução

Execute os scripts na ordem abaixo no **SQL Editor** do Supabase:

1. **Script Base** - Cria tabelas e políticas RLS
2. **Script Storage** - Configura bucket de armazenamento
3. **Script Seed** - Insere categorias iniciais (opcional)

---

## 1️⃣ Script Base - Tabelas e RLS

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  receipt_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler categorias"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem criar categorias"
  ON categories FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar categorias"
  ON categories FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar categorias"
  ON categories FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários veem apenas suas transações"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas transações"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas transações"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas transações"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_set_user_id
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();
```

---

## 2️⃣ Script Storage - Bucket de Comprovantes

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Usuários podem fazer upload de comprovantes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts' 
    AND auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Usuários podem ler seus comprovantes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts' 
    AND auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Usuários podem deletar seus comprovantes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts' 
    AND auth.uid()::text = split_part(name, '/', 1)
  );
```

---

## 3️⃣ Script Seed - Categorias Iniciais (Opcional)

```sql
INSERT INTO categories (name) VALUES
  ('Alimentação'),
  ('Transporte'),
  ('Moradia'),
  ('Saúde'),
  ('Educação'),
  ('Lazer'),
  ('Salário'),
  ('Investimentos'),
  ('Outros')
ON CONFLICT DO NOTHING;
```

---

## ✅ Verificação

Após executar os scripts, verifique se tudo está correto:

### 1. Verificar Tabelas
```sql
SELECT * FROM categories;
SELECT * FROM transactions;
```

### 2. Verificar Políticas RLS
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('categories', 'transactions');
```

### 3. Verificar Storage
- Acesse **Storage** no painel do Supabase
- Verifique se o bucket `receipts` foi criado
- Verifique as políticas do bucket

---

## 🔧 Troubleshooting

### Erro: "relation already exists"
- Significa que a tabela já foi criada
- Você pode ignorar ou usar `DROP TABLE` antes (cuidado com dados existentes)

### Erro: "policy already exists"
- Significa que a política já foi criada
- Você pode ignorar ou usar `DROP POLICY` antes

### Erro ao fazer upload de imagem
- Verifique se o bucket `receipts` existe
- Verifique se as políticas do Storage foram criadas corretamente
- Verifique se o usuário está autenticado

---

## 📚 Estrutura do Banco

### Tabela: `categories`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Chave primária |
| name | TEXT | Nome da categoria |
| created_at | TIMESTAMPTZ | Data de criação |

### Tabela: `transactions`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Chave primária |
| user_id | UUID | ID do usuário (FK) |
| type | TEXT | 'income' ou 'expense' |
| amount | NUMERIC | Valor da transação |
| category_id | UUID | ID da categoria (FK, opcional) |
| description | TEXT | Descrição (opcional) |
| receipt_path | TEXT | Caminho do comprovante (opcional) |
| created_at | TIMESTAMPTZ | Data de criação |

---

## 🎯 Próximos Passos

Após configurar o banco de dados:

1. ✅ Verifique se as credenciais no `app.json` estão corretas
2. ✅ Execute `npm install` para instalar dependências
3. ✅ Execute `npx expo start` para iniciar o app
4. ✅ Crie uma conta de teste
5. ✅ Teste todas as funcionalidades

---

**Dúvidas?** Consulte a [documentação do Supabase](https://supabase.com/docs)