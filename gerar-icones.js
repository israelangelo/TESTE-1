const sharp = require('sharp');
const fs = require('fs');

const svg = fs.readFileSync('./public/logo-box.svg');

const tamanhos = [
  { nome: 'favicon-16x16.png', size: 16 },
  { nome: 'favicon-32x32.png', size: 32 },
  { nome: 'apple-touch-icon.png', size: 180 },
  { nome: 'pwa-192x192.png', size: 192 },
  { nome: 'pwa-512x512.png', size: 512 },
];

async function gerar() {
  for (const t of tamanhos) {
    await sharp(svg)
      .resize(t.size, t.size)
      .png()
      .toFile(`./public/${t.nome}`);
    console.log(`✅ ${t.nome}`);
  }
  console.log('🎉 Todos os ícones gerados!');
}

gerar();