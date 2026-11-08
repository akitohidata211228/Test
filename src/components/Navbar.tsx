import React from 'react';
import { Sun, Moon, BookOpen } from 'lucide-react';

interface NavbarProps {
  onGoHome: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

interface NavbarPropsWithDocs extends NavbarProps {
  onGoDocs?: () => void;
}

export const Navbar: React.FC<NavbarPropsWithDocs> = ({
  onGoHome,
  isDarkMode,
  toggleDarkMode,
  onGoDocs,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#151220]/95 backdrop-blur-md border-b-3 border-black dark:border-[#FFE600] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">

        {/* Brand Zone: Pure Chibi Avatar (No background container) + LIRENXIN API Wordmark */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 group text-left cursor-pointer"
          aria-label="Kembali ke Beranda LIRENXIN API"
        >
          {/* Avatar icon strictly without background wrapper */}
          <img
            src="/assets/aistudio/himmel_chibi_96091b4e.png"
            alt="LIRENXIN Avatar"
            className="w-11 h-11 object-contain drop-shadow-xs group-hover:-rotate-6 group-hover:scale-105 transition-transform duration-200 shrink-0 select-none"
          />

          <div className="flex items-center">
            <span className="font-black text-xl sm:text-2xl tracking-tight text-black dark:text-white">
              LIRENXIN
            </span>
            <span className="bg-[#FF5D5D] dark:bg-[#FFE600] text-white dark:text-black px-1.5 py-0.5 border border-black dark:border-[#FFE600] ml-1.5 text-xs font-mono font-black shadow-[1.5px_1.5px_0px_#000] dark:shadow-[1.5px_1.5px_0px_#FFE600]">
              API
            </span>
          </div>
        </button>

        {/* Right Zone: Theme Mode Toggle + Docs Shortcut */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          <button
            onClick={toggleDarkMode}
            className="w-10 h-10 border-2 border-black dark:border-[#FFE600] bg-[#A78BFA] dark:bg-[#1B1726] text-black dark:text-[#FFE600] flex items-center justify-center brutal-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
            aria-label={isDarkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-[#FFE600]" />
            ) : (
              <Moon className="w-5 h-5 text-[#A78BFA]" />
            )}
          </button>

          <button
            onClick={() => onGoDocs?.()}
            className="brutal-btn bg-[#FF5D5D] dark:bg-[#FFE600] hover:bg-[#F04646] dark:hover:bg-[#FFEA00] text-white dark:text-black px-4 sm:px-5 py-2 text-xs sm:text-sm font-mono font-black flex items-center gap-2 cursor-pointer transition-colors shadow-brutal-sm"
            title="Buka Dokumentasi & Playground API"
          >
            <BookOpen className="w-4 h-4 text-white dark:text-black" />
            <span className="tracking-wide">Docs</span>
          </button>

        </div>

      </div>
    </header>
  );
};
