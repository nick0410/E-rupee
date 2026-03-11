"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef } from "react";

interface ERupeeQRProps {
  value: string;
  size?: number;
}

/**
 * Styled e₹ QR code matching the branded design:
 * - Dark navy background with dot-style (circle) modules
 * - Blue radial gradient circle overlay in the center
 * - White "e₹" logo rendered on top
 * - Fully scannable QR code (high error correction)
 */
export default function ERupeeQR({ value, size = 280 }: ERupeeQRProps) {
  const hiddenRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!value) return;

    // Wait for the hidden QRCodeCanvas to render
    const timeout = setTimeout(() => {
      const srcCanvas = hiddenRef.current?.querySelector("canvas");
      const destCanvas = canvasRef.current;
      if (!srcCanvas || !destCanvas) return;

      const ctx = destCanvas.getContext("2d");
      if (!ctx) return;

      const s = size;
      destCanvas.width = s;
      destCanvas.height = s;

      // Read QR module data from the hidden canvas
      const srcCtx = srcCanvas.getContext("2d");
      if (!srcCtx) return;

      const qrSize = srcCanvas.width;
      const imageData = srcCtx.getImageData(0, 0, qrSize, qrSize);

      // Detect module count by scanning the top row for transitions
      const moduleCount = detectModuleCount(imageData, qrSize);
      const cellSrc = qrSize / moduleCount;
      const cellDest = s / moduleCount;
      const dotRadius = cellDest * 0.38;

      // Dark navy background
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, s, s);

      // Draw QR modules as circles
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          const sx = Math.floor(col * cellSrc + cellSrc / 2);
          const sy = Math.floor(row * cellSrc + cellSrc / 2);
          const pixelIdx = (sy * qrSize + sx) * 4;
          const isDark = imageData.data[pixelIdx] < 128;

          const cx = col * cellDest + cellDest / 2;
          const cy = row * cellDest + cellDest / 2;

          // Skip dots inside the center logo area
          const distFromCenter = Math.sqrt(
            (cx - s / 2) ** 2 + (cy - s / 2) ** 2
          );
          if (distFromCenter < s * 0.18) continue;

          ctx.beginPath();
          ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? "#ffffff" : "#1e293b";
          ctx.fill();
        }
      }

      // Draw finder patterns (corner squares) properly
      drawFinderPattern(ctx, cellDest, 0, 0); // Top-left
      drawFinderPattern(ctx, cellDest, (moduleCount - 7) * cellDest, 0); // Top-right
      drawFinderPattern(ctx, cellDest, 0, (moduleCount - 7) * cellDest); // Bottom-left

      // Blue radial gradient circle in center
      const centerX = s / 2;
      const centerY = s / 2;
      const logoRadius = s * 0.2;

      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, logoRadius
      );
      gradient.addColorStop(0, "#4F8FFF");
      gradient.addColorStop(1, "#2563eb");

      ctx.beginPath();
      ctx.arc(centerX, centerY, logoRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // White "e₹" text
      const fontSize = logoRadius * 0.72;
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("e₹", centerX, centerY + 1);
    }, 100);

    return () => clearTimeout(timeout);
  }, [value, size]);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* Hidden QR canvas for reading raw module data */}
      <div ref={hiddenRef} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}>
        <QRCodeCanvas
          value={value || "erupee://"}
          size={256}
          level="H" /* High error correction — tolerates center logo */
          includeMargin={false}
        />
      </div>
      {/* Visible styled canvas */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: 16 }}
      />
    </div>
  );
}

/** Detect the QR module grid size from rendered pixel data */
function detectModuleCount(imageData: ImageData, canvasSize: number): number {
  // Scan the first row to count transitions from dark-to-light
  let transitions = 0;
  let wasDark = imageData.data[0] < 128;
  for (let x = 1; x < canvasSize; x++) {
    const dark = imageData.data[x * 4] < 128;
    if (dark !== wasDark) {
      transitions++;
      wasDark = dark;
    }
  }
  // Module count = transitions / 2 (each module boundary = 2 transitions for dark→light→dark)
  // QR version 1 = 21, version 2 = 25 ... version N = 17 + 4*N
  // Pick the closest valid QR size
  const raw = Math.round(transitions / 2);
  const validSizes = [];
  for (let v = 1; v <= 40; v++) validSizes.push(17 + v * 4);
  let best = 21;
  let bestDiff = Infinity;
  for (const vs of validSizes) {
    const d = Math.abs(vs - raw);
    if (d < bestDiff) {
      bestDiff = d;
      best = vs;
    }
  }
  return best;
}

/** Draw a styled finder pattern (corner marker) at position */
function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  cell: number,
  x: number,
  y: number
) {
  const pad = cell * 0.15;

  // Outer black square
  ctx.fillStyle = "#000000";
  roundRect(ctx, x + pad, y + pad, 7 * cell - pad * 2, 7 * cell - pad * 2, cell * 0.4);
  ctx.fill();

  // White inner square
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x + cell + pad, y + cell + pad, 5 * cell - pad * 2, 5 * cell - pad * 2, cell * 0.3);
  ctx.fill();

  // Black center square
  ctx.fillStyle = "#000000";
  roundRect(ctx, x + 2 * cell + pad, y + 2 * cell + pad, 3 * cell - pad * 2, 3 * cell - pad * 2, cell * 0.2);
  ctx.fill();
}

/** Helper: draw rounded rectangle path */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
