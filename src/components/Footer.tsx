import React from 'react';
import { BookOpen, FileText, Lock, ShieldCheck } from 'lucide-react';
import { TermsSection } from './TermsPage';

interface FooterProps {
  onGoToDocs: (endpointId?: string) => void;
  onGoToTerms: (section?: TermsSection) => void;
}

export const Footer: React.FC<FooterProps> = ({ onGoToDocs, onGoToTerms }) => {

  return (
    <footer className="border-t-3 border-black dark:border-[#FFE600] bg-white dark:bg-[#171420] text-black dark:text-white mt-16 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info with Chibi Avatar & Creator Credit */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <img 
                src="/assets/aistudio/himmel_chibi_96091b4e.png" 
                alt="LIRENXIN Logo" 
                className="w-10 h-10 object-contain shrink-0 select-none"
              />
              <span className="font-black text-xl tracking-tight text-black dark:text-white">
                LIRENXIN REST API
              </span>
            </div>
            <p className="text-sm text-neutral-800 dark:text-neutral-300 max-w-sm font-medium leading-relaxed">
              Platform REST API developer dengan estetika Neo-Brutalism berdaya tinggi. Dibuat dan dikembangkan oleh <strong className="text-black dark:text-[#FFE600]">Taufik Hidayat</strong> sejak tahun 2022.
            </p>
            <div className="text-xs font-mono text-black dark:text-white font-bold">
              © 2022 - {new Date().getFullYear()} LIRENXIN API Network. Dibuat oleh Taufik Hidayat (2022).
            </div>
          </div>

          {/* Aturan Penggunaan API Column - All Black in light mode, sharp yellow in dark mode */}
          <div className="space-y-3">
            <div className="font-mono text-xs font-black uppercase text-black dark:text-[#FFE600] tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-[#FFE600]" />
              <span>ATURAN PENGGUNAAN API</span>
            </div>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <button
                  onClick={() => onGoToTerms('usage')}
                  className="hover:underline text-black dark:text-[#FFE600] cursor-pointer text-left"
                >
                  Batas Request & Rate Limit
                </button>
              </li>
              <li>
                <button
                  onClick={() => onGoToTerms('usage')}
                  className="hover:underline text-black dark:text-[#FFE600] cursor-pointer text-left"
                >
                  Larangan Abuse & Spam
                </button>
              </li>
              <li>
                <button
                  onClick={() => onGoToTerms('usage')}
                  className="hover:underline text-black dark:text-[#FFE600] cursor-pointer text-left"
                >
                  Hak Cipta Konten Pihak Ketiga
                </button>
              </li>
              <li>
                <button
                  onClick={() => onGoToTerms('usage')}
                  className="hover:underline text-black dark:text-[#FFE600] cursor-pointer text-left"
                >
                  Akses Hanya Konten Publik
                </button>
              </li>
            </ul>
          </div>

          {/* Kebijakan & Ketentuan Column - All Black in light mode, sharp yellow in dark mode */}
          <div className="space-y-3">
            <div className="font-mono text-xs font-black uppercase text-black dark:text-[#FFE600] tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-black dark:text-[#FFE600]" />
              <span>KEBIJAKAN & KETENTUAN</span>
            </div>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <button
                  onClick={() => onGoToTerms('tos')}
                  className="hover:underline text-black dark:text-[#FFE600] cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onGoToTerms('usage')}
                  className="hover:underline text-black dark:text-[#FFE600] cursor-pointer text-left"
                >
                  Kebijakan Penggunaan
                </button>
              </li>
              <li>
                <button
                  onClick={() => onGoToTerms('privacy')}
                  className="hover:underline text-black dark:text-[#FFE600] cursor-pointer text-left flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-black dark:text-[#FFE600]" />
                  <span>Privasi & Keamanan</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onGoToDocs()}
                  className="hover:underline text-black dark:text-[#FFE600] font-black cursor-pointer text-left flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-black dark:text-[#FFE600]" />
                  <span>Buka Dokumentasi API</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Clean Bottom Bar - All Black in light mode */}
        <div className="mt-8 pt-6 border-t-2 border-black dark:border-[#FFE600]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="text-black dark:text-neutral-400">
            LIRENXIN API GATEWAY • <span className="text-black dark:text-[#FFE600] font-black">DIBUAT OLEH TAUFIK HIDAYAT (2022)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold text-black dark:text-[#FFE600]">
            <button
              onClick={() => onGoToTerms('tos')}
              className="hover:underline cursor-pointer"
            >
              Terms of Service
            </button>
            <span className="text-black dark:text-white">•</span>
            <button
              onClick={() => onGoToTerms('usage')}
              className="hover:underline cursor-pointer"
            >
              Aturan Penggunaan API
            </button>
            <span className="text-black dark:text-white">•</span>
            <button
              onClick={() => onGoToTerms('privacy')}
              className="hover:underline cursor-pointer"
            >
              Privasi & Keamanan
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
