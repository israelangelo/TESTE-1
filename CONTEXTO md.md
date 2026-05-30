╔══════════════════════════════════════════════════════════════════╗
║           BOX AGÊNCIA — CONTEXTO DE CONTINUIDADE                ║
║                    Atualizado: 30/05/2026                       ║
╚══════════════════════════════════════════════════════════════════╝

📌 REGRA OBRIGATÓRIA PARA A IA
────────────────────────────────────────
SEMPRE que for gerar um código:
1. Primeiro entregue a versão atualizada deste CONTEXTO.md
2. Depois mostre ONDE colar (qual arquivo, Ctrl+A e cola)
3. Depois gere o código COMPLETO na tela (não em arquivo separado)
Nunca inverter essa ordem.

✅ CONCLUÍDO E CONGELADO — NÃO MEXER
────────────────────────────────────────
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
[x] BUG 1 RESOLVIDO — check-in agora usa loja da escala do dia
[x] BUG 2 RESOLVIDO — tarefas salvas no Firestore por uid+lojaId+data
[x] BUG 3 RESOLVIDO — gestor/Relatorios.jsx construído e funcional
[x] BUG 4 RESOLVIDO — proteção contra checkin duplicado ativa

🔴 BUGS CRÍTICOS — BLOQUEIA LANÇAMENTO
────────────────────────────────────────
[!] BUG 5 — lojaId ausente no cadastro de alguns promotores
            → validação de raio GPS ignorada silenciosamente.
            CORREÇÃO: verificar no Firebase Console se todos
            os promotores têm o campo lojaId preenchido.
            PRIORIDADE: MÁXIMA — fazer antes de qualquer outra coisa.

[!] BUG 6 — ID do Firestore aparecendo na tela de Escala
            (ex: "iGeUWnlof3UnxBqhrKdg" visível ao promotor)
            CORREÇÃO: substituir por nome da loja/promotor na exibição.
            PRIORIDADE: ALTA — não pode ir para o campo assim.

🟠 FILA CRÍTICA — sem isso não dá para usar em campo
────────────────────────────────────────
1. [CRÍTICO] BUG 5 — corrigir lojaId nos cadastros (Firebase Console)
2. [CRÍTICO] BUG 6 — ocultar ID Firestore na tela de Escala
3. [CRÍTICO] Sincronização tempo real gestor ↔ promotor
             → ativar listeners onSnapshot no Firestore (já suporta)
4. [CRÍTICO] Verificar "Permanecer logado" em todos os perfis
             (base existe no Login, confirmar que funciona em campo)
5. [CRÍTICO] Botão voltar Android em TODAS as telas
             → useNavigate(-1) + interceptar evento hardware back
6. [CRÍTICO] Teste real de câmera Android
             → cada fabricante trata capture="environment" diferente;
               testar em Samsung, Motorola e Xiaomi se possível

🟡 FILA IMPORTANTE — compromete o uso diário
────────────────────────────────────────
7.  [IMPORTANTE] Aviso claro ao promotor sem rota escalada hoje
8.  [IMPORTANTE] Check-in/out registrando hora correta no relatório
9.  [IMPORTANTE] Relatório mostrando dados reais (estava zerado)
10. [IMPORTANTE] Relatório por promotor: tempo em loja, entrada/saída
11. [IMPORTANTE] Firebase Storage Rules mais restritivas
                 (promotor só escreve na própria pasta)
12. [IMPORTANTE] Tratamento de erro de rede no upload de foto
                 (retry automático ou fila offline)

🟢 FUNCIONALIDADES PADRÃO DE TRADE — adicionar após estabilidade
────────────────────────────────────────
REFERÊNCIA: padrão de mercado dos apps líderes
(Involves Stage, Checkmob, maxPromotor, PDV Info)

── PROMOTOR EM CAMPO ──
13. [TRADE] Foto da FACHADA obrigatória no check-in
            → promotor NÃO pode avançar sem tirar a foto
