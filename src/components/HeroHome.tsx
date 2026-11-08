import React, { useState, useEffect } from 'react';
import {
  ArrowRight, Zap, Film, Download, BarChart3, Layers, Globe2
} from 'lucide-react';
import { TerminalBootAnimation } from './TerminalBootAnimation';
import { useGlobalScrollFadeIn } from '../utils/useScrollFadeIn';
import { PLATFORM_LIST } from '../data/apiEndpoints';

interface HeroHomeProps {
  onGoToDocs: (endpointId?: string) => void;
}

export const HeroHome: React.FC<HeroHomeProps> = ({ onGoToDocs }) => {
  useGlobalScrollFadeIn();

  // Ultra-smooth, soft human-like typing animation:
  // Starts with "HI, ", softly types "DEV", pauses comfortably,
  // softly backspaces back to "HI, ", pauses, then softly types "IM LIRENXIN", and repeats.
  const [typedSuffix, setTypedSuffix] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const suffixes = ['DEV', 'IM LIRENXIN'];

  useEffect(() => {
    const currentWord = suffixes[phraseIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (typedSuffix.length < currentWord.length) {
        const nextChar = currentWord[typedSuffix.length];
        const delay = nextChar === ' ' ? 160 : 95 + Math.sin(typedSuffix.length) * 20;

        timer = setTimeout(() => {
          setTypedSuffix(currentWord.slice(0, typedSuffix.length + 1));
        }, delay);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      if (typedSuffix.length > 0) {
        timer = setTimeout(() => {
          setTypedSuffix(currentWord.slice(0, typedSuffix.length - 1));
        }, 55);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % suffixes.length);
        }, 650);
      }
    }

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedSuffix, isDeleting, phraseIndex]);

  return (
    <div className="w-full">

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

          {/* Left Column: Typing Headline & Action Buttons */}
          <div className="lg:col-span-6 space-y-6">

            {/* Dot confetti ala panel komponen neo-brutal */}
            <div className="flex items-center gap-2 pb-1" aria-hidden="true">
              {['#FF5D5D', '#A78BFA', '#3ECFC0', '#FFD93D', '#FFB3C7', '#7AB8F5'].map((c) => (
                <span key={c} className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-black dark:border-[#171420] transition-colors" style={{ backgroundColor: c }} />
              ))}
              <span className="w-2.5 h-2.5 rotate-45 border-2 border-black dark:border-[#171420] bg-[#FFD93D] ml-1" />
            </div>

            {/* Headline with Soft Live Typing Animation */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-black dark:text-white min-h-[90px] sm:min-h-[140px] flex flex-wrap items-center">
              <span>HI,&nbsp;</span>
              <span className="text-[#FF5D5D] dark:text-[#FFE600] inline-flex items-center tracking-tight transition-all duration-150">
                {typedSuffix}
                <span className="inline-block w-2.5 sm:w-3.5 h-9 sm:h-14 bg-[#FF5D5D] dark:bg-[#FFE600] animate-cursor-blink ml-1.5 opacity-90" />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-neutral-800 dark:text-neutral-300 font-medium leading-relaxed max-w-xl">
              REST API downloader nyata dengan <span className="font-black">11 platform media</span> — TikTok,
              Instagram, YouTube, Threads &amp; teman-temannya. Gratis, tanpa API key, lengkap
              pratinjau &amp; unduhan langsung.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <button
                onClick={() => onGoToDocs()}
                className="brutal-btn bg-[#FF5D5D] dark:bg-[#FFE600] text-white dark:text-black hover:bg-[#F04646] dark:hover:bg-[#FFEA00] px-7 py-3.5 text-base sm:text-lg font-black flex items-center gap-2.5 cursor-pointer shadow-brutal transition-transform"
              >
                <span>Start Free</span>
                <ArrowRight className="w-5 h-5 text-white dark:text-black" />
              </button>
            </div>

          </div>

          {/* Right Column: Live Animated Console strictly positioned on the right on desktop */}
          <div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-xl">
              <TerminalBootAnimation />
            </div>
          </div>

        </div>

      </section>

      {/* Keunggulan & Dirancang untuk Developer Section */}
      <section className="border-t-3 border-black dark:border-[#FFE600] bg-white dark:bg-[#171420] py-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-black dark:text-white tracking-tight">
              Dirancang Khusus untuk Developer
            </h2>
            <p className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base font-medium">
              Fondasi REST API downloader yang terbukti produksi — siap diintegrasikan ke bot WhatsApp,
              bot Discord, aplikasi seluler, atau website kustom Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Card 1 */}
            <div className="fade-in-scroll border-3 border-black dark:border-[#FFE600] bg-[#FFFBF4] dark:bg-[#211D2E] p-6 brutal-shadow hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-[#FF5D5D] dark:bg-[#FFE600] text-white dark:text-black border-2 border-black dark:border-[#FFE600] flex items-center justify-center font-black text-xl mb-4 shadow-[2px_2px_0px_#000]">
                <Film className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-black dark:text-white mb-2">
                11 Platform Downloader
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                TikTok, Instagram, YouTube, Facebook, Twitter/X, Douyin, Bilibili, Kwai, SnackVideo,
                XiaoHongShu, dan Threads — semuanya lewat satu pola endpoint seragam.
              </p>
            </div>

            {/* Card 2 */}
            <div className="fade-in-scroll border-3 border-black dark:border-[#FFE600] bg-[#FFFBF4] dark:bg-[#211D2E] p-6 brutal-shadow hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-[#FFD93D] dark:bg-[#FFE600] text-black border-2 border-black dark:border-[#FFE600] flex items-center justify-center font-black text-xl mb-4 shadow-[2px_2px_0px_#000]">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-black dark:text-white mb-2">
                Triple Fallback Engine
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                YTUltra &amp; Cuki AIO sebagai mesin utama, lalu scraper cadangan berlapis (wowdownloader,
                snapdownloader, threadsdl &amp; kawan-kawannya) bila layanan utama tumbang.
              </p>
            </div>

            {/* Card 3 */}
            <div className="fade-in-scroll border-3 border-black dark:border-[#FFE600] bg-[#FFFBF4] dark:bg-[#211D2E] p-6 brutal-shadow hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-[#FFD93D] dark:bg-[#FFE600] text-black dark:text-black border-2 border-black dark:border-[#FFE600] flex items-center justify-center font-black text-xl mb-4 shadow-[2px_2px_0px_#000]">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-black dark:text-white mb-2">
                Pratinjau &amp; Unduh Langsung
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                Stream proxy dengan Range + Referer otomatis untuk tag video/audio, plus
                /api/download-file yang memaksa browser menyimpan file ke penyimpanan perangkat.
              </p>
            </div>

            {/* Card 4 */}
            <div className="fade-in-scroll border-3 border-black dark:border-[#FFE600] bg-[#FFFBF4] dark:bg-[#211D2E] p-6 brutal-shadow hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-[#A78BFA] dark:bg-[#FFE600] text-white dark:text-black border-2 border-black dark:border-[#FFE600] flex items-center justify-center font-black text-xl mb-4 shadow-[2px_2px_0px_#000]">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-black dark:text-white mb-2">
                Statistik Real-Time
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                Setiap unduh otomatis tercatat: total request, breakdown 11 platform, dan grafik 7 hari
                terakhir — dishare gratis lewat publik /api/stats.
              </p>
            </div>

            {/* Card 5 */}
            <div className="fade-in-scroll border-3 border-black dark:border-[#FFE600] bg-[#FFFBF4] dark:bg-[#211D2E] p-6 brutal-shadow hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-[#FFB3C7] dark:bg-[#FFE600] text-black border-2 border-black dark:border-[#FFE600] flex items-center justify-center font-black text-xl mb-4 shadow-[2px_2px_0px_#000]">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-black dark:text-white mb-2">
                Force Download Sekali Tap
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                /api/force-download langsung meng-redirect ke file kualitas terbaik — pas untuk
                deep-link WebView, tombol unduh cepat, atau shortcut bot.
              </p>
            </div>

            {/* Card 6 */}
            <div className="fade-in-scroll border-3 border-black dark:border-[#FFE600] bg-[#FFFBF4] dark:bg-[#211D2E] p-6 brutal-shadow hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-[#3ECFC0] dark:bg-[#FFE600] text-black dark:text-black border-2 border-black dark:border-[#FFE600] flex items-center justify-center font-black text-xl mb-4 shadow-[2px_2px_0px_#000]">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-black dark:text-white mb-2">
                Murni REST, Tanpa Vendor Lock-in
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                JSON HTTP standar, tanpa API key, tanpa auth rumit. Contoh kode siap pakai dalam
                cURL, JavaScript, Node.js, Python, PHP, dan Go di setiap halaman endpoint.
              </p>
            </div>

          </div>

          {/* Platform ticker */}
          <div className="mt-12 flex flex-wrap justify-center gap-2 font-mono text-xs">
            {PLATFORM_LIST.map((p) => (
              <button
                key={p}
                onClick={() => onGoToDocs(`proxy-${p}`)}
                className="border-2 border-black dark:border-[#FFE600] bg-white dark:bg-[#211D2E] text-black dark:text-white px-3 py-1.5 font-black uppercase hover:bg-[#FF5D5D] hover:text-white dark:hover:bg-[#FFE600] dark:hover:text-black transition-colors cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
};
