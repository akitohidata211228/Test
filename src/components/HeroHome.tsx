import React, { useState, useEffect } from 'react';
import {
  ArrowRight, Play, Zap, Film, Download, BarChart3, Layers, Globe2
} from 'lucide-react';
import { TerminalBootAnimation } from './TerminalBootAnimation';
import { useGlobalScrollFadeIn } from '../utils/useScrollFadeIn';
import { PLATFORM_LIST } from '../data/apiEndpoints';

interface HeroHomeProps {
  onGoToDocs: (endpointId?: string) => void;
}

const formatNumber = (n: number): string => (n || 0).toLocaleString('id-ID');

export const HeroHome: React.FC<HeroHomeProps> = ({ onGoToDocs }) => {
  useGlobalScrollFadeIn();

  // Live gateway statistics — fitur asli Akito Downloader (/api/stats)
  const [stats, setStats] = useState<{ total: number; topPlatform: string | null; daily: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stats', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data || !data.totalRequests) return;
        const byPlatform: Record<string, number> = data.requestsByPlatform || {};
        const top = Object.entries(byPlatform).sort((a, b) => b[1] - a[1])[0];
        const dailyTotal = (data.dailyRequests || []).reduce(
          (sum: number, d: any) => sum + (Number(d.count) || 0), 0
        );
        setStats({ total: data.totalRequests, topPlatform: top ? top[0] : null, daily: dailyTotal });
      })
      .catch(() => {
        // server belum jalan — statistik lokal disembunyikan senyap
      });
    return () => { cancelled = true; };
  }, []);

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

            {/* Headline with Soft Live Typing Animation */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-black dark:text-white min-h-[90px] sm:min-h-[140px] flex flex-wrap items-center">
              <span>HI,&nbsp;</span>
              <span className="text-[#1E5CD9] dark:text-[#FFE600] inline-flex items-center tracking-tight transition-all duration-150">
                {typedSuffix}
                <span className="inline-block w-2.5 sm:w-3.5 h-9 sm:h-14 bg-[#1E5CD9] dark:bg-[#FFE600] animate-cursor-blink ml-1.5 opacity-90" />
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
                className="brutal-btn bg-[#1E5CD9] dark:bg-[#FFE600] text-white dark:text-black hover:bg-[#0A37BF] dark:hover:bg-[#FFEA00] px-7 py-3.5 text-base sm:text-lg font-black flex items-center gap-2.5 cursor-pointer shadow-brutal transition-transform"
              >
                <span>Start Free</span>
                <ArrowRight className="w-5 h-5 text-white dark:text-black" />
              </button>

              <button
                onClick={() => onGoToDocs('proxy-tiktok')}
                className="brutal-btn bg-white dark:bg-[#121620] hover:bg-[#F8F9FA] dark:hover:bg-[#1A2234] text-black dark:text-white border-2 border-black dark:border-[#FFE600] px-6 py-3.5 text-base font-bold flex items-center gap-3 cursor-pointer shadow-brutal transition-transform"
              >
                <Play className="w-5 h-5 text-[#1E5CD9] dark:text-[#FFE600] fill-current" />
                <span>Playground Downloader</span>
              </button>
            </div>

            {/* Live Gateway Stats Strip — data nyata dari /api/stats */}
            {stats && (
              <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
                <span className="inline-flex items-center gap-1.5 border-2 border-black dark:border-[#FFE600] bg-[#5EADF2] dark:bg-[#121620] text-black dark:text-[#FFE600] px-2.5 py-1 font-black">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>{formatNumber(stats.total)} REQUEST TOTAL</span>
                </span>
                <span className="inline-flex items-center gap-1.5 border-2 border-black dark:border-[#FFE600] bg-white dark:bg-[#0F1420] text-black dark:text-white px-2.5 py-1 font-bold">
                  <Zap className="w-3.5 h-3.5 text-[#1E5CD9] dark:text-[#FFE600]" />
                  <span>7 HARI TERAKHIR: {formatNumber(stats.daily)}</span>
                </span>
                {stats.topPlatform && (
                  <span className="inline-flex items-center gap-1.5 border-2 border-black dark:border-[#FFE600] bg-[#F8FAFC] dark:bg-[#0A0D14] text-black dark:text-[#FFE600] px-2.5 py-1 font-black uppercase">
                    <Film className="w-3.5 h-3.5" />
                    <span>TOP: {stats.topPlatform}</span>
                  </span>
                )}
              </div>
            )}

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
      <section className="border-t-3 border-black dark:border-[#FFE600] bg-white dark:bg-[#0A0D14] py-16 transition-colors">
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
            <div className="fade-in-scroll border-3 border-black dark:border-[#FFE600] bg-[#F8FAFC] dark:bg-[#0F1420] p-6 brutal-shadow hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-[#1E5CD9] dark:bg-[#FFE600] text-white dark:text-black border-2 border-black dark:border-[#FFE600] flex items-center justify-center font-black text-xl mb-4 shadow-[2px_2px_0px_#000]">
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
            <div className="fade-in-scroll border-3 border-black dark:border-[#FFE600] bg-[#F8FAFC] dark:bg-[#0F1420] p-6 brutal-shadow hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-[#5EADF2] dark:bg-[#FFE600] text-black border-2 border-black dark:border-[#FFE600] flex items-center justify-center font-black text-xl mb-4 shadow-[2px_2px_0px_#000]">
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
            <div className="fade-in-scroll border-3 border-black dark:border-[#FFE600] bg-[#F8FAFC] dark:bg-[#0F1420] p-6 brutal-shadow hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-[#0A37BF] dark:bg-[#FFE600] text-white dark:text-black border-2 border-black dark:border-[#FFE600] flex items-center justify-center font-black text-xl mb-4 shadow-[2px_2px_0px_#000]">
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
            <div className="fade-in-scroll border-3 border-black dark:border-[#FFE600] bg-[#F8FAFC] dark:bg-[#0F1420] p-6 brutal-shadow hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-[#1E5CD9] dark:bg-[#FFE600] text-white dark:text-black border-2 border-black dark:border-[#FFE600] flex items-center justify-center font-black text-xl mb-4 shadow-[2px_2px_0px_#000]">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-black dark:text-white mb-2">
                Statistik Real-Time
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                Setiap unduh otomatis tercatat: total request, breakdown 11 platform, dan grafik 7 hari
                terakhir — dishare gratis lewat /api/stats (yang ditampilkan di beranda ini).
              </p>
            </div>

            {/* Card 5 */}
            <div className="fade-in-scroll border-3 border-black dark:border-[#FFE600] bg-[#F8FAFC] dark:bg-[#0F1420] p-6 brutal-shadow hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-[#5EADF2] dark:bg-[#FFE600] text-black border-2 border-black dark:border-[#FFE600] flex items-center justify-center font-black text-xl mb-4 shadow-[2px_2px_0px_#000]">
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
            <div className="fade-in-scroll border-3 border-black dark:border-[#FFE600] bg-[#F8FAFC] dark:bg-[#0F1420] p-6 brutal-shadow hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-[#0A37BF] dark:bg-[#FFE600] text-white dark:text-black border-2 border-black dark:border-[#FFE600] flex items-center justify-center font-black text-xl mb-4 shadow-[2px_2px_0px_#000]">
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
                className="border-2 border-black dark:border-[#FFE600] bg-white dark:bg-[#0F1420] text-black dark:text-white px-3 py-1.5 font-black uppercase hover:bg-[#1E5CD9] hover:text-white dark:hover:bg-[#FFE600] dark:hover:text-black transition-colors cursor-pointer"
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