14. [TRADE] Foto ANTES e DEPOIS obrigatória por seção/cliente
            → não fecha a seção sem ambas as fotos registradas
            → fotos marcadas com data, hora e localização (auditoria)
15. [TRADE] Checklist dinâmico por seção — não avança sem completar
16. [TRADE] Ruptura de SKU — registrar produto em falta na gôndola
17. [TRADE] Validade de produtos — registrar vencimentos encontrados
18. [TRADE] Pesquisa de concorrência — preço do concorrente na seção
19. [TRADE] Foto obrigatória no checkout — não sai sem foto final
20. [TRADE] Registro de pausa (botão Almoço / Volta) com timestamp
21. [TRADE] Modo offline — app funciona sem internet e sincroniza
            automaticamente quando a conexão retornar
22. [TRADE] Abrir Maps direto na loja — botão na tela da rota

── GESTOR ──
23. [TRADE] Mapa tempo real — pins de cada promotor com status
            → verde (ativo), amarelo (parado), vermelho (sem sinal)
24. [TRADE] Status visual por promotor — bolinha colorida em tempo real
25. [TRADE] Notificação push ao gestor:
            → quando promotor faz check-in
            → quando promotor fica +X horas sem registrar nada
26. [TRADE] Histórico do promotor:
            → dias trabalhados no mês
            → média de tempo em loja
            → lojas visitadas
            → % de cobertura da rota
27. [TRADE] Confirmação de rota — promotor confirma escala recebida,
            gestor vê quem confirmou e quem não confirmou
28. [TRADE] Dashboard de indicadores:
            → taxa de ruptura por loja/marca
            → tempo médio de permanência no PDV
            → quantidade de visitas por dia
            → % cumprimento de rota
            → Shelf Space (quantidade de frentes)
            → Shelf Life (vencimentos)
            → ações da concorrência registradas

🏢 CADASTRO DE MARCA (cliente da Box Agência)
────────────────────────────────────────
Quando a Box cadastra um cliente (ex: Uau Ingleza), os campos são:

DADOS DA EMPRESA
  • Razão Social
  • Nome Fantasia
  • CNPJ
  • Inscrição Estadual
  • Endereço da sede
  • Telefone comercial
  • E-mail comercial
  • Site / Instagram

CONTATO RESPONSÁVEL NA EMPRESA
  • Nome do contato
  • Cargo
  • WhatsApp do responsável
  • E-mail do responsável

CONTRATO COM A BOX AGÊNCIA
  • Data de início do contrato
  • Plano contratado (Básico / Pro / Premium)
  • Valor do fee mensal
  • Observações do contrato

CONFIGURAÇÃO DO ATENDIMENTO
  • Lojas que serão atendidas (seleção do banco de lojas)
  • Promotor(es) designados para a marca
  • Frequência de visitas (diária / 3x semana / semanal)
  • Produtos cadastrados da marca (para checklist de ruptura)
  • Seções/categorias que a marca ocupa nas lojas

ACESSO DO CLIENTE AO PAINEL
  • Código da marca — gerado automaticamente (ex: UAUING-2026)
  • O cliente só finaliza o cadastro no app com este código
  • Com o código, o cliente acessa:
      → Relatórios de visitas
      → Fotos registradas pelos promotores
      → Histórico de atendimentos por loja
      → Indicadores de execução
      → Exportação em Excel, PDF e WhatsApp

29. [FEATURE] Tela gestor/Marcas — CRUD completo de clientes/marcas
              com todos os campos acima + geração de código de acesso
30. [FEATURE] Tela cliente/Dashboard — painel com dados reais do cliente
              filtrado pelo código da marca
31. [FEATURE] Exportação de relatório — Excel + PDF + botão compartilhar
              WhatsApp direto da tela de relatório

🏪 BANCO DE LOJAS — GRANDE VITÓRIA (pré-cadastrado)
────────────────────────────────────────
Principais redes e filiais para já cadastrar no app.
A IA deve criar estes registros no Firestore quando solicitado.

