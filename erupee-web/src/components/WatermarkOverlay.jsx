"use client";

import React, { useEffect } from "react";
import { initPrivacyProtection } from "@/utils/privacyProtection";

/**
 * Watermark Overlay Component
 * Displays non-clickable fixed watermark "E-Rupee Secure" across the page
 * Similar to fintech dashboard security indicators
 */
export default function WatermarkOverlay() {
  useEffect(() => {
    initPrivacyProtection();
  }, []);

  return (
    <>
      <style>{`
        .watermark-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          z-index: 50;
        }

        .watermark-text {
          position: absolute;
          font-size: 120px;
          font-weight: bold;
          color: rgba(59, 130, 246, 0.08);
          white-space: nowrap;
          transform: rotate(-45deg);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          letter-spacing: 4px;
        }

        @media (max-width: 1024px) {
          .watermark-text {
            font-size: 80px;
          }
        }

        @media (max-width: 640px) {
          .watermark-text {
            font-size: 50px;
          }
        }
      `}</style>

      <div className="watermark-overlay">
        <div
          className="watermark-text"
          style={{
            top: "10%",
            left: "-10%",
          }}
        >
          E-Rupee Secure
        </div>
        <div
          className="watermark-text"
          style={{
            top: "50%",
            left: "20%",
          }}
        >
          E-Rupee Secure
        </div>
        <div
          className="watermark-text"
          style={{
            top: "80%",
            left: "50%",
          }}
        >
          E-Rupee Secure
        </div>
      </div>
    </>
  );
}
