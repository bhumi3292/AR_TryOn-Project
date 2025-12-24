import React from "react";
// Assuming Navbar is the new modified component (from the previous step)
import Navbar from "../components/Navbar";
// Assuming Button is a custom functional component that accepts className
import { Button } from "../components/Button";
import { navigate } from "../router/router";

export default function Landing() {
  const UNITY_URL =
    import.meta.env.VITE_UNITY_FRONTEND_URL || "http://localhost:3000";

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Light Golden Shimmer Background */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(212,175,55,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer-slow"></div>
      </div>

      {/* Floating Particles (Optional, adds to shimmer effect) */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />

      {/* Content */}
      <div className="relative z-10">
        <Navbar />

        <main className="container mx-auto px-4 pt-32 pb-20 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center max-w-4xl mx-auto space-y-10">
            {/* Badge */}
            <div className="inline-block animate-fadeIn">
              <span className="text-[var(--gold-light)] text-xs md:text-sm tracking-[0.3em] uppercase border border-[var(--gold-primary)] px-8 py-3 rounded-full backdrop-blur-md bg-[var(--gold-dim)] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                Experience Luxury
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif text-white leading-[1.1] text-balance drop-shadow-2xl">
              Adorn Yourself
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--gold-soft)] via-[var(--gold-light)] to-[var(--gold-primary)] animate-pulse-slow mt-4 italic">
                Virtually
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-2xl text-[var(--gold-light)]/80 max-w-2xl mx-auto leading-relaxed font-light">
              Experience the future of jewelry shopping with our cutting-edge AR
              technology. Try on exquisite pieces from the comfort of your home.
            </p>

            {/* CTA Button - Tempting Highlight */}
            <div className="pt-12 relative group">
              {/* Glow Effect behind button */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[var(--gold-primary)] blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>

              <Button
                size="lg"
                onClick={() => navigate("/tryon")}
                className="relative z-10 bg-gradient-to-r from-[var(--gold-soft)] to-[var(--gold-primary)] text-black font-extrabold text-lg md:text-xl px-16 py-6 rounded-full shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] hover:scale-105 transition-all duration-300 border border-[var(--gold-light)]"
              >
                <span className="flex items-center gap-4 tracking-widest uppercase">
                  Try On Now
                  <svg
                    className="w-6 h-6 transition-transform group-hover:translate-x-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-24 max-w-4xl mx-auto">
              {/* Feature 1 */}
              <div className="text-center space-y-4 group cursor-pointer">
                <div className="w-16 h-16 mx-auto rounded-full border border-[var(--gold-dim)] flex items-center justify-center bg-black/50 group-hover:bg-[var(--gold-dim)] transition-colors duration-300">
                  <svg className="w-8 h-8 text-[var(--gold-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-[var(--gold-light)] font-serif text-xl">Real-Time AR</h3>
              </div>

              {/* Feature 2 */}
              <div className="text-center space-y-4 group cursor-pointer">
                <div className="w-16 h-16 mx-auto rounded-full border border-[var(--gold-dim)] flex items-center justify-center bg-black/50 group-hover:bg-[var(--gold-dim)] transition-colors duration-300">
                  <svg className="w-8 h-8 text-[var(--gold-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-[var(--gold-light)] font-serif text-xl">Luxury Collection</h3>
              </div>

              {/* Feature 3 */}
              <div className="text-center space-y-4 group cursor-pointer">
                <div className="w-16 h-16 mx-auto rounded-full border border-[var(--gold-dim)] flex items-center justify-center bg-black/50 group-hover:bg-[var(--gold-dim)] transition-colors duration-300">
                  <svg className="w-8 h-8 text-[var(--gold-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-[var(--gold-light)] font-serif text-xl">Capture & Share</h3>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
