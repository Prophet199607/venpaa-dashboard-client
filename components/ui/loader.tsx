'use client';

import React from "react";

type Props = {
  size?: number;
  speed?: number;
  label?: string;
};

export default function Loader({
  size = 72,
  speed = 1.6,
  label = "Loading",
}: Props) {
  const pageThickness = Math.max(2, Math.round(size * 0.03));

  return (
    <div className="spinner-container">
      <div
        className="book"
        role="status"
        aria-live="polite"
        aria-label={label}
        style={{
          ["--size" as any]: `${size}px`,
          ["--speed" as any]: `${speed}s`,
          ["--thickness" as any]: `${pageThickness}px`,
        }}
      >
        <div className="cover cover-left" />
        <div className="page page-1" />
        <div className="page page-2" />
        <div className="page page-3" />
        <div className="cover cover-right" />
        <span className="sr-only">{label}…</span>
      </div>

      <style jsx global>{`
        .spinner-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px); /* For Safari */
          z-index: 9999;
        }
        .book {
          width: var(--size);
          height: calc(var(--size) * 0.75);
          position: relative;
          perspective: 800px;
          display: inline-block;
        }
        .cover,
        .page {
          position: absolute;
          top: 0;
          bottom: 0;
          width: calc(var(--size) * 0.5);
          transform-origin: left center;
          border-radius: 6px 0 0 6px;
          box-sizing: border-box;
        }
        .cover-left {
          left: 0;
          background: #111;
          box-shadow: inset -4px 0 0 #222, 0 8px 18px rgba(0, 0, 0, 0.25);
        }
        .cover-right {
          right: 0;
          left: auto;
          border-radius: 0 6px 6px 0;
          background: #1a1a1a;
          box-shadow: inset 4px 0 0 #222, 0 8px 18px rgba(0, 0, 0, 0.25);
        }
        .page {
          left: calc(var(--size) * 0.5 - var(--thickness));
          width: calc(var(--size) * 0.5 + var(--thickness));
          background: linear-gradient(90deg, #fafafa, #f2f2f2);
          border-left: var(--thickness) solid #e0e0e0;
          border-radius: 0 6px 6px 0;
          transform-origin: left center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          animation: turn var(--speed) linear infinite;
        }
        .page-1 {
          animation-delay: 0s;
        }
        .page-2 {
          animation-delay: calc(var(--speed) / 3);
          filter: brightness(0.98);
        }
        .page-3 {
          animation-delay: calc((var(--speed) / 3) * 2);
          filter: brightness(0.96);
        }
        @keyframes turn {
          0% {
            transform: rotateY(0deg);
            z-index: 2;
          }
          40% {
            transform: rotateY(-160deg);
            z-index: 3;
          }
          50% {
            transform: rotateY(-180deg);
            z-index: 0;
          }
          60% {
            transform: rotateY(-200deg);
            z-index: 0;
          }
          100% {
            transform: rotateY(-360deg);
            z-index: 0;
          }
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}
