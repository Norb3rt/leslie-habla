import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const root = process.cwd();
const wordsDir = path.join(root, 'public', 'images', 'words');
const audioEnDir = path.join(root, 'public', 'audio', 'en');
const audioEsDir = path.join(root, 'public', 'audio', 'es');

fs.mkdirSync(wordsDir, { recursive: true });
fs.mkdirSync(audioEnDir, { recursive: true });
fs.mkdirSync(audioEsDir, { recursive: true });

// Copy vocabulary.json to public/vocabulary.json for direct static inspection/caching
fs.copyFileSync(
  path.join(root, 'src', 'data', 'vocabulary.json'),
  path.join(root, 'public', 'vocabulary.json')
);

// 1. Rich, child-friendly, thick-outlined Montessori/AAC SVG illustrations for all 12 core words
const svgs = {
  'i-want': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
    <rect width="160" height="160" rx="32" fill="#FEF3C7"/>
    <circle cx="80" cy="48" r="24" fill="#FBBF24" stroke="#92400E" stroke-width="5"/>
    <path d="M80 14V20M80 76V82M46 48H52M108 48H114M56 24L61 29M99 67L104 72M104 24L99 29M61 67L56 72" stroke="#D97706" stroke-width="4.5" stroke-linecap="round"/>
    <polygon points="80,30 85,41 97,42 88,50 90,62 80,56 70,62 72,50 63,42 75,41" fill="#FFFBEB" stroke="#92400E" stroke-width="3" stroke-linejoin="round"/>
    <!-- Two open hands reaching warmly inward/upward -->
    <path d="M36 134C36 112 46 96 60 92C65 90 70 95 67 101L59 115H72C77 115 80 119 78 124C76 129 70 134 62 134H36Z" fill="#FDBA74" stroke="#7C2D12" stroke-width="5" stroke-linejoin="round"/>
    <path d="M124 134C124 112 114 96 100 92C95 90 90 95 93 101L101 115H88C83 115 80 119 82 124C84 129 90 134 98 134H124Z" fill="#FDBA74" stroke="#7C2D12" stroke-width="5" stroke-linejoin="round"/>
    <path d="M62 82L70 72M98 82L90 72" stroke="#D97706" stroke-width="4.5" stroke-linecap="round"/>
  </svg>`,

  'more': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
    <rect width="160" height="160" rx="32" fill="#E0F2FE"/>
    <!-- Base blocks -->
    <rect x="26" y="92" width="42" height="42" rx="10" fill="#38BDF8" stroke="#075985" stroke-width="5"/>
    <rect x="76" y="92" width="42" height="42" rx="10" fill="#38BDF8" stroke="#075985" stroke-width="5"/>
    <!-- New block being added on top with big plus sign -->
    <rect x="52" y="42" width="44" height="44" rx="10" fill="#FBBF24" stroke="#92400E" stroke-width="5"/>
    <path d="M74 53V75M63 64H85" stroke="#78350F" stroke-width="6" stroke-linecap="round"/>
    <!-- Big bold plus badge on right -->
    <circle cx="122" cy="52" r="20" fill="#0284C7" stroke="#0C4A6E" stroke-width="4.5"/>
    <path d="M122 42V62M112 52H132" stroke="#FFFFFF" stroke-width="5.5" stroke-linecap="round"/>
  </svg>`,

  'eat': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
    <rect width="160" height="160" rx="32" fill="#DCFCE7"/>
    <!-- Leaf and stem -->
    <path d="M76 44C76 32 84 24 94 24" stroke="#78350F" stroke-width="6" stroke-linecap="round"/>
    <path d="M78 38C64 26 50 32 54 44C60 48 70 46 78 38Z" fill="#22C55E" stroke="#14532D" stroke-width="4.5" stroke-linejoin="round"/>
    <!-- Crisp red apple -->
    <path d="M76 46C56 42 34 56 34 84C34 114 54 134 70 134C75 134 78 131 82 131C86 131 89 134 94 134C110 134 126 114 126 84C126 56 104 42 84 46C80 47 78 47 76 46Z" fill="#EF4444" stroke="#7F1D1D" stroke-width="5" stroke-linejoin="round"/>
    <!-- Friendly bite mark & shine -->
    <circle cx="124" cy="78" r="15" fill="#DCFCE7"/>
    <path d="M111 66C106 72 106 84 111 90" stroke="#7F1D1D" stroke-width="5" stroke-linecap="round"/>
    <path d="M50 68C46 76 46 88 50 96" stroke="#FCA5A5" stroke-width="5" stroke-linecap="round"/>
  </svg>`,

  'drink': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
    <rect width="160" height="160" rx="32" fill="#CCFBF1"/>
    <!-- Bent drinking straw -->
    <path d="M90 62L104 28L128 24" stroke="#F43F5E" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Tumbler cup -->
    <path d="M44 56H116L106 132C105 137 100 140 95 140H65C60 140 55 137 54 132L44 56Z" fill="#FFFFFF" stroke="#134E4A" stroke-width="5" stroke-linejoin="round"/>
    <!-- Refreshing blue water inside -->
    <path d="M48 82C60 76 72 86 84 82C96 78 104 82 112 80L105 131C104 134 101 136 96 136H64C59 136 56 134 55 131L48 82Z" fill="#38BDF8"/>
    <path d="M44 56H116L106 132C105 137 100 140 95 140H65C60 140 55 137 54 132L44 56Z" stroke="#134E4A" stroke-width="5" stroke-linejoin="round"/>
    <rect x="38" y="48" width="84" height="12" rx="6" fill="#2DD4BF" stroke="#134E4A" stroke-width="5"/>
  </svg>`,

  'yes': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
    <rect width="160" height="160" rx="32" fill="#D1FAE5"/>
    <circle cx="80" cy="80" r="54" fill="#10B981" stroke="#064E3B" stroke-width="5.5"/>
    <path d="M54 82L72 100L108 62" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'no': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
    <rect width="160" height="160" rx="32" fill="#FFE4E6"/>
    <circle cx="80" cy="80" r="54" fill="#F43F5E" stroke="#881337" stroke-width="5.5"/>
    <path d="M58 58L102 102M102 58L58 102" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/>
  </svg>`,

  'help': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
    <rect width="160" height="160" rx="32" fill="#EDE9FE"/>
    <!-- Life preserver / helping hands heart badge -->
    <circle cx="80" cy="80" r="52" fill="#FFFFFF" stroke="#4C1D95" stroke-width="5.5"/>
    <circle cx="80" cy="80" r="24" fill="#EDE9FE" stroke="#4C1D95" stroke-width="5"/>
    <!-- Red/violet rescue bands -->
    <path d="M58 34L68 58M92 58L102 34M126 58L102 68M102 92L126 102M102 126L92 102M68 102L58 126M34 102L58 92M58 68L34 58" stroke="#8B5CF6" stroke-width="10" stroke-linecap="round"/>
    <circle cx="80" cy="80" r="52" stroke="#4C1D95" stroke-width="5.5"/>
    <circle cx="80" cy="80" r="24" stroke="#4C1D95" stroke-width="5"/>
  </svg>`,

  'stop': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
    <rect width="160" height="160" rx="32" fill="#FFE4E6"/>
    <!-- Octagon stop sign -->
    <polygon points="58,24 102,24 136,58 136,102 102,136 58,136 24,102 24,58" fill="#EF4444" stroke="#7F1D1D" stroke-width="5.5" stroke-linejoin="round"/>
    <!-- Open raised hand inside -->
    <path d="M64 112C54 112 48 104 48 92V76C48 72 51 70 54 70C57 70 60 72 60 76V84V56C60 52 63 49 66 49C69 49 72 52 72 56V80V50C72 46 75 43 78 43C81 43 84 46 84 50V80V54C84 50 87 47 90 47C93 47 96 50 96 54V86L103 76C106 72 111 73 112 77C113 81 108 92 103 101C98 109 91 112 80 112H64Z" fill="#FFFFFF" stroke="#7F1D1D" stroke-width="4" stroke-linejoin="round"/>
  </svg>`,

  'go': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
    <rect width="160" height="160" rx="32" fill="#DCFCE7"/>
    <circle cx="80" cy="80" r="54" fill="#22C55E" stroke="#14532D" stroke-width="5.5"/>
    <path d="M48 80H106M84 54L112 80L84 106" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'play': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
    <rect width="160" height="160" rx="32" fill="#FFEDD5"/>
    <!-- Colorful beach/play ball -->
    <circle cx="80" cy="80" r="52" fill="#F97316" stroke="#7C2D12" stroke-width="5.5"/>
    <path d="M80 28C98 48 98 112 80 132" stroke="#7C2D12" stroke-width="5"/>
    <path d="M80 28C62 48 62 112 80 132" stroke="#7C2D12" stroke-width="5"/>
    <path d="M28 80C52 66 108 66 132 80" stroke="#7C2D12" stroke-width="5"/>
    <circle cx="80" cy="50" r="11" fill="#FDE047" stroke="#7C2D12" stroke-width="4.5"/>
  </svg>`,

  'finished': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
    <rect width="160" height="160" rx="32" fill="#E0F2FE"/>
    <!-- Flagpole -->
    <path d="M44 30V134" stroke="#0F172A" stroke-width="7" stroke-linecap="round"/>
    <circle cx="44" cy="28" r="6" fill="#F59E0B" stroke="#0F172A" stroke-width="4"/>
    <!-- Waving checkered finish flag -->
    <path d="M44 36H124V92H44V36Z" fill="#FFFFFF" stroke="#0F172A" stroke-width="5" stroke-linejoin="round"/>
    <rect x="44" y="36" width="26" height="28" fill="#0284C7"/>
    <rect x="96" y="36" width="28" height="28" fill="#0284C7"/>
    <rect x="70" y="64" width="26" height="28" fill="#0284C7"/>
    <path d="M44 36H124V92H44V36Z" stroke="#0F172A" stroke-width="5" stroke-linejoin="round"/>
    <!-- Sparkle stars -->
    <path d="M114 114L118 122L126 126L118 130L114 138L110 130L102 126L110 122L114 114Z" fill="#FBBF24" stroke="#92400E" stroke-width="3" stroke-linejoin="round"/>
  </svg>`,

  'please': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
    <rect width="160" height="160" rx="32" fill="#FEF3C7"/>
    <!-- Warm heart with gentle hands -->
    <path d="M80 126C80 126 32 96 32 62C32 45 45 34 60 34C70 34 76 40 80 47C84 40 90 34 100 34C115 34 128 45 128 62C128 96 80 126 80 126Z" fill="#F43F5E" stroke="#881337" stroke-width="5.5" stroke-linejoin="round"/>
    <path d="M52 54C47 58 45 64 46 70" stroke="#FDA4AF" stroke-width="5" stroke-linecap="round"/>
  </svg>`,
};