CARONE (10 filiais na Grande Vitória)
  CNPJ matriz: 28.129.260/0005-04
  • Santa Lúcia — Vitória
  • Jardim da Penha — Vitória (Av. Hugo Viola, 615)
  • Praia do Canto — Vitória (Rua Joaquim Lírio)
  • Praia de Itaparica — Vila Velha (Av. Santa Leopoldina, 2700)
  • Itaparica — Vila Velha
  • Gaivotas — Vila Velha
  • Filiais em Serra
  • Filiais em Cariacica

EXTRABOM (26 lojas — região metropolitana + Norte ES)
  • Filiais em Vitória, Vila Velha, Serra, Cariacica, Guarapari

PERIM (presente em toda Grande Vitória)
  • Enseada do Suá — Vitória
  • Mata da Praia — Vitória
  • Itaparica — Vila Velha
  • Aribiri — Vila Velha
  • Riviera da Barra — Vila Velha
  • Filiais em Serra

SUPERMERCADOS BH (expansão acelerada no ES)
  • Jardim Camburi — Vitória (Av. José Maria Vivacqua Santos, 1110)
  • Cariacica (unidade recente)
  • Outras filiais na Grande Vitória

SÃO JOSÉ SUPERMERCADOS
  • Praia do Canto — Vitória (Reta da Penha / Ed. Top Center)
  • Outras filiais

NOSSA REDE (19 lojas na Grande Vitória)
  • Padre Gabriel — Cariacica
  • Planalto Serrano — Serra (Av. Brasília, 938)
  • Resistência — Vitória (Rua América do Sul, 178)
  • São Marcos I — Serra (Rua Fabiano Nunes Fraga, 57)
  • Serra Dourada III — Serra (Av. São Paulo, 24)
  • Terra Vermelha — Vila Velha (Rua Afonso Cláudio, 02)
  • Nova Carapina II — Serra (Av. Montes Claro)
  • Jardim Tropical — Serra (Av. Dido Fontes, 90)

ASSAÍ ATACADISTA — presente na Grande Vitória
ATACADÃO — presente na Grande Vitória
CARREFOUR — presente na Grande Vitória

CAMPO DE CADA LOJA NO FIRESTORE:
  nome, nomeFantasia, rede, cnpj, endereco, bairro, cidade,
  cep, telefone, latitude, longitude, ativo: true

🟢 MELHORIAS DE UX/UI
────────────────────────────────────────
32. [UX] Modo Fluido do promotor — jornada completa animada:
         Loja → Foto fachada → Clientes/tarefas → Fechamento
         → Checkout → Tela de comemoração (confetti/animação)
         ⚠️ Protótipo .jsx criado em 30/05/2026
         Próximo passo: integrar no promotor/Dashboard

33. [UX] Background vivo com geometria animada
         (azul com formas geométricas animadas — não opaco)
         ⚠️ Já incluído no protótipo .jsx de 30/05/2026

34. [UX] Transições estilo iOS nativo em todas as telas
         → usar Framer Motion (padrão de mercado para React)
         → slide + fade simultâneo, spring physics, haptic feedback

🗺️ GOOGLE MAPS — APIs e configuração
────────────────────────────────────────
O app usa 3 APIs do Google Maps Platform:

API 1 — Maps JavaScript API
  • Para quê: exibir o mapa no painel do gestor com pins
    dos promotores em tempo real
  • Biblioteca React: @vis.gl/react-google-maps
    (oficial Google, lançada 2025 — padrão recomendado)
  • Instalar: npm i @vis.gl/react-google-maps

API 2 — Geolocation (nativa do browser)
  • Para quê: capturar GPS do promotor em campo
  • Como: navigator.geolocation.watchPosition()
    já está implementado no app — NÃO precisa da API
    paga do Google para isso. O browser faz nativamente.
  • API paga do Google Geolocation só é fallback se o
    GPS falhar (torres celular + Wi-Fi) — não prioridade agora.

