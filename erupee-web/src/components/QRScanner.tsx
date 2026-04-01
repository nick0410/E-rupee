"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create the scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true
      },
      false
    );
    
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Run onScan and pause scanning
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
        onScan(decodedText);
      },
      (err) => {
        // Ignore noise, but can log errors here if needed
        console.log("QR err", err);
      }
    );

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden relative shadow-2xl animate-scale-in">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-white font-semibold">Scan QR Code</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 pb-0 bg-black">
          <div id="qr-reader" className="w-full rounded-xl overflow-hidden border-2 border-dashed border-blue-500/50"></div>
          {error && <p className="text-red-400 text-xs text-center mt-3">{error}</p>}
        </div>
        
        <div className="p-4 text-center">
          <p className="text-slate-400 text-sm">Align QR code within the frame to scan</p>
        </div>
      </div>
    </div>
  );
}
