# Configuração do Banco de Dados Supabase - PET CLASS

Este documento contém as instruções para configurar o banco de dados completo da aplicação PET CLASS no Supabase.

## 📋 Arquivos Criados

1. **`supabase_schema.sql`** - Schema principal com todas as tabelas
2. **`supabase_rls_policies.sql`** - Políticas de segurança (Row Level Security)
3. **`supabase_functions.sql`** - Funções personalizadas do banco
4. **`supabase_sample_data.sql`** - Dados de exemplo para teste

## 🚀 Ordem de Execução

Execute os scripts na seguinte ordem no SQL Editor do Supabase:

### 1. Criar o Schema Principal
```sql
-- Execute o conteúdo de supabase_schema.sql
```
Este script criará:
- 15 tabelas principais
- Relacionamentos com chaves estrangeiras
- Índices para performance
- Triggers para atualização automática

### 2. Configurar Políticas de Segurança
```sql
-- Execute o conteúdo de supabase_rls_policies.sql
```
Este script configurará:
- Row Level Security (RLS) em todas as tabelas
- Políticas de acesso baseadas em autenticação
- Proteção de dados pessoais dos usuários

### 3. Criar Funções Personalizadas
```sql
-- Execute o conteúdo de supabase_functions.sql
```
Este script criará funções para:
- Calcular XP total do usuário
- Calcular progresso de trilhas
- Atualizar ranking semanal
- Verificar e conceder conquistas
- Completar aulas e quizzes
- Atualizar sequências diárias
- Dashboard do usuário

### 4. Popular com Dados de Exemplo (Opcional)
```sql
-- Execute o conteúdo de supabase_sample_data.sql
```
Este script adicionará:
- 9 trilhas de aprendizado
- 9 aulas (3 por trilha)
- 2 quizzes com opções
- 10 conquistas
- 4 missões diárias
- 6 itens para a loja

## 📊 Estrutura do Banco

### Tabelas Principais

#### 👤 Usuários e Autenticação
- `users` - Dados dos usuários

#### 📚 Conteúdo Educacional
- `trails` - Trilhas de aprendizado
- `lessons` - Aulas das trilhas
- `quizzes` - Questionários
- `quiz_options` - Opções dos questionários

#### 📈 Progresso e Gamificação
- `user_trail_progress` - Progresso nas trilhas
- `user_lesson_progress` - Progresso nas aulas
- `user_quiz_answers` - Respostas dos quizzes
- `achievements` - Conquistas disponíveis
- `user_achievements` - Conquistas dos usuários

#### 🏆 Rankings e Missões
- `weekly_rankings` - Ranking semanal
- `daily_missions` - Missões diárias
- `user_daily_missions` - Progresso das missões

#### 🛒 Loja Virtual
- `store_items` - Itens da loja
- `user_purchases` - Compras dos usuários

## 🔧 Funções Principais

### `get_user_total_xp(user_id)`
Calcula o XP total de um usuário baseado em aulas e quizzes completados.

### `get_trail_progress(user_id, trail_id)`
Retorna o progresso detalhado de uma trilha específica.

### `complete_lesson(user_id, lesson_id)`
Marca uma aula como completada e atualiza o XP do usuário.

### `answer_quiz(user_id, quiz_id, option_id)`
Registra a resposta de um quiz e atualiza o XP se correto.

### `get_user_dashboard(user_id)`
Retorna dados completos do dashboard do usuário.

### `update_weekly_ranking()`
Atualiza o ranking semanal de todos os usuários.

## 🔒 Segurança

### Row Level Security (RLS)
- Todos os dados pessoais são protegidos por RLS
- Usuários só podem acessar seus próprios dados
- Dados públicos (trilhas, aulas, conquistas) são visíveis para todos

### Políticas Implementadas
- **SELECT**: Usuários autenticados podem ver dados públicos e próprios dados
- **INSERT**: Usuários podem criar registros próprios
- **UPDATE**: Usuários podem atualizar apenas seus dados
- **DELETE**: Usuários podem deletar apenas seus dados

## 📱 Integração com a Aplicação

### Configuração do Cliente Supabase
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Exemplos de Uso

#### Completar uma Aula
```javascript
const { data, error } = await supabase
  .rpc('complete_lesson', {
    user_id_param: userId,
    lesson_id_param: lessonId
  })
```

#### Obter Dashboard do Usuário
```javascript
const { data, error } = await supabase
  .rpc('get_user_dashboard', {
    user_id_param: userId
  })
```

#### Responder Quiz
```javascript
const { data, error } = await supabase
  .rpc('answer_quiz', {
    user_id_param: userId,
    quiz_id_param: quizId,
    selected_option_id_param: optionId
  })
```

## 🎯 Próximos Passos

1. Execute os scripts na ordem especificada
2. Configure as variáveis de ambiente da aplicação
3. Teste as funções no SQL Editor
4. Integre com o código da aplicação mobile
5. Configure autenticação de usuários

## 📞 Suporte

Se encontrar algum problema durante a configuração:
1. Verifique se todos os scripts foram executados na ordem correta
2. Confirme se não há erros no console do Supabase
3. Teste as funções individualmente no SQL Editor
4. Verifique se as políticas RLS estão ativas

---

**Nota**: Lembre-se de substituir `YOUR_SUPABASE_URL` e `YOUR_SUPABASE_ANON_KEY` pelas suas credenciais reais do Supabase.