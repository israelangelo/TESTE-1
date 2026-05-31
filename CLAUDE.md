╔══════════════════════════════════════════════════════════════════╗
║           BOX AGÊNCIA — CONTEXTO DE CONTINUIDADE                ║
║                    Atualizado: 30/05/2026                       ║
╚══════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 REGRAS OBRIGATÓRIAS — LEIA ANTES DE QUALQUER AÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Edite os arquivos DIRETAMENTE no projeto — nunca mostre código
   para colar manualmente.

2. Após concluir qualquer tarefa, atualize este CONTEXTO.md:
   - Mova o item resolvido para ✅ CONCLUÍDO com [x]
   - Atualize a seção 🕐 ÚLTIMA SESSÃO

3. NUNCA altere itens marcados com [x] CONGELADO sem confirmação
   explícita do usuário.

4. Antes de qualquer alteração em Firebase Rules, Auth ou estrutura
   do Firestore — pergunte primeiro.

5. Stack do projeto: Vite + React + PWA + Firebase (Auth, Firestore,
   Storage). Sempre respeite essa stack — não sugira trocar libs.

6. Após cada alteração de código, verifique se o app ainda builda:
   npm run dev

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CONCLUÍDO E CONGELADO — NÃO MEXER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[x] PWA base (Vite + React + SW + manifest)
[x] CSS global mobile-first
[x] Firebase Auth + Firestore + Storage
[x] AuthContext completo
[x] Rotas + RotaProtegida por perfil
[x] Login — abas Entrar/Criar Conta
[x]   └─ "Lembrar de mim" + setPersistence Firebase
[x]   └─ autoComplete Google Senhas (Chrome + Android)
[x]   └─ fix Chrome desktop
[x] design system tokens.js iOS premium
[x] gestor/Dashboard — iOS premium + menu lateral
[x] gestor/Promotores, Lojas, Clientes — Firestore
[x] gestor/Lojas — CRUD completo + GPS automático
[x] gestor/Clientes — CRUD completo + multiselect lojas
[x] gestor/Configuracoes — cadastrar usuário
[x] gestor/Escala — CRUD completo Firestore
[x]   └─ atribuir múltiplas lojas por dia a promotor
[x]   └─ bottom sheet detalhe + editar/excluir
[x] promotor/Dashboard — GPS + rota + foto fachada
[x]   └─ stepper 3 etapas (GPS → Foto → Envio)
[x]   └─ upload foto Firebase Storage
[x]   └─ checkin salvo com fotoURL no Firestore
[x] Ícones PWA atualizados
[x] BUG 1 — check-in usa loja da escala do dia
[x] BUG 2 — tarefas salvas no Firestore por uid+lojaId+data
[x] BUG 3 — gestor/Relatorios.jsx construído e funcional
[x] BUG 4 — proteção contra checkin duplicado ativa
[x] BUG 6 — ID do Firestore nunca aparece na tela de Escala
            (TagNome + resolverNome substituem IDs por nomes)
[x] Item 3 — onSnapshot ativo nos 3 listeners da Escala
             (promotores, lojas, escalas em tempo real)
[x] hook useBackButton.js gerado — botão voltar Android
[x] useBackButton integrado em: Escala.jsx, promotor/Dashboard.jsx,
             Promotores.jsx, Lojas.jsx, Clientes.jsx, Configuracoes.jsx,
             Relatorios.jsx, Mapa.jsx — TODAS AS TELAS INTEGRADAS ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 BUGS CRÍTICOS — BLOQUEIA LANÇAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[!] BUG 5 — lojaId ausente no cadastro de alguns promotores
            → validação de raio GPS ignorada silenciosamente.
            CORREÇÃO: verificar no Firebase Console se todos
            os promotores têm o campo lojaId preenchido.
            PRIORIDADE: MÁXIMA — fazer antes de qualquer outra coisa.
            (ação manual no Firebase Console — não é código)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟠 FILA CRÍTICA — sem isso não dá para usar em campo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. [CRÍTICO] BUG 5 — corrigir lojaId nos cadastros (Firebase Console)

2. [CRÍTICO] Verificar "Permanecer logado" em todos os perfis
            → base existe no Login, confirmar que funciona em campo

3. [CRÍTICO] Integrar useBackButton nas telas restantes do gestor:
            → Promotores.jsx    ✅
            → Lojas.jsx         ✅
            → Clientes.jsx      ✅
            → Configuracoes.jsx ✅
            → Relatorios.jsx    ✅
            → Mapa.jsx          ✅
            CONCLUÍDO — todas as telas do gestor integradas.

