import fs from 'fs';
import zlib from 'zlib';

function makePng(width, height, drawFn) {
  const rowLen = 1 + width * 4;
  const rawData = Buffer.alloc(rowLen * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }
  const idatData = zlib.deflateSync(rawData);

  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c;
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idatData), chunk('IEND', Buffer.alloc(0))]);
}

// Distance to rounded rectangle
function distRoundRect(x, y, rx, ry, rw, rh, r) {
  const dx = Math.max(Math.abs(x - (rx + rw / 2)) - rw / 2 + r, 0);
  const dy = Math.max(Math.abs(y - (ry + rh / 2)) - rh / 2 + r, 0);
  return Math.hypot(dx, dy) - r;
}

// Distance to line segment
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function drawCheckIcon(x, y, w, h, maskable = false) {
  const cornerR = maskable ? 0 : w * 0.22;
  const pad = maskable ? 0 : w * 0.04;
  const rectW = w - pad * 2;
  const rectH = h - pad * 2;

  if (!maskable) {
    const d = distRoundRect(x, y, pad, pad, rectW, rectH, cornerR);
    if (d > 0) return [0, 0, 0, 0];
  }

  // Brand blue background gradient: #2563eb to #1e40af
  const t = (x + y * 1.2) / (w + h * 1.2);
  let bgR = Math.round(37 * (1 - t) + 30 * t);
  let bgG = Math.round(99 * (1 - t) + 64 * t);
  let bgB = Math.round(235 * (1 - t) + 175 * t);

  // Checkmark in center
  // Coordinates for a bold checkmark
  const scale = w / 512;
  const cx = w * 0.48;
  const cy = h * 0.50;

  // Checkmark stroke 1: left down
  // from cx - 90*scale, cy to cx - 20*scale, cy + 70*scale
  const d1 = distToSegment(x, y, cx - 80 * scale, cy + 10 * scale, cx - 20 * scale, cy + 70 * scale);
  // Checkmark stroke 2: up right
  // from cx - 20*scale, cy + 70*scale to cx + 90*scale, cy - 60*scale
  const d2 = distToSegment(x, y, cx - 20 * scale, cy + 70 * scale, cx + 90 * scale, cy - 60 * scale);
  
  const checkDist = Math.min(d1, d2);
  const strokeW = 28 * scale;

  if (checkDist < strokeW) {
    const aa = Math.max(0, Math.min(1, strokeW - checkDist));
    const whiteR = 255, whiteG = 255, whiteB = 255;
    return [
      Math.round(bgR * (1 - aa) + whiteR * aa),
      Math.round(bgG * (1 - aa) + whiteG * aa),
      Math.round(bgB * (1 - aa) + whiteB * aa),
      255
    ];
  }

  return [bgR, bgG, bgB, 255];
}

// Generate files
fs.writeFileSync('public/pwa-192x192.png', makePng(192, 192, (x, y, w, h) => drawCheckIcon(x, y, w, h, false)));
fs.writeFileSync('public/pwa-512x512.png', makePng(512, 512, (x, y, w, h) => drawCheckIcon(x, y, w, h, false)));
fs.writeFileSync('public/pwa-maskable-512x512.png', makePng(512, 512, (x, y, w, h) => drawCheckIcon(x, y, w, h, true)));
fs.writeFileSync('public/apple-touch-icon.png', makePng(180, 180, (x, y, w, h) => drawCheckIcon(x, y, w, h, false)));

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1e40af" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#blueGrad)" />
  <path d="M160 265 L225 330 L360 185" fill="none" stroke="#ffffff" stroke-width="56" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

fs.writeFileSync('public/icon.svg', svgIcon);
fs.writeFileSync('public/favicon.svg', svgIcon);

console.log('All icons generated successfully!');
