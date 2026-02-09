# Diagnostico Completo e Plano de Correcao
## App de Gamificacao - Rede de Franquias Pet

---

## 1. DIAGNOSTICO - O que estava faltando

### 1.1 Backend Supabase - Problemas Criticos

| # | Problema | Gravidade | Status |
|---|---------|-----------|--------|
| 1 | **Dois schemas divergentes** - `supabase_schema.sql` e `sql/` files definem tabelas completamente diferentes (nomes de colunas, tipos, FK) | CRITICO | CORRIGIDO |
| 2 | **Tabela `user_progress` nunca criada** - referenciada por todas as funcoes mas nao existe | CRITICO | CORRIGIDO |
| 3 | **Tabela `quiz_attempts` nunca criada** - mesma situacao | CRITICO | CORRIGIDO |
| 4 | **Double coin deduction** - funcao `purchase_store_item` + trigger `process_purchase` deduzia coins 2x | CRITICO | CORRIGIDO |
| 5 | **Variable shadowing** em `update_user_current_streak` - `SET current_streak = current_streak` era no-op | ALTO | CORRIGIDO |
| 6 | **Variable shadowing** em `generate_daily_missions` - parametro `mission_date` mascarava coluna | ALTO | CORRIGIDO |
| 7 | **Funcao `get_lesson_progress_detail` nao existia** - chamada pelo hook `useLessons` | ALTO | CORRIGIDO |
| 8 | **Coluna `coins` nao existia** no schema principal - loja usava XP ao inves de coins | ALTO | CORRIGIDO |
| 9 | **RLS em tabelas erradas** - policies referenciavam `user_progress` e `quiz_attempts` que nao existiam | ALTO | CORRIGIDO |
| 10 | **Role CHECK nao incluia `admin` nem `caixa`** em alguns schemas | MEDIO | CORRIGIDO |

### 1.2 Mobile - Problemas

| # | Problema | Gravidade | Status |
|---|---------|-----------|--------|
| 1 | **Ranking expunha todos os usuarios** - SELECT direto na tabela users, top 10 visivel | CRITICO | CORRIGIDO |
| 2 | **Botao debug visivel em producao** - "Pular para Quiz (Debug)" | ALTO | CORRIGIDO |
| 3 | **Role do signup ignorada** - useUserData sempre criava usuario com `role: 'funcionario'` | ALTO | CORRIGIDO |
| 4 | **Colunas erradas na criacao do usuario** - usava `xp_total`, `streak_days` ao inves de `total_xp`, `current_streak` | MEDIO | CORRIGIDO |
| 5 | **Hooks `useAchievements` e `useDailyMissions` nunca usados** na UI | MEDIO | Documentado |
| 6 | **Codigo morto** - `AulaQuizScreen`, `SelectRoleScreen` definidos mas nao usados | BAIXO | Documentado |
| 7 | **Credenciais hardcoded** em `lib/supabase.js` | MEDIO | Documentado |

### 1.3 Admin Web - Problemas

| # | Problema | Gravidade | Status |
|---|---------|-----------|--------|
| 1 | **RequireAdmin era no-op** - qualquer usuario logado acessava o admin | CRITICO | CORRIGIDO |
| 2 | **Dashboard com dados hardcoded** - KPIs, graficos, trilhas populares tudo estatico | ALTO | CORRIGIDO |
| 3 | **12+ botoes sem handler** - Loja, Config, Relatorios, menus de acoes | ALTO | CORRIGIDO |
| 4 | **Sem gestao de loja/premios** - nenhuma tela para gerenciar itens da loja | ALTO | CORRIGIDO |
| 5 | **Sem ranking completo no admin** - nenhuma tela de ranking | ALTO | CORRIGIDO |
| 6 | **Sem gestao de missoes** - nenhuma tela para criar/editar missoes diarias | ALTO | CORRIGIDO |
| 7 | **Sem edicao/exclusao de trilhas** - so criacao, sem update/delete na UI | MEDIO | Parcial |
| 8 | **Sem edicao de role do usuario** - botao MoreVertical sem acao | ALTO | CORRIGIDO |
| 9 | **adminDb.js incompleto** - faltavam metodos para loja, ranking, missoes, edicao | ALTO | CORRIGIDO |
| 10 | **Sem exportacao CSV/PDF** | MEDIO | CORRIGIDO (CSV no Ranking) |

---

## 2. O QUE FOI CORRIGIDO

### 2.1 SQL - Migracao Unificada (`sql/99_unified_migration.sql`)