4. [CRÍTICO] Teste real de câmera Android
            → cada fabricante trata capture="environment" diferente
            → testar em Samsung, Motorola e Xiaomi se possível

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟡 FILA IMPORTANTE — compromete o uso diário
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5.  [IMPORTANTE] Aviso claro ao promotor sem rota escalada hoje
6.  [IMPORTANTE] Check-in/out registrando hora correta no relatório
7.  [IMPORTANTE] Relatório mostrando dados reais (estava zerado)
8.  [IMPORTANTE] Relatório por promotor: tempo em loja, entrada/saída
9.  [IMPORTANTE] Firebase Storage Rules mais restritivas
                (promotor só escreve na própria pasta)
10. [IMPORTANTE] Tratamento de erro de rede no upload de foto
                (retry automático ou fila offline)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 FUNCIONALIDADES PADRÃO DE TRADE — após estabilidade
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REFERÊNCIA: padrão dos apps líderes
(Involves Stage, Checkmob, maxPromotor, PDV Info)

── PROMOTOR EM CAMPO ──
11. [TRADE] Foto da FACHADA obrigatória no check-in
            → promotor NÃO pode avançar sem tirar a foto
12. [TRADE] Foto ANTES e DEPOIS obrigatória por seção/cliente
            → não fecha a seção sem ambas as fotos registradas
            → fotos marcadas com data, hora e localização (auditoria)
13. [TRADE] Checklist dinâmico por seção — não avança sem completar
14. [TRADE] Ruptura de SKU — registrar produto em falta na gôndola
15. [TRADE] Validade de produtos — registrar vencimentos encontrados
16. [TRADE] Pesquisa de concorrência — preço do concorrente na seção
17. [TRADE] Foto obrigatória no checkout — não sai sem foto final
18. [TRADE] Registro de pausa (botão Almoço / Volta) com timestamp
19. [TRADE] Modo offline — app funciona sem internet e sincroniza
            automaticamente quando a conexão retornar
20. [TRADE] Abrir Maps direto na loja — botão na tela da rota

── GESTOR ──
21. [TRADE] Mapa tempo real — pins de cada promotor com status
            → verde (ativo), amarelo (parado), vermelho (sem sinal)
22. [TRADE] Status visual por promotor — bolinha colorida em tempo real
23. [TRADE] Notificação push ao gestor:
            → quando promotor faz check-in
            → quando promotor fica +X horas sem registrar nada
24. [TRADE] Histórico do promotor:
            → dias trabalhados no mês
            → média de tempo em loja
            → lojas visitadas
            → % de cobertura da rota
25. [TRADE] Confirmação de rota — promotor confirma escala recebida,
            gestor vê quem confirmou e quem não confirmou
26. [TRADE] Dashboard de indicadores:
            → taxa de ruptura por loja/marca
            → tempo médio de permanência no PDV
            → quantidade de visitas por dia
            → % cumprimento de rota
            → Shelf Space (quantidade de frentes)
            → Shelf Life (vencimentos)
            → ações da concorrência registradas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 MELHORIAS DE UX/UI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

27. [UX] Modo Fluido do promotor — jornada completa animada
28. [UX] Background vivo com geometria animada
29. [UX] Transições estilo iOS nativo com Framer Motion

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔲 BACKLOG — depois do lançamento
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ ] promotor — mix de produtos por loja/cliente
[ ] promotor — book de fotos completo (10 tipos de registro)
[ ] cliente/Dashboard — iOS premium com dados reais
[ ] integração API com outras plataformas de trade

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 ÚLTIMA SESSÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Data: 30/05/2026

O que foi feito:
  - Integrado useBackButton em TODAS as telas do gestor:
    Promotores.jsx, Lojas.jsx, Clientes.jsx, Configuracoes.jsx,
    Relatorios.jsx, Mapa.jsx (item 3 da fila crítica CONCLUÍDO)

Onde parou:
  - BUG 5 aguarda correção manual no Firebase Console (lojaId nos promotores)
  - Item 2: confirmar "Permanecer logado" funciona em campo
  - Item 4: Teste real de câmera Android

Próximo passo:
  1. BUG 5 no Firebase Console (manual — lojaId ausente em promotores)
  2. Verificar "Permanecer logado" em campo (item 2)
  3. Aviso claro ao promotor sem rota escalada (item 5 — importante)
  4. Relatório com dados reais (item 7 — importante)
