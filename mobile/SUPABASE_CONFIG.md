# Configuração do Supabase - PET CLASS Mobile

## 🔧 Como Configurar

### 1. Obter Credenciais do Supabase

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Settings** > **API**
3. Copie as seguintes informações:
   - **Project URL** (URL do projeto)
   - **anon public** (Chave pública/anônima)

### 2. Configurar no Projeto

Você tem duas opções para configurar as credenciais:

#### Opção A: Editar diretamente o arquivo (Mais simples)

1. Abra o arquivo `lib/supabase.js`
2. Substitua as seguintes linhas:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
   
   Por suas credenciais reais:
   ```javascript
   const SUPABASE_URL = 'https://seu-projeto-id.supabase.co';
   const SUPABASE_ANON_KEY = 'sua-chave-anonima-aqui';
   ```

#### Opção B: Usar variáveis de ambiente (Mais seguro)

1. Crie um arquivo `.env` na pasta `mobile/`
2. Adicione suas credenciais:
   ```
   SUPABASE_URL=https://seu-projeto-id.supabase.co
   SUPABASE_ANON_KEY=sua-chave-anonima-aqui
   ```
3. Use o arquivo `config/supabase.js` em vez de `lib/supabase.js`

### 3. Executar Scripts SQL no Supabase

Antes de testar a conexão, execute os scripts SQL na seguinte ordem:

1. **`supabase_schema.sql`** - Criar tabelas
2. **`supabase_rls_policies.sql`** - Configurar segurança
3. **`supabase_functions.sql`** - Criar funções
4. **`supabase_sample_data.sql`** - Dados de exemplo (opcional)

### 4. Testar a Conexão

Após configurar as credenciais, você pode testar a conexão:

```javascript
import { runSupabaseTests, checkConfiguration } from './utils/testSupabase';

// Verificar configuração
checkConfiguration();

// Executar testes completos
runSupabaseTests();
```

## 📱 Como Usar na Aplicação

### Importar o Supabase

```javascript
import { supabase, auth, database } from './lib/supabase';
```

### Exemplos de Uso

#### Fazer Login
```javascript
const result = await auth.signIn('usuario@email.com', 'senha123');
if (result.success) {
  console.log('Login realizado!', result.data);
} else {
  console.error('Erro no login:', result.error);
}
```

#### Obter Dashboard do Usuário
```javascript
const userId = 'uuid-do-usuario';
const result = await database.getUserDashboard(userId);
if (result.success) {
  console.log('Dashboard:', result.data);
}
```

#### Completar uma Aula
```javascript
const result = await database.completeLesson(userId, lessonId);
if (result.success) {
  console.log('Aula completada! XP ganho:', result.data.xp_earned);
}
```

#### Responder Quiz
```javascript
const result = await database.answerQuiz(userId, quizId, optionId);
if (result.success) {
  console.log('Resposta registrada!', result.data);
}
```

## 🔍 Verificação de Problemas

### Erro de Conexão
- Verifique se a URL e chave estão corretas
- Confirme se o projeto Supabase está ativo
- Teste a conexão com `checkConfiguration()`

### Erro de Tabelas
- Execute os scripts SQL na ordem correta
- Verifique se não há erros no SQL Editor do Supabase
- Confirme se as tabelas foram criadas

### Erro de Autenticação
- Verifique se a autenticação está habilitada no Supabase
- Confirme se o usuário existe no sistema
- Teste com `testAuth(email, password)`

## 📋 Checklist de Configuração

- [ ] Credenciais do Supabase configuradas
- [ ] Scripts SQL executados no Supabase
- [ ] Teste de conexão realizado com sucesso
- [ ] Tabelas criadas e acessíveis
- [ ] Funções RPC funcionando
- [ ] Autenticação testada

## 🆘 Precisa de Ajuda?

Se encontrar problemas:

1. Execute `checkConfiguration()` para verificar a configuração
2. Execute `runSupabaseTests()` para diagnóstico completo
3. Verifique o console do Supabase para erros SQL
4. Confirme se todas as dependências foram instaladas

---

**Próximo passo**: Após configurar as credenciais, me informe para que possamos testar a conexão!