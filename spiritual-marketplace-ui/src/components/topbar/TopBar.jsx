import React from "react";

export default function TopBar() {
  return (
    <>
      <div className="asb-topbar" role="banner" aria-label="ASB Top Bar">
        <div className="asb-topbar__inner">
          {/* Left icons */}
          <div className="asb-topbar__icons" aria-hidden="true">
            <span className="asb-ico" title="Crystal">🔮</span>
            <span className="asb-ico" title="Chakra">🪷</span>
          </div>

          {/* Text */}
          <div className="asb-topbar__text">
            <span className="asb-topbar__slogan">
              Your Numbers Speak, Your Life Has Patterns — Discover What’s Meant for You.
            </span>
          </div>

          {/* Right icons */}
          <div className="asb-topbar__icons" aria-hidden="true">
            <span className="asb-ico" title="Infinity">∞</span>
            <span className="asb-ico" title="Energy">✨</span>
          </div>
        </div>
      </div>

      <style>{`
        :root{
          /* ✅ Matched from your screenshot */
          --asb-btn-start: #C24DFF;  /* bright purple */
          --asb-btn-end:   #8657FF;  /* soft purple */

          --asb-text-deep: #24002f;
          --asb-white: #ffffff;
        }

        /* ✅ Sticky always visible */
        .asb-topbar{
          position: sticky;
          top: 0;
          z-index: 9999;
          width: 100%;
          overflow: hidden;

          background: linear-gradient(90deg, var(--asb-btn-start), var(--asb-btn-end));
          border-bottom: 1px solid rgba(255,255,255,0.55);
          box-shadow: 0 6px 20px rgba(134, 87, 255, 0.25);
        }

        .asb-topbar__inner{
          position: relative;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
        }

        /* 🌌 Galaxy / crystal texture overlay (no image needed) */
        .asb-topbar::before{
          content:"";
          position:absolute;
          inset:0;
          background:
            radial-gradient(circle at 12% 45%, rgba(255,255,255,0.60) 0 1px, transparent 2px),
            radial-gradient(circle at 28% 20%, rgba(255,255,255,0.35) 0 1px, transparent 2px),
            radial-gradient(circle at 55% 70%, rgba(255,255,255,0.40) 0 1px, transparent 2px),
            radial-gradient(circle at 82% 35%, rgba(255,255,255,0.30) 0 1px, transparent 2px),
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.14), transparent 55%),
            linear-gradient(120deg, rgba(255,255,255,0.16), rgba(255,255,255,0.03), rgba(255,255,255,0.10));
          opacity: 0.55;
          pointer-events:none;
          mix-blend-mode: soft-light;
        }

        /* ✨ Soft shimmer animation */
        .asb-topbar::after{
          content:"";
          position:absolute;
          top:-40%;
          left:-70%;
          width:70%;
          height:220%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transform: rotate(18deg);
          animation: asbShimmer 5.5s ease-in-out infinite;
          pointer-events:none;
          opacity:0.85;
          filter: blur(0.4px);
        }

        @keyframes asbShimmer{
          0%   { left:-80%; opacity:0; }
          12%  { opacity:0.9; }
          55%  { left:110%; opacity:0.7; }
          75%  { opacity:0.25; }
          100% { left:130%; opacity:0; }
        }

        .asb-topbar__icons{
          display:flex;
          align-items:center;
          gap:10px;
          white-space:nowrap;
        }

        .asb-ico{
          font-size:16px;
          line-height:1;
          color: rgba(255,255,255,0.95);
          text-shadow: 0 2px 14px rgba(0,0,0,0.18);
          user-select:none;
          transform: translateY(0);
          transition: transform 180ms ease, opacity 180ms ease;
          opacity: 0.95;
        }

        .asb-topbar:hover .asb-ico{
          transform: translateY(-1px);
          opacity: 1;
        }

        .asb-topbar__text{
          display:flex;
          justify-content:center;
          align-items:center;
          min-width:0;
          text-align:center;
        }

        .asb-topbar__slogan{
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.35px;
          color: rgba(255,255,255,0.98);
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
          text-shadow: 0 2px 16px rgba(0,0,0,0.18);
        }

        /* ✅ mobile */
        @media (max-width: 520px){
          .asb-topbar__inner{
            grid-template-columns: 1fr;
            gap:6px;
            padding: 10px 12px;
          }
          .asb-topbar__icons{ justify-content:center; }
          .asb-topbar__slogan{
            white-space: normal;
            line-height: 1.15;
          }
        }
      `}</style>
    </>
  );
}