**Tabelas criadas/ajustadas:**
- `users` - adicionadas colunas `coins`, `total_xp`, `current_streak`, `max_streak`, `lessons_completed`, `quizzes_completed`, `is_active`, `franchise_unit_id`
- `user_progress` - **NOVA** - tabela critica que nunca existia
- `quiz_attempts` - **NOVA** - tabela critica que nunca existia
- `audit_log` - **NOVA** - auditoria de acoes
- `franchise_units` - **NOVA** - gestao por franquia
- Todas as demais tabelas verificadas com `IF NOT EXISTS` e colunas adicionadas com seguranca

**Funcoes corrigidas:**
- `complete_lesson` - agora registra na tabela correta e atualiza stats
- `answer_quiz` / `submit_quiz_answer` - com decay de XP por tentativas
- `get_user_dashboard` - retorna dados reais do usuario
- `get_trail_progress` - calcula progresso real
- `get_my_ranking` - **NOVA** - retorna APENAS a posicao do usuario logado (privacidade)
- `get_full_ranking` - **NOVA** - ranking completo so para admin/gerente
- `purchase_store_item` - **CORRIGIDA** - removido trigger de double deduction
- `get_admin_overview` - **NOVA** - dados reais para dashboard admin
- `get_lesson_progress_detail` - **NOVA** - faltava para o hook useLessons
- `record_daily_activity` - **CORRIGIDA** - sem variable shadowing
- `update_daily_mission_progress` - **CORRIGIDA** - sem shadowing de `mission_date`
- `check_achievement` - funcional com todos os tipos

**Dados iniciais:**
- 10 conquistas pre-cadastradas
- 7 missoes diarias pre-cadastradas
- 5 itens da loja pre-cadastrados

### 2.2 RLS Policies (`sql/99b_rls_policies.sql`)

Policies completas para **17 tabelas**:
- `users` - usuario ve/edita so seus dados; admin ve tudo
- `user_progress` - usuario ve so seu progresso
- `quiz_attempts` - usuario ve so suas tentativas
- `trails`, `lessons`, `quizzes`, `quiz_options` - todos veem ativos; admin CRUD completo
- `achievements`, `store_items`, `daily_missions` - todos veem ativos; admin CRUD
- `user_achievements`, `user_purchases`, `user_daily_missions`, `user_streaks` - usuario ve so os seus
- `audit_log` - so admin
- `franchise_units` - todos leem; admin gerencia
- `app_settings` - todos leem; admin gerencia

Funcoes auxiliares: `is_admin()`, `is_owner()`

### 2.3 Mobile

- **Ranking** reescrito para usar `get_my_ranking` - mostra apenas a posicao e estatisticas do proprio usuario
- **Debug button** removido do `LessonDetailsScreen`
- **useUserData** agora respeita o role do signup via `user.user_metadata?.role`
- **useUserData** agora cria usuario com colunas corretas (`total_xp`, `coins`, `current_streak`, etc.)

### 2.4 Admin Web

- **RequireAdmin** agora verifica se o usuario tem role `admin` ou `gerente`
- **Dashboard** com dados reais via `get_admin_overview` RPC
- **3 novas paginas** no sidebar:
  - **Ranking** - ranking completo com top 3 destacado, busca, exportacao CSV
  - **Loja & Premios** - CRUD de itens, historico de compras, toggle disponibilidade
  - **Missoes Diarias** - CRUD de missoes, toggle ativa/inativa, dificuldade
- **AdminUsers** - dropdown para alterar role diretamente na tabela
- **adminDb.js** expandido com: `ranking.getFull`, `storeItems.*`, `purchases.*`, `missions.*`, `trails.update`

---

## 3. COMO EXECUTAR

### Passo 1: Executar SQL no Supabase

1. Acesse o Supabase SQL Editor
2. Execute `sql/99_unified_migration.sql` (cria/ajusta tabelas e funcoes)
3. Execute `sql/99b_rls_policies.sql` (aplica RLS em todas as tabelas)

### Passo 2: Testar Mobile

```bash
cd mobile
npm install
npx expo start
```

### Passo 3: Testar Admin Web

```bash
cd web
npm install
npm run dev
```

---

## 4. CHECKLIST DE TESTES

### 4.1 Backend (SQL + RLS)

- [ ] Executar `99_unified_migration.sql` sem erros
- [ ] Executar `99b_rls_policies.sql` sem erros
- [ ] Verificar que tabela `user_progress` foi criada
- [ ] Verificar que tabela `quiz_attempts` foi criada
- [ ] Verificar que tabela `audit_log` foi criada
- [ ] Verificar que tabela `franchise_units` foi criada
- [ ] Verificar que `users` tem colunas `coins`, `total_xp`, `is_active`
- [ ] Testar `get_my_ranking` - retorna so dados do proprio usuario
- [ ] Testar `get_full_ranking` - retorna erro se chamado por usuario comum
- [ ] Testar `get_full_ranking` - retorna ranking completo se chamado por admin
- [ ] Testar `purchase_store_item` - deduz coins apenas 1 vez
- [ ] Testar `complete_lesson` - registra progresso e atualiza XP
- [ ] Testar `answer_quiz` - registra tentativa e aplica decay de XP
- [ ] Testar RLS: usuario nao consegue `SELECT * FROM users` (so ve seus dados)
- [ ] Testar RLS: admin consegue ver todos os usuarios