API 3 — Directions API
  • Para quê: botão "Abrir no Maps" na rota do promotor
  • Na prática: abre com link direto:
    https://www.google.com/maps/dir/?api=1&destination=LAT,LNG
    Não precisa de chave para isso — funciona sem custo.

CUSTO (atualizado março 2025):
  • Crédito gratuito mensal: US$ 3.250/mês
  • Com 10 promotores fazendo check-in 1x/dia = ~300 req/mês
  • Conclusão: GRATUITO por muito tempo, possivelmente sempre
  • Faturamento precisa estar ativado no Google Cloud (cartão
    de crédito obrigatório, mas NÃO cobra dentro do limite)

CONFIGURAÇÃO — passo a passo:
  1. Acessar console.cloud.google.com
  2. Criar projeto: "box-agencia-app"
  3. Ativar: Maps JavaScript API + Directions API
  4. Gerar API Key
  5. Restringir a key ao domínio do app (SEGURANÇA OBRIGATÓRIA)
  6. Ativar faturamento (cartão, mas não cobra no limite gratuito)
  7. Adicionar no .env do projeto:
     VITE_GOOGLE_MAPS_KEY=sua_chave_aqui

USO NO CÓDIGO:
  Gestor — mapa com pins:
    import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps'
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}>
      <Map defaultCenter={{ lat: -20.3, lng: -40.3 }} defaultZoom={12}>
        {promotores.map(p => <Marker key={p.id} position={p.gps} />)}
      </Map>
    </APIProvider>

  Promotor — GPS ao vivo:
    navigator.geolocation.watchPosition(
      (pos) => atualizarGPSnoFirestore(pos.coords),
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 10000 }
    )

  Promotor — botão abrir Maps:
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    window.open(url, '_blank')

35. [MAPS] Integrar @vis.gl/react-google-maps no gestor/Dashboard
    → mapa com pin de cada promotor atualizado em tempo real
    → cor do pin = status (verde ativo / amarelo parado / vermelho sem sinal)
    → ao clicar no pin: nome do promotor, loja atual, hora do último registro

36. [MAPS] GPS watchPosition no promotor
    → atualizar campo gps:{lat,lng} no Firestore a cada 30 segundos
    → só enquanto o app estiver aberto (não precisa background por ora)

🔲 BACKLOG — depois do lançamento
────────────────────────────────────────
[ ] promotor — mix de produtos por loja/cliente
[ ] promotor — book de fotos completo (10 tipos de registro)
[ ] cliente/Dashboard — iOS premium com dados reais
[ ] integração API com outras plataformas de trade

🕐 ÚLTIMA SESSÃO
────────────────────────────────────────
Data: 30/05/2026
O que foi feito:
  - Revisão completa do estado do app
  - Reorganização da fila de prioridades para lançamento em 10 celulares
  - Pesquisa de mercado: funcionalidades padrão de trade/PDV
  - Definição completa do cadastro de marca com código de acesso do cliente
  - Banco de lojas da Grande Vitória pesquisado e documentado
  - Protótipo React do Modo Fluido criado (ModoFluido.jsx)
    com background geométrico animado + jornada completa do promotor
  - APIs do Google Maps pesquisadas e documentadas:
    Maps JavaScript API + Geolocation nativa + Directions
  - CONTEXTO.md atualizado com tudo
Onde parou: Nenhum código de produção gerado — apenas protótipo visual
Próximo passo: Iniciar pelo item 1 da fila (BUG 5 — lojaId no Firebase Console)
               Depois BUG 6, depois itens 3-6 (sincronização, login, voltar, câmera)
               Configurar Google Cloud Console e gerar API Key antes de integrar o mapa

📌 COMO ATUALIZAR ESTE ARQUIVO
────────────────────────────────────────
A IA deve atualizar este bloco a cada sessão:
- Mover itens concluídos para "CONCLUÍDO E CONGELADO"
- Remover bugs resolvidos de "BUGS CRÍTICOS"
- Atualizar "ÚLTIMA SESSÃO" com data, o que foi feito e próximo passo
- Nunca apagar itens do CONCLUÍDO — só adicionar