for (const [id, content] of Object.entries(svgs)) {
  fs.writeFileSync(path.join(wordsDir, `${id}.svg`), content.trim() + '\n');
}

// Brand SVG icon in public/icon.svg
const brandSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="112" fill="#F59E0B"/>
  <rect x="56" y="56" width="400" height="400" rx="84" fill="#FFFBEB" stroke="#78350F" stroke-width="16"/>
  <path d="M136 168C136 141.5 157.5 120 184 120H328C354.5 120 376 141.5 376 168V272C376 298.5 354.5 320 328 320H240L176 376V320H184C157.5 320 136 298.5 136 272V168Z" fill="#38BDF8" stroke="#0C4A6E" stroke-width="18" stroke-linejoin="round"/>
  <circle cx="212" cy="220" r="20" fill="#FFFFFF"/>
  <circle cx="256" cy="220" r="20" fill="#FFFFFF"/>
  <circle cx="300" cy="220" r="20" fill="#FFFFFF"/>
</svg>`;
fs.writeFileSync(path.join(root, 'public', 'icon.svg'), brandSvg.trim() + '\n');

// 2. Generate valid PNG files (180x180, 192x192, 512x512, maskable 512x512)
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createIconPng(size, isMaskable = false) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(size * (size * 4 + 1));
  const margin = isMaskable ? Math.floor(size * 0.16) : Math.floor(size * 0.08);
  const innerMin = margin;
  const innerMax = size - margin;

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter type 0
    for (let x = 0; x < size; x++) {
      const idx = rowStart + 1 + x * 4;
      // Warm amber outer background (#F59E0B)
      let r = 245, g = 158, b = 11, a = 255;
      if (x >= innerMin && x < innerMax && y >= innerMin && y < innerMax) {
        // Cream inner card (#FFFBEB)
        r = 255; g = 251; b = 235;
        // Center speech bubble emblem (#0284C7)
        const cx = size / 2;
        const cy = size / 2;
        const dist = Math.hypot(x - cx, y - cy);
        if (dist < size * 0.24) {
          r = 2; g = 132; b = 199;
        }
      }
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
      raw[idx + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

fs.writeFileSync(path.join(root, 'public', 'apple-touch-icon.png'), createIconPng(180, false));
fs.writeFileSync(path.join(root, 'public', 'pwa-192x192.png'), createIconPng(192, false));
fs.writeFileSync(path.join(root, 'public', 'pwa-512x512.png'), createIconPng(512, false));
fs.writeFileSync(path.join(root, 'public', 'pwa-maskable-512x512.png'), createIconPng(512, true));

// 3. Generate pleasant marimba/chime .wav files for each word in /public/audio/en and /public/audio/es
function createChimeWav(freq1, freq2, durationSec = 0.28) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM
  buffer.writeUInt16LE(1, 20);  // Mono
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const f = t < durationSec * 0.5 ? freq1 : freq2;
    const env = Math.exp(-t * 10) * Math.sin(Math.min(1, t * 80) * (Math.PI / 2));
    const sample = Math.sin(2 * Math.PI * f * t) * env * 0.35;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }
  return buffer;
}

const wordNotes = {
  'i-want': [523.25, 659.25],
  'more': [587.33, 698.46],
  'eat': [659.25, 783.99],
  'drink': [698.46, 880.0],
  'yes': [523.25, 783.99],
  'no': [440.0, 349.23],
  'help': [587.33, 880.0],
  'stop': [392.0, 329.63],
  'go': [523.25, 1046.5],
  'play': [659.25, 987.77],
  'finished': [783.99, 523.25],
  'please': [659.25, 880.0],
};

for (const [id, [f1, f2]] of Object.entries(wordNotes)) {
  fs.writeFileSync(path.join(audioEnDir, `${id}.wav`), createChimeWav(f1, f2));
  fs.writeFileSync(path.join(audioEsDir, `${id}.wav`), createChimeWav(f1 * 1.05, f2 * 1.05));
}

console.log('Generated all 12 word SVGs, 24 audio WAVs, and 5 PWA icon assets successfully.');
