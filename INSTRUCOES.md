# BOX AGÊNCIA APP — INSTRUÇÕES DE ATUALIZAÇÃO
Atualizado: 27/05/2026

---

## O QUE ESTÁ NESTE PACOTE

| Arquivo | O que faz |
|---|---|
| `index.html` | Meta tags PWA, iOS splash, viewport otimizado |
| `vite.config.js` | Build otimizado, chunks separados, acesso pelo celular local |
| `src/index.css` | CSS global: reset mobile, animações iOS, safe areas, anti-zoom |
| `src/App.css` | Limpo (o principal é o index.css) |
| `src/main.jsx` | Registra o Service Worker PWA |
| `public/manifest.json` | Configuração do app instalável |
| `public/sw.js` | Service Worker: cache offline + network-first Firebase |
| `public/logo.svg` | Logo oficial Box Agência (SVG vetorial) |
| `public/favicon.png` | Favicon 32x32 |
| `public/icons/` | Ícones PWA: 72, 96, 128, 144, 152, 192, 384, 512px + apple-touch |

---

## COMO APLICAR (passo a passo)

### 1. Copiar os arquivos para o projeto

No Windows Explorer, copie cada arquivo deste pacote para o lugar certo:

```
box-agencia-app/
├── index.html              ← substituir
├── vite.config.js          ← substituir
├── src/
│   ├── index.css           ← substituir
│   ├── App.css             ← substituir
│   └── main.jsx            ← substituir
└── public/
    ├── manifest.json       ← novo
    ├── sw.js               ← novo
    ├── logo.svg            ← novo
    ├── favicon.png         ← novo
    └── icons/              ← pasta nova com todos os PNGs
        ├── icon-72x72.png
        ├── icon-96x96.png
        ├── icon-128x128.png
        ├── icon-144x144.png
        ├── icon-152x152.png
        ├── icon-192x192.png
        ├── icon-384x384.png
        ├── icon-512x512.png
        └── apple-touch-icon.png
```

### 2. Testar no celular físico (HOJE)

```bash
# No terminal, na pasta box-agencia-app:
npm run dev -- --host

# Vai aparecer algo como:
# → Local:   http://localhost:5173/
# → Network: http://192.168.1.XX:5173/   ← esse IP
```

No celular Android/iOS conectado no mesmo Wi-Fi:
- Abre o Chrome e acessa `http://192.168.1.XX:5173`
- O app já vai funcionar igual ao desktop

---

## COMO INSTALAR COMO APP (PWA — SEM PLAY STORE)

### Android (Chrome):
1. Abrir o link da Vercel no Chrome
2. Menu (⋮) → "Adicionar à tela inicial"
3. Confirmar → aparece ícone Box Agência na tela
4. Abre sem barra de URL, como app nativo ✅

### iPhone (Safari):
1. Abrir o link no Safari (obrigatório, não Chrome)
2. Botão compartilhar → "Adicionar à tela de início"
3. Confirmar → aparece ícone na tela home ✅

---

## DEPLOY NA VERCEL (5 MINUTOS)

### Opção A — Via GitHub (recomendado):
1. Criar conta em github.com
2. Criar repositório "box-agencia-app"
3. Subir os arquivos (sem a pasta node_modules)
4. Criar conta em vercel.com
5. "Import Project" → selecionar o repositório GitHub
6. Configurações: Framework = Vite, Build = `npm run build`, Output = `dist`
7. Deploy → URL pública em ~2 minutos

### Opção B — Via Vercel CLI (direto do terminal):
```bash
npm install -g vercel
cd box-agencia-app
npm run build
vercel deploy dist
```

---

## OTIMIZAÇÕES APLICADAS EM TODOS OS CELULARES

### O que foi corrigido no index.css:

| Problema | Solução |
|---|---|
| Barra de endereço muda o tamanho da tela | `height: 100dvh` (dynamic viewport) |
| Flash branco ao carregar | `background: #010e2e` no HTML/body |
| Zoom automático em inputs | `font-size: max(16px, 1em)` |
| Highlight azul no tap Android | `-webkit-tap-highlight-color: transparent` |
| Autofill amarelo Chrome | `-webkit-box-shadow` inset override |
| Scroll com mola travando | `overscroll-behavior: none` + `WebkitOverflowScrolling: touch` |
| Botões sem feedback de pressão | `button:active { transform: scale(0.97) }` |
| Notch iPhone/punch-hole | `env(safe-area-inset-bottom/top)` |
| Select seta nativa feia | SVG personalizado via background-image |

### Animações iOS já definidas (usar nas telas):
- **Slide horizontal**: classes `.page-enter/exit` no react-transition-group
- **Modal bottom sheet**: classes `.modal-enter/exit`
- **Overlay fade**: classes `.overlay-enter/exit`

---

## PRÓXIMOS PASSOS DO APP

| Etapa | O que faz | Prioridade |
|---|---|---|
| Fotos before/after | `<input type="file" accept="image/*" capture="environment">` | 🔴 Alta |
| Notificações push | Firebase Cloud Messaging | 🟡 Média |
| Assinatura digital | Canvas touch no promotor | 🟡 Média |
| Mapa em tempo real | Google Maps API | 🟡 Média |
| APK Play Store | Capacitor + Android Studio (R$125 taxa única) | 🟢 Futuro |

---

## CREDENCIAIS (não compartilhar)

- Gestor: israel@boxagencia.com / Box@2026
- Firebase projeto: box-agencia-pt2
- Pasta local: C:\Users\PC\Desktop\box-agencia\box-agencia-app

---

*Box Agência — Sistema de Gestão de Campo — Grande Vitória/ES*
