'use client';
import React from 'react';


type Props = {
  size?: number;       
  speed?: number;       
  coverColor?: string;  
  label?: string;
};


function OpenBookLoader({
  size = 36,
  speed = 2.2,
  coverColor = '#f59e0b',
  label = 'Moda chuti',
}: Props) {
  const height = Math.round(size * 0.3);
  const width = Math.round(size * 0.6);
  const pageDepth = Math.max(8, Math.round(size * 0.03));
  const coverThick = Math.max(6, Math.round(size * 0.02));
  const spineGap = Math.max(2, Math.round(size * 0.005));

  return (
    <div
      className="scene"
      role="status"
      aria-live="polite"
      aria-label={label}
      style={
        {
          ['--size' as any]: `${size}px`,
          ['--width' as any]: `${width}px`,
          ['--height' as any]: `${height}px`,
          ['--pageDepth' as any]: `${pageDepth}px`,
          ['--coverThick' as any]: `${coverThick}px`,
          ['--spineGap' as any]: `${spineGap}px`,
          ['--speed' as any]: `${speed}s`,
          ['--cover' as any]: coverColor,
        } as React.CSSProperties
      }
    >
      <div className="book">
        <div className="cover left" />
        <div className="cover right" />

        <div className="stack left" />
        <div className="stack right" />

        {/* Flipping leaf. Stays above stacks */}
        <div className="leaf">
          <div className="paper front" />
          <div className="paper back" />
        </div>

        {/* Optional thin stationary sheets for thickness */}
        <div className="sheet s1 left" />
        <div className="sheet s2 left" />
        <div className="sheet s1 right" />
        <div className="sheet s2 right" />
      </div>

      <style jsx>{`
        .scene {
          width: calc(var(--size) + 20px);
          height: calc(var(--height) + 40px);
          perspective: 1300px;
          display: inline-grid;
          place-items: center;
          filter: drop-shadow(0 24px 34px rgba(0, 0, 0, 0.24));
        }
        .book {
          position: relative;
          width: var(--width);
          height: var(--height);
          transform-style: preserve-3d;
          /* stronger horizontal angle as requested */
          transform: rotateX(12deg) rotateY(28deg);
          animation: wobble calc(var(--speed) * 3) ease-in-out infinite;
          overflow: visible;
        }
        @keyframes wobble {
          0%,
          100% {
            transform: rotateX(12deg) rotateY(28deg);
          }
          50% {
            transform: rotateX(10deg) rotateY(26deg);
          }
        }

        /* COVERS */
        .cover {
          position: absolute;
          top: 0;
          width: calc(50% - var(--spineGap));
          height: 100%;
          background: linear-gradient(200deg, var(--cover), #d97706);
          border-radius: 10px;
          box-shadow: inset 0 -8px 100px rgba(0, 0, 0, 0.1);
          transform: translateZ(-2px);
        }
        .cover.left {
          left: 0;
        }
        .cover.right {
          right: 0;
        }

        /* PAGE STACKS */
        .stack {
          position: absolute;
          top: 0;
          width: calc(50% - var(--spineGap));
          height: 100%;
          background: linear-gradient(90deg, #fbfbfb, #f3f3f3);
          border-radius: 10px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);
          overflow: hidden;
        }
        .stack.left {
          left: 0;
        }
        .stack.right {
          right: 0;
        }

        .stack.left::after,
        .stack.right::after {
          content: '';
          position: absolute;
          top: 0;
          width: var(--pageDepth);
          height: 100%;
          background: linear-gradient(180deg, #e5e5e5, #f1f1f1);
        }
        .stack.left::after {
          right: 0;
          border-radius: 0 10px 10px 0;
        }
        .stack.right::after {
          left: 0;
          border-radius: 10px 0 0 10px;
        }

        .sheet {
          position: absolute;
          top: 2%;
          width: calc(50% - var(--spineGap));
          height: 96%;
          background: #ffffff;
          border-radius: 10px;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        }
        .sheet.left {
          left: 0;
        }
        .sheet.right {
          right: 0;
        }
        .sheet.s1 {
          transform: translateZ(1px);
        }
        .sheet.s2 {
          transform: translateZ(2px);
        }

        /* THE LEAF: limited flip, never dips below stacks */
        .leaf {
          position: absolute;
          left: calc(50% - var(--spineGap));
          top: 0;
          width: calc(50% - var(--spineGap));
          height: 100%;
          transform-origin: left center;
          transform-style: preserve-3d;
          /* keep above */
          transform: translateZ(3px);
          animation: flip var(--speed) ease-in-out infinite alternate;
          /* hide page underside */
          backface-visibility: hidden;
        }

        @keyframes flip {
          0% {
            transform: translateZ(3px) rotateY(0deg) skewY(0deg);
          }
          45% {
            transform: translateZ(3px) rotateY(-160deg) skewY(-0.8deg);
          }
          55% {
            transform: translateZ(3px) rotateY(-160deg) skewY(-0.8deg);
          }
          100% {
            transform: translateZ(3px) rotateY(0deg) skewY(0deg);
          }
        }

        .paper {
          position: absolute;
          inset: 0;
          background: #ffffff;
          border-radius: 10px;
          backface-visibility: hidden;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.14);
        }
        .paper.front {
          background: radial-gradient(
              90% 100% at 0% 50%,
              rgba(0, 0, 0, 0.1),
              transparent 60%
            ),
            linear-gradient(90deg, #ffffff, #f7f7f7);
        }
        .paper.back {
          transform: rotateY(180deg);
          background: radial-gradient(
              90% 100% at 100% 50%,
              rgba(0, 0, 0, 0.1),
              transparent 60%
            ),
            linear-gradient(90deg, #ffffff, #f7f7f7);
        }

        /* table shadow */
        :global(.scene)::after {
          content: '';
          position: absolute;
          width: 72%;
          height: 18%;
          bottom: -6%;
          left: 14%;
          background: radial-gradient(
            50% 50% at 50% 50%,
            rgba(0, 0, 0, 0.26),
            transparent 70%
          );
          filter: blur(5px);
        }
      `}</style>
      <span className="sr-only">{label}…</span>
    </div>
  );
}

/* ============== Demo Page (default export) ============== */
export default function Loader() {
  return (
    <div
      style={{
        position: 'fixed',   
        inset: 0,            
        display: 'grid',     
        placeItems: 'center',
        background: 'transparent',
        zIndex: 9999,        
      }}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <OpenBookLoader size={240} speed={2.4} coverColor="#f59e0b" />
    </div>
  );
}

