# 🔧 Correção dos Erros PGRST202 e PGRST204

## 📋 Problemas Identificados e Corrigidos

1. **PGRST202**: Função `get_user_dashboard` não encontrada no cache do esquema - ✅ Corrigido
2. **PGRST204**: Coluna `last_activity_date` não encontrada na tabela `users` - ✅ Corrigido
3. **PGRST205**: Tabela `user_store_items` não encontrada - ✅ Corrigido no código para usar `user_purchases`
4. **42703**: Coluna `is_completed` não existe - ✅ Tabela `user_lesson_progress` criada com todas as colunas

## 🚀 Solução

### Passo 1: Aplicar Script de Atualização no Supabase

1. Acesse o **Supabase Dashboard** do seu projeto
2. Vá para **SQL Editor**
3. Abra o arquivo `supabase_update.sql` criado na raiz do projeto
4. Copie todo o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Execute o script clicando em **Run**

### Passo 2: Verificar Aplicação

Após executar o script, você deve ver a mensagem:
```
Atualização do Supabase concluída com sucesso!
```

### Passo 3: Testar a Aplicação

1. Volte para a aplicação React Native
2. Recarregue a página (Ctrl+R no navegador ou 'r' no terminal do Expo)
3. Os erros devem ter sido resolvidos

## 📁 Arquivos Criados/Modificados

- ✅ `supabase_update.sql` - Script de atualização completo
- ✅ `supabase_functions.sql` - Funções RPC atualizadas
- ✅ `mobile/hooks/useUserData.js` - Hook corrigido para criar usuários automaticamente
- ✅ `mobile/hooks/useStore.js` - Corrigido nome da tabela

## 🔍 O que o Script Faz

### Correções na Tabela Users
- ✅ Adiciona coluna `last_activity_date` se não existir
- ✅ Adiciona colunas `streak_days`, `xp_total`, `level`, `role`, `avatar_url` se não existirem
- ✅ Define valores padrão apropriados

### Funções RPC Criadas
- ✅ `get_user_dashboard()` - Dashboard completo do usuário
- ✅ `calculate_user_total_xp()` - Cálculo de XP total
- ✅ `calculate_user_level()` - Cálculo de nível
- ✅ `mark_lesson_complete()` - Marcar aula como completa
- ✅ `submit_quiz_answer()` - Submeter resposta de quiz

## 🎯 Resultado Esperado

Após aplicar as correções:
- ✅ Dashboard carrega sem erros
- ✅ Dados do usuário são criados automaticamente no primeiro login
- ✅ Todas as funcionalidades de progresso funcionam
- ✅ Sistema de XP e níveis operacional

## 🆘 Se Ainda Houver Problemas

1. Verifique se o script foi executado completamente no Supabase
2. Confirme se não há erros no SQL Editor
3. Recarregue a aplicação completamente
4. Verifique o console do navegador para novos erros

## ⚠️ Erro de Conflito de Funções (RESOLVIDO)

Se você encontrou o erro:
```
ERROR: 42P13: cannot change name of input parameter "user_uuid"
HINT: Use DROP FUNCTION calculate_user_total_xp(uuid) first.
```

**✅ SOLUÇÃO**: O script foi atualizado para incluir comandos `DROP FUNCTION IF EXISTS` que resolvem automaticamente esses conflitos. Execute o script atualizado.

---

**Nota**: Este script é seguro e usa verificações condicionais para não duplicar colunas ou funções existentes. Agora também remove funções conflitantes automaticamente.