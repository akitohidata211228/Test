import React from 'react';
import { ExternalLink } from 'lucide-react';

interface DocsViewProps {
  initialEndpointId?: string;
  onGoHome?: () => void;
}

/**
 * Halaman dokumentasi memakai bentuk persis repo LiRénXin API
 * (public/docs.html: sidebar status server + console + daftar endpoint
 * accordion + JSON highlight + unduhan respons) — disajikan dari
 * gateway Express (/docs) di origin yang sama.
 */
export const DocsView: React.FC<DocsViewProps> = () => {
  return (
    <div className="flex flex-col bg-white dark:bg-[#0A0D14]">
      {/* Strip info: docs statis membentuk pengalaman repo */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#0A37BF] dark:text-[#FFE600]">
          Interactive Docs • 287 Endpoint • Console Live
        </span>
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] font-black text-[#1E5CD9] dark:text-[#FFE600] hover:underline cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          BUKA MODE FULLSCREEN
        </a>
      </div>

      {/* Halaman /docs repo asli — bentuk, warna, console, dan API-nya identik */}
      <iframe
        src="/docs"
        title="LiRénXin API Documentation"
        className="w-full border-0"
        style={{ height: 'calc(100vh - 118px)', minHeight: 560 }}
      />
    </div>
  );
};
