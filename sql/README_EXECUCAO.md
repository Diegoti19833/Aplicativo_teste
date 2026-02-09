# 📋 Guia de Execução dos Scripts SQL

## 🎯 Ordem de Execução

Execute os scripts **exatamente nesta ordem** no SQL Editor do Supabase:

### ✅ Opção 1: Execução Individual (Recomendado)

Execute cada script individualmente para melhor controle:

```sql
-- 1º - Tabelas principais
01_users_table.sql
02_trails_table.sql  
03_lessons_table.sql

-- 2º - Tabelas de quiz
04_quizzes_table.sql
04b_quiz_options_table.sql
05_user_progress_table.sql
06_quiz_attempts_table.sql

-- 3º - Tabelas de gamificação
07_achievements_table.sql
08_user_achievements_table.sql

-- 4º - Tabelas de loja
09_store_items_table.sql
10_user_purchases_table.sql

-- 5º - Tabelas de missões
11_daily_missions_table.sql
12_user_daily_missions_table.sql
13_user_streaks_table.sql
```

### ⚡ Opção 2: Execução Rápida

Execute apenas o script principal (contém as tabelas essenciais):

```sql
00_execute_all_tables.sql
```

## 🔧 Após Criar as Tabelas

1. **Execute as políticas RLS:**
   ```sql
   -- Copie e execute: supabase_rls_policies.sql
   ```

2. **Execute as funções:**
   ```sql
   -- Copie e execute: supabase_functions.sql
   ```

3. **Execute dados de exemplo (opcional):**
   ```sql
   -- Copie e execute: supabase_sample_data.sql
   ```

## 📊 Estrutura das Tabelas

### 👤 **Usuários e Autenticação**
- `users` - Dados dos usuários

### 📚 **Conteúdo Educacional**
- `trails` - Trilhas de aprendizado
- `lessons` - Aulas das trilhas
- `quizzes` - Perguntas e quizzes

### 📈 **Progresso e Gamificação**
- `user_progress` - Progresso nas trilhas/aulas
- `quiz_attempts` - Tentativas nos quizzes
- `achievements` - Conquistas disponíveis
- `user_achievements` - Conquistas dos usuários
- `user_streaks` - Controle de sequências

### 🛒 **Loja Virtual**
- `store_items` - Itens da loja
- `user_purchases` - Compras dos usuários

### 🎯 **Missões Diárias**
- `daily_missions` - Missões disponíveis
- `user_daily_missions` - Progresso nas missões

## 🚨 Problemas Comuns

### ❌ Erro: "relation does not exist"
**Solução:** Execute as tabelas na ordem correta (users → trails → lessons → etc.)

### ❌ Erro: "function does not exist"
**Solução:** Execute primeiro as tabelas, depois as funções

### ❌ Erro: "permission denied"
**Solução:** Verifique se está logado no projeto correto do Supabase

## ✅ Verificação

Após executar todos os scripts, verifique se as tabelas foram criadas:

```sql
-- Liste todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Você deve ver 13 tabelas:
- achievements
- daily_missions  
- lessons
- quizzes
- store_items
- trails
- user_achievements
- user_daily_missions
- user_progress
- user_purchases
- user_streaks
- users
- quiz_attempts

## 🎉 Próximo Passo

Após executar todos os scripts, teste a conexão:

```bash
cd mobile
node testConnection.js
```

Deve exibir: **✅ Conexão estabelecida com sucesso!**