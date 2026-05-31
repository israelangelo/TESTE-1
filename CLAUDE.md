╔══════════════════════════════════════════════════════════════════╗
║           BOX AGÊNCIA — CONTEXTO DE CONTINUIDADE                ║
║                    Atualizado: 31/05/2026                       ║
╚══════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 REGRAS OBRIGATÓRIAS — LEIA ANTES DE QUALQUER AÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Edite os arquivos DIRETAMENTE no projeto — nunca mostre código
   para colar manualmente.

2. Após concluir qualquer tarefa, atualize este CLAUDE.md:
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
[x] Item 3 — onSnapshot nos 3 listeners da Escala (tempo real)
[x] hook useBackButton.js — botão voltar Android
[x] useBackButton em TODAS as telas (Escala, promotor/Dashboard,
             Promotores, Lojas, Clientes, Configuracoes,
             Relatorios, Mapa)
[x] Item 5 — aviso ao promotor sem rota escalada hoje
             (banner amarelo na aba Início + botão check-in desabilitado
              + tela vazia na aba Rota — JÁ ESTAVA IMPLEMENTADO)
[x] Item 6 — hora correta no relatório
             (serverTimestamp() no checkin + formatarHora() no relatório
              — JÁ ESTAVA IMPLEMENTADO)
[x] Item 7 — relatório com dados reais
             (onSnapshot em checkins/fotos_pdv/rupturas, filtros por data,
              promotor e loja — JÁ ESTAVA IMPLEMENTADO)
[x] Item 8 — relatório por promotor: tempo em loja, entrada/saída
             (tempoVisita no checkout, formatarTempo() no relatório
              — JÁ ESTAVA IMPLEMENTADO)
[x] Item 9 — Firebase Storage Rules restritivas
             (arquivo storage.rules criado — promotor só escreve
              em checkins/{uid}/ e fotos_pdv/{uid}/)
             AÇÃO MANUAL: publicar via Firebase Console ou CLI:
             firebase deploy --only storage
[x] Item 10 — retry automático + fila offline no upload
              (uploadComRetry com 3 tentativas + localStorage queue
               — JÁ ESTAVA IMPLEMENTADO)
[x] Item 11 — foto da FACHADA obrigatória no check-in
              (promotor NÃO avança sem foto — etapa 'foto' bloqueia
               — JÁ ESTAVA IMPLEMENTADO)
[x] Item 14 — Ruptura de SKU implementada
              (sheet Ruptura, toggle por SKU, salva em Firestore
               — JÁ ESTAVA IMPLEMENTADO)
[x] Item 19 — Modo offline + sincronização automática
              (fila localStorage + reenvio automático ao reconectar
               — JÁ ESTAVA IMPLEMENTADO)
[x] Item 20 — Abrir Maps direto na loja
              (botão 🗺️ Rota na aba Rota do promotor abre
               maps.google.com/?q=lat,lng — JÁ ESTAVA IMPLEMENTADO)
[x] Item 21 — Mapa tempo real com pins por promotor
              (gestor/Mapa.jsx com Leaflet + onSnapshot em checkins de hoje
               + lista de promotores ativos — JÁ ESTAVA IMPLEMENTADO)
[x] Item 22 — Status visual por promotor no gestor/Dashboard
              (seção "PROMOTORES HOJE" com bolinha colorida em tempo real:
               verde=ativo, amarelo=parado, cinza=encerrou, vermelho=sem sinal
               + link para Mapa ao Vivo — IMPLEMENTADO 31/05)
[x] Item 25 — Confirmação de rota pelo promotor
              (botão "✓ Confirmar rota" na aba Rota do promotor;
               salva rotaConfirmada+rotaConfirmadaEm no Firestore escalas;
               badge "✓ confirmada" visível no gestor/Escala — IMPLEMENTADO 31/05)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 PENDÊNCIA MANUAL — AÇÃO DO USUÁRIO NECESSÁRIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[!] BUG 5 — lojaId ausente em alguns promotores
            CORREÇÃO: no Firebase Console → Firestore → usuarios
            → abrir cada promotor → adicionar campo lojaId
            com o ID da loja correta.

[!] Storage Rules — publicar o arquivo storage.rules no Firebase:
            firebase deploy --only storage
            (ou copiar o conteúdo no Firebase Console → Storage → Rules)

[!] Teste real câmera Android — testar capture="environment" em
            Samsung, Motorola e Xiaomi. Se falhar em algum fabricante,
            abrir issue no próximo contexto.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟡 PRÓXIMAS FUNCIONALIDADES — ordem de prioridade
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

23. [ ] Notificação push ao gestor (check-in + ausência prolongada)

24. [ ] Histórico mensal do promotor
        (dias trabalhados, tempo médio, % cobertura da rota)

26. [ ] Dashboard de indicadores para o gestor
        (ruptura por loja, tempo médio no PDV, % rota cumprida)

12. [ ] Foto ANTES e DEPOIS obrigatória por seção
        (com metadados de data/hora/GPS para auditoria)

13. [ ] Checklist dinâmico por seção — não avança sem completar

15. [ ] Validade de produtos — registrar vencimentos encontrados

16. [ ] Pesquisa de concorrência — preço do concorrente na seção

17. [ ] Foto obrigatória no checkout

18. [ ] Registro de pausa (botão Almoço / Volta) com timestamp

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 MELHORIAS DE UX/UI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

27. [ ] Modo Fluido do promotor — jornada completa animada
28. [ ] Background vivo com geometria animada
29. [ ] Transições estilo iOS nativo com Framer Motion

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

Data: 31/05/2026

O que foi feito:
  - Auditoria do código vs CLAUDE.md — itens 20 e 21 já estavam
    implementados (Maps button no promotor + Mapa.jsx com Leaflet)
  - Item 22 — Status visual em tempo real no gestor/Dashboard:
    seção "PROMOTORES HOJE" com bolinhas coloridas (verde/amarelo/
    cinza/vermelho) baseada em onSnapshot dos checkins de hoje.
    Lógica: ativo (<60min desde checkin), parado (>60min), finalizado
    (checkout registrado), sem sinal (sem checkin hoje).
    Botão "Ver no Mapa ao Vivo" redireciona para gestor/Mapa.
  - Item 25 — Confirmação de rota pelo promotor:
    Botão "✓ Confirmar rota" na aba Rota do promotor/Dashboard.
    Salva rotaConfirmada=true + rotaConfirmadaEm + rotaConfirmadaNome
    no documento da escala no Firestore. Badge "✓ confirmada" (verde)
    aparece no card da escala em gestor/Escala.jsx em tempo real
    (já usa onSnapshot).

Arquivos alterados:
  - src/pages/gestor/Dashboard.jsx (reescrito com status em tempo real)
  - src/pages/promotor/Dashboard.jsx (estado + função + UI confirmação)
  - src/pages/gestor/Escala.jsx (badge "✓ confirmada" no card)

Pendências manuais (ação do usuário):
  - BUG 5: vincular lojaId nos promotores (Firebase Console)
  - Publicar storage.rules (firebase deploy --only storage)
  - Testar câmera Android em campo

Próximo passo (código):
  1. Item 23 — notificação push ao gestor
  2. Item 26 — dashboard de indicadores (ruptura/tempo/cobertura)
  3. Item 24 — histórico mensal do promotor