### 4.2 Mobile

- [ ] Login funciona
- [ ] Cadastro respeita role selecionada
- [ ] Dashboard mostra dados reais do usuario
- [ ] Trilhas aparecem filtradas por role
- [ ] Aulas carregam com progresso
- [ ] Quiz funciona (responder, ver resultado)
- [ ] **Ranking mostra APENAS posicao propria** (nao expoe outros usuarios)
- [ ] Loja mostra itens disponiveis
- [ ] Compra de item funciona e deduz coins
- [ ] Perfil mostra dados corretos
- [ ] Botao de debug NAO aparece na tela de aula

### 4.3 Admin Web

- [ ] Login funciona so para admin/gerente
- [ ] Usuario com role `funcionario` ve mensagem "Acesso Negado"
- [ ] Dashboard mostra KPIs reais (total usuarios, XP, aulas concluidas)
- [ ] Grafico de conclusoes mensais funciona
- [ ] Grafico pizza ativos vs inativos funciona
- [ ] **Ranking** mostra todos os usuarios com posicao
- [ ] Ranking permite busca por nome/email
- [ ] Ranking permite exportar CSV
- [ ] **Loja** mostra todos os itens
- [ ] Loja permite criar novo item
- [ ] Loja permite ativar/desativar item
- [ ] Loja permite remover item
- [ ] Loja mostra historico de compras
- [ ] **Missoes** mostra todas as missoes
- [ ] Missoes permite criar nova missao
- [ ] Missoes permite ativar/desativar
- [ ] **Usuarios** permite alterar role via dropdown
- [ ] Usuarios permite ativar/desativar
- [ ] Relatorios carrega dados reais

---

## 5. SUGESTOES DE NOVAS FUNCIONALIDADES

### 5.1 Prioridade Alta

1. **Missoes semanais/mensais** - alem das diarias, desafios de prazo mais longo
2. **Sistema de niveis e badges visuais** - exibir badges no perfil do usuario
3. **Notificacoes push** - lembrar usuario de missoes, streaks, novas aulas (via Expo Notifications)
4. **Anti-fraude** - limite diario de XP por usuario (configuravel no admin), validacao server-side de tentativas de quiz

### 5.2 Prioridade Media

5. **Campanhas por franquia/unidade** - competicoes entre unidades
6. **Desafios em grupo** - times competindo por XP coletivo
7. **Sistema de aprovacao manual** para resgates de premios fisicos na loja
8. **Exportacao Excel** de relatorios no admin (alem do CSV)
9. **Filtros avancados no ranking** - por franquia, periodo, role
10. **Historico de XP** - grafico de evolucao de XP do usuario ao longo do tempo

### 5.3 Prioridade Baixa

11. **Tema escuro** no mobile
12. **Animacoes de conquista** - celebracao ao desbloquear badge
13. **Chat entre usuarios** - ja existe hook `useChat` mas nao esta integrado
14. **Sistema de mentoria** - gerente acompanha funcionarios da sua unidade
15. **Integracao com calendario** - agendar sessoes de estudo
16. **Gamificacao do admin** - KPIs gamificados para gerentes (meta de engajamento)

### 5.4 Arquitetura Futura

17. **Migrar para React Navigation** no mobile (ao inves do router manual)
18. **Separar App.js em componentes** - o arquivo tem 1600+ linhas, deveria ser modular
19. **Usar variaves de ambiente** para credenciais Supabase (nao hardcodar)
20. **Edge Functions** para logica sensivel (evitar que cliente manipule XP/coins)

---

## 6. ESTRUTURA DE ARQUIVOS MODIFICADOS

```
sql/
  99_unified_migration.sql    # NOVO - migracao unificada
  99b_rls_policies.sql        # NOVO - RLS completas

mobile/
  App.js                      # EDITADO - ranking privado, debug removido
  hooks/useUserData.js        # EDITADO - role do signup, colunas corretas

web/src/
  App.jsx                     # EDITADO - RequireAdmin funcional
  services/adminDb.js         # EDITADO - metodos para loja, ranking, missoes
  components/admin/
    AdminDashboard.jsx        # REESCRITO - dados reais, novos menus
    AdminRanking.jsx          # NOVO - ranking completo
    AdminLoja.jsx             # NOVO - gestao da loja
    AdminMissoes.jsx          # NOVO - gestao de missoes
    AdminUsers.jsx            # EDITADO - dropdown de role

DIAGNOSTICO_E_PLANO.md       # NOVO - este documento
```
