import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, FileText, ShieldCheck, Lock, Server, 
  BookOpen, User, CheckCircle2, AlertOctagon,
  Copy, Check, ShieldAlert, Globe, Shield
} from 'lucide-react';

export type TermsSection = 'tos' | 'usage' | 'privacy';

interface TermsPageProps {
  initialSection?: TermsSection;
  onGoHome: () => void;
  onGoToDocs: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({
  initialSection = 'tos',
  onGoHome,
  onGoToDocs,
}) => {
  const [activeSection, setActiveSection] = useState<TermsSection>(initialSection);
  const [copiedDomain, setCopiedDomain] = useState(false);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const copyDomain = () => {
    navigator.clipboard.writeText('https://lirenxin-api.my.id');
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in duration-150">
      
      {/* Top Breadcrumb & Action Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-3 border-black dark:border-[#FFE600]">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className="brutal-btn bg-white dark:bg-[#121620] hover:bg-[#F3F4F6] text-black dark:text-white border-2 border-black dark:border-[#FFE600] px-3.5 py-1.5 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-brutal-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </button>
          
          <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
            <span>/</span>
            <span className="text-black dark:text-white font-bold">KEBIJAKAN & KETENTUAN</span>
            <span>/</span>
            <span className="text-black dark:text-[#FFE600] font-black uppercase">
              {activeSection === 'tos' && 'Terms of Service'}
              {activeSection === 'usage' && 'Aturan Penggunaan API'}
              {activeSection === 'privacy' && 'Privasi & Keamanan'}
            </span>
          </div>
        </div>

        <button
          onClick={onGoToDocs}
          className="brutal-btn bg-black dark:bg-[#FFE600] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-[#FFEA00] px-4 py-1.5 text-xs font-mono font-black flex items-center gap-2 cursor-pointer shadow-brutal-xs"
        >
          <BookOpen className="w-3.5 h-3.5 text-white dark:text-black" />
          <span>Buka Dokumentasi API</span>
        </button>
      </div>

      {/* Main Content: Sidebar + Article */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
        
        {/* Left Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="border-3 border-black dark:border-[#FFE600] bg-white dark:bg-[#0C0E14] shadow-brutal overflow-hidden">
            <div className="bg-black text-white dark:text-[#FFE600] p-4 border-b-2 border-black dark:border-[#FFE600]">
              <h2 className="font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-white dark:text-[#FFE600]" />
                <span>MENU KETENTUAN</span>
              </h2>
            </div>
            
            <nav className="p-2 space-y-1.5">
              <button
                onClick={() => setActiveSection('tos')}
                className={`w-full text-left px-3.5 py-3 text-xs font-mono font-bold flex items-center justify-between transition-colors cursor-pointer border ${
                  activeSection === 'tos'
                    ? 'bg-black text-white dark:bg-[#FFE600] dark:text-black border-black font-black shadow-brutal-xs'
                    : 'border-transparent text-black dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#1A2234]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4" />
                  <span>Terms of Service</span>
                </div>
                <span>→</span>
              </button>

              <button
                onClick={() => setActiveSection('usage')}
                className={`w-full text-left px-3.5 py-3 text-xs font-mono font-bold flex items-center justify-between transition-colors cursor-pointer border ${
                  activeSection === 'usage'
                    ? 'bg-black text-white dark:bg-[#FFE600] dark:text-black border-black font-black shadow-brutal-xs'
                    : 'border-transparent text-black dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#1A2234]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4" />
                  <span>Aturan Penggunaan API</span>
                </div>
                <span>→</span>
              </button>

              <button
                onClick={() => setActiveSection('privacy')}
                className={`w-full text-left px-3.5 py-3 text-xs font-mono font-bold flex items-center justify-between transition-colors cursor-pointer border ${
                  activeSection === 'privacy'
                    ? 'bg-black text-white dark:bg-[#FFE600] dark:text-black border-black font-black shadow-brutal-xs'
                    : 'border-transparent text-black dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#1A2234]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4" />
                  <span>Privasi & Keamanan</span>
                </div>
                <span>→</span>
              </button>
            </nav>
          </div>

          {/* Attribution Box */}
          <div className="border-3 border-black dark:border-[#FFE600] bg-[#F4F7FC] dark:bg-[#121622] p-5 shadow-brutal space-y-3 font-mono text-xs">
            <div className="font-black text-black dark:text-[#FFE600] flex items-center gap-2 pb-2 border-b-2 border-black dark:border-[#FFE600]/30">
              <User className="w-4 h-4 text-black dark:text-[#FFE600]" />
              <span>INFORMASI PEMILIK & ARSITEK</span>
            </div>
            <div className="space-y-2 text-neutral-800 dark:text-neutral-200">
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Kreator:</span>
                <strong className="text-black dark:text-[#FFE600]">Taufik Hidayat</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Tahun Pembuatan:</span>
                <span className="font-bold text-black dark:text-white">2022</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Gateway Status:</span>
                <span className="font-bold text-black dark:text-[#FFE600]">99.9% Production Ready</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Domain Resmi:</span>
                <span className="font-bold text-black dark:text-white">lirenxin-api.my.id</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Versi Dokumen:</span>
                <span className="font-bold text-black dark:text-[#FFE600]">2026</span>
              </div>
            </div>
          </div>

          {/* Official Domain Quick Card */}
          <div className="border-3 border-black dark:border-[#FFE600] bg-white dark:bg-[#0C0E14] p-4 shadow-brutal space-y-2">
            <div className="text-[11px] font-mono font-black text-black dark:text-[#FFE600] uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-black dark:text-[#FFE600]" />
              <span>HOST RESMI ENDPOINT</span>
            </div>
            <div className="flex items-center justify-between bg-neutral-100 dark:bg-[#1A2234] border border-black dark:border-[#FFE600]/40 px-3 py-2">
              <code className="text-xs font-mono font-bold text-black dark:text-[#FFE600] truncate">
                https://lirenxin-api.my.id
              </code>
              <button
                onClick={copyDomain}
                title="Salin URL Host"
                className="ml-2 text-black dark:text-white hover:text-neutral-600 dark:hover:text-[#FFE600] cursor-pointer"
              >
                {copiedDomain ? <Check className="w-3.5 h-3.5 text-black dark:text-[#FFE600]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </aside>

        {/* Right Article Body */}
        <main className="lg:col-span-8 border-3 border-black dark:border-[#FFE600] bg-white dark:bg-[#0C0E14] p-6 sm:p-10 shadow-brutal">
          
          {/* ========================================================================= */}
          {/* TERMS OF SERVICE */}
          {/* ========================================================================= */}
          {activeSection === 'tos' && (
            <article className="space-y-8 animate-in fade-in duration-100">
              {/* Document Header */}
              <div className="border-b-3 border-black dark:border-[#FFE600] pb-6 space-y-2">
                <div className="inline-block bg-black text-white dark:bg-[#FFE600] dark:text-black font-mono font-black text-xs px-2.5 py-1 tracking-wider uppercase border border-black">
                  TERMS OF SERVICE
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
                  Ketentuan Layanan LIRENXIN API
                </h1>
                <div className="text-xs font-mono font-bold text-black dark:text-[#FFE600]">
                  Versi Dokumen: 2026
                </div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 pt-2 leading-relaxed">
                  LIRENXIN API merupakan layanan Application Programming Interface (API) yang dikembangkan dan dirilis pertama kali oleh Taufik Hidayat pada tahun 2022. Ketentuan ini mengatur penggunaan layanan, hak dan kewajiban pengguna, serta batasan tanggung jawab dalam pemanfaatan infrastruktur API.
                </p>
              </div>

              {/* Section 1 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>1. Persetujuan Penggunaan Layanan</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Dengan mengakses, menggunakan, atau melakukan permintaan (request) terhadap endpoint pada domain <code className="bg-neutral-100 dark:bg-neutral-800 border border-black dark:border-[#FFE600]/40 px-1.5 py-0.5 font-mono text-xs font-bold text-black dark:text-[#FFE600]">https://lirenxin-api.my.id</code>, pengguna dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan yang tercantum dalam dokumen ini.
                  </p>
                  <p>
                    Ketentuan ini berlaku bagi seluruh pengguna, baik yang mengakses layanan melalui bot, aplikasi frontend, server backend, maupun skrip pengujian dan integrasi lainnya.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>2. Ketersediaan dan Pemeliharaan Layanan</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    LIRENXIN API dirancang untuk menyediakan layanan yang stabil melalui infrastruktur gateway terdistribusi dengan target ketersediaan layanan sebesar 99,9%.
                  </p>
                  <p>
                    Meskipun demikian, ketersediaan layanan dapat dipengaruhi oleh pemeliharaan sistem, pembaruan infrastruktur, gangguan jaringan, maupun kondisi teknis di luar kendali pengelola.
                  </p>
                  <p>
                    Pemeliharaan terjadwal atau tindakan perbaikan darurat dapat dilakukan sewaktu-waktu untuk menjaga keamanan, integritas, dan performa layanan.
                  </p>
                  <p>
                    Target uptime merupakan sasaran operasional dan bukan jaminan ketersediaan tanpa gangguan.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>3. Penggunaan yang Bertanggung Jawab</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Pengguna wajib menggunakan LIRENXIN API secara sah, bertanggung jawab, dan sesuai dengan dokumentasi serta kebijakan penggunaan yang berlaku.
                  </p>
                  <p>
                    Pengguna dilarang memanfaatkan layanan untuk aktivitas yang melanggar hukum, mengganggu stabilitas infrastruktur, merugikan pihak lain, atau melanggar hak kekayaan intelektual.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>4. Batasan Tanggung Jawab</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Layanan LIRENXIN API disediakan berdasarkan prinsip <em className="font-bold">as-is</em> dan <em className="font-bold">as-available</em>, tanpa jaminan tersurat maupun tersirat atas kesesuaian layanan untuk tujuan tertentu.
                  </p>
                  <p>
                    Pengelola tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul akibat:
                  </p>
                  <ul className="list-disc list-outside space-y-1.5 pl-5 text-neutral-800 dark:text-neutral-200 text-sm">
                    <li>Gangguan atau ketidaktersediaan layanan.</li>
                    <li>Kesalahan implementasi atau konfigurasi pada sisi pengguna.</li>
                    <li>Kegagalan layanan pihak ketiga atau transaksi eksternal.</li>
                    <li>Kehilangan data, pendapatan, maupun peluang bisnis akibat penggunaan layanan.</li>
                  </ul>
                  <p>
                    Pengguna bertanggung jawab atas sistem, aplikasi, dan aktivitas yang dikembangkan menggunakan API.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>5. Perubahan Ketentuan</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Pengelola berhak memperbarui atau mengubah ketentuan ini sewaktu-waktu sesuai dengan perkembangan layanan, kebutuhan keamanan, dan perubahan operasional.
                  </p>
                  <p>
                    Pengguna disarankan untuk meninjau halaman ini secara berkala. Penggunaan layanan setelah perubahan diterbitkan dianggap sebagai persetujuan terhadap ketentuan terbaru.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>6. Penutup</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Dengan menggunakan LIRENXIN API, pengguna menyatakan bersedia mematuhi ketentuan layanan yang berlaku dan menggunakan fasilitas API secara bertanggung jawab.
                  </p>
                </div>
              </section>

              {/* Formal Footer Attribution */}
              <div className="mt-8 pt-6 border-t-2 border-black dark:border-[#FFE600] text-xs font-mono font-bold text-black dark:text-[#FFE600]">
                © 2026 LIRENXIN API — Developed by Taufik Hidayat.
              </div>
            </article>
          )}

          {/* ========================================================================= */}
          {/* API USAGE POLICY */}
          {/* ========================================================================= */}
          {activeSection === 'usage' && (
            <article className="space-y-8 animate-in fade-in duration-100">
              {/* Document Header */}
              <div className="border-b-3 border-black dark:border-[#FFE600] pb-6 space-y-2">
                <div className="inline-block bg-black text-white dark:bg-[#FFE600] dark:text-black font-mono font-black text-xs px-2.5 py-1 tracking-wider uppercase border border-black">
                  API USAGE POLICY
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
                  Pedoman Integrasi dan Penggunaan API
                </h1>
                <div className="text-xs font-mono font-bold text-black dark:text-[#FFE600]">
                  Versi Dokumen: 2026
                </div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 pt-2 leading-relaxed">
                  Kebijakan ini ditetapkan sebagai pedoman teknis bagi pengembang dalam mengintegrasikan LIRENXIN API secara aman, efisien, dan sesuai dengan batas penggunaan yang berlaku.
                </p>
              </div>

              {/* Section 1 */}
              <section className="space-y-4">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>1. Batas Kuota dan Tingkat Permintaan</span>
                </h2>
                <div className="space-y-4 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    LIRENXIN API terbuka secara gratis dan tidak menerapkan API Key maupun kuota per akun. Meski demikian, seluruh pengguna tetap mematuhi ketentuan penggunaan yang wajar (fair use) berikut ini.
                  </p>

                  {/* Akses Terbuka Box */}
                  <div className="border-2 border-black dark:border-[#FFE600] bg-neutral-50 dark:bg-[#121620] p-4 space-y-2">
                    <div className="font-mono text-xs font-black uppercase text-black dark:text-[#FFE600]">
                      Akses Terbuka (Tanpa API Key)
                    </div>
                    <ul className="list-disc list-outside space-y-1.5 pl-5 text-xs font-mono text-black dark:text-neutral-200">
                      <li>Seluruh endpoint dipublikasikan gratis tanpa registrasi maupun autentikasi.</li>
                      <li>Gunakan jeda yang wajar antar-permintaan; ekstraksi media membutuhkan waktu pemrosesan di pihak ketiga.</li>
                    </ul>
                  </div>

                  {/* Konten Publik Box */}
                  <div className="border-2 border-black dark:border-[#FFE600] bg-neutral-50 dark:bg-[#121620] p-4 space-y-2">
                    <div className="font-mono text-xs font-black uppercase text-black dark:text-[#FFE600]">
                      Batas Konten yang Didukung
                    </div>
                    <ul className="list-disc list-outside space-y-1.5 pl-5 text-xs font-mono text-black dark:text-neutral-200">
                      <li>Ekstraksi hanya menargetkan konten publik; konten privat/terproteksi tidak dapat diunduh.</li>
                      <li>Proses eksekusi melalui 11 platform proxy, stream proxy, download-file, dan force-download.</li>
                    </ul>
                  </div>

                  <p>
                    Ketentuan penggunaan dapat disesuaikan berdasarkan kebijakan operasional layanan.
                  </p>
                  <p>
                    Statistik agregat penggunaan tersedia lintas platform melalui endpoint /api/stats.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>2. Larangan Penyalahgunaan Layanan</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Pengguna dilarang melakukan aktivitas yang dapat mengganggu keamanan, ketersediaan, atau integritas layanan, termasuk namun tidak terbatas pada:
                  </p>
                  
                  <div className="border-2 border-black dark:border-[#FFE600] bg-neutral-50 dark:bg-[#121620] p-4">
                    <ul className="list-disc list-outside space-y-2 pl-5 text-xs font-mono text-black dark:text-neutral-200">
                      <li>Melakukan serangan DoS, DDoS, atau aktivitas yang bertujuan membebani infrastruktur secara berlebihan.</li>
                      <li>Menjalankan permintaan otomatis secara berulang tanpa jeda yang wajar sehingga mengganggu performa layanan.</li>
                      <li>Mengirimkan spam URL, ID yang tidak valid, atau payload berbahaya berulang-ulang.</li>
                      <li>Menggunakan layanan untuk mengakses, menyebarkan, atau mendistribusikan konten ilegal termasuk konten eksplisit anak, perbatasan, apapun yang melanggar hukum.</li>
                      <li>Melakukan penjualan kembali (reselling), redistribusi, atau penyediaan akses endpoint kepada pihak lain tanpa izin tertulis dari pengelola.</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>3. Tanggung Jawab Atas Konten Pihak Ketiga</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    LIRENXIN API hanya meneruskan (re-serve) media yang tersimpan pada CDN platform asal tautan, tanpa mengolek ulang, menyalin permanen, atau mengubah konten. Hak atas konten sepenuhnya menjadi tanggung jawab pembuat dan platform pihak ketiga.
                  </p>
                  <p className="font-bold text-black dark:text-white">
                    Setiap pengembang wajib:
                  </p>
                  <ul className="list-disc list-outside space-y-1.5 pl-5 text-xs font-mono text-black dark:text-neutral-200">
                    <li>Memastikan konten yang diunduh digunakan untuk tujuan yang legal dan tidak mengkhawatirkan hak cipta pemilik asli.</li>
                    <li>Mematuhi hukum yang berlaku (UU Hak Cipta) yang melekat pada konten pihak ketiga.</li>
                    <li>Menghormati privasi pengguna platform pihak ketiga — termasuk tidak memonitisasi data pribadi mereka.</li>
                    <li>Pertimbangkan ketentuan layanan masing-masing platform saat mengintegrasikan API pada produk Anda.</li>
                  </ul>
                  <p>
                    Konten diunduh langsung dari CDN platform asal agar aman, cepat, dan adil bagi semua pihak.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>4. Penegakan Kebijakan</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Pengelola berhak melakukan pembatasan, penangguhan, atau pencabutan akses apabila ditemukan indikasi pelanggaran terhadap kebijakan ini.
                  </p>
                  <p>
                    Tindakan penegakan dapat dilakukan tanpa pemberitahuan sebelumnya apabila diperlukan untuk mencegah gangguan keamanan atau kerusakan infrastruktur.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>5. Pembaruan Kebijakan</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Kebijakan ini dapat diperbarui sewaktu-waktu untuk menyesuaikan kebutuhan teknis, keamanan, dan perkembangan layanan.
                  </p>
                  <p>
                    Pengguna bertanggung jawab untuk mengikuti ketentuan terbaru yang dipublikasikan pada halaman resmi LIRENXIN API.
                  </p>
                </div>
              </section>

              {/* Formal Footer Attribution */}
              <div className="mt-8 pt-6 border-t-2 border-black dark:border-[#FFE600] text-xs font-mono font-bold text-black dark:text-[#FFE600]">
                © 2026 LIRENXIN API — Developer Integration Standards.
              </div>
            </article>
          )}

          {/* ========================================================================= */}
          {/* PRIVACY POLICY */}
          {/* ========================================================================= */}
          {activeSection === 'privacy' && (
            <article className="space-y-8 animate-in fade-in duration-100">
              {/* Document Header */}
              <div className="border-b-3 border-black dark:border-[#FFE600] pb-6 space-y-2">
                <div className="inline-block bg-black text-white dark:bg-[#FFE600] dark:text-black font-mono font-black text-xs px-2.5 py-1 tracking-wider uppercase border border-black">
                  PRIVACY POLICY
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
                  Kebijakan Privasi dan Perlindungan Data Developer
                </h1>
                <div className="text-xs font-mono font-bold text-black dark:text-[#FFE600]">
                  Versi Dokumen: 2026
                </div>
                <div className="space-y-2 text-sm font-medium text-neutral-800 dark:text-neutral-200 pt-2 leading-relaxed">
                  <p>
                    LIRENXIN API berkomitmen untuk menjaga keamanan informasi dan transparansi dalam pemrosesan data yang berkaitan dengan penggunaan layanan API.
                  </p>
                  <p>
                    Kebijakan ini menjelaskan jenis data teknis yang dapat dikumpulkan, tujuan pemrosesan, serta mekanisme perlindungan informasi pengguna.
                  </p>
                </div>
              </div>

              {/* Section 1 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>1. Informasi yang Dikumpulkan</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Untuk mendukung operasional, analisis performa, dan keamanan gateway, LIRENXIN API dapat mencatat informasi teknis berikut:
                  </p>
                  <ul className="list-disc list-outside space-y-1.5 pl-5 text-xs font-mono text-black dark:text-neutral-200">
                    <li>Alamat IP yang digunakan saat mengakses layanan.</li>
                    <li>Metode HTTP dan endpoint yang diminta.</li>
                    <li>Waktu permintaan dan durasi respons server.</li>
                    <li>Informasi User-Agent atau identitas teknis klien.</li>
                    <li>URL tautan pihak ketiga yang dikirimkan melalui parameter query endpoint.</li>
                  </ul>
                  <p>
                    Data tersebut digunakan untuk keperluan pemantauan performa, analisis penggunaan, pemecahan masalah teknis, penegakan ketentuan penggunaan, dan pencegahan aktivitas yang berpotensi merugikan layanan.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>2. Tanpa Akun, Tanpa Data Pribadi</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    LIRENXIN API tidak menerapkan sistem registrasi, login, maupun akun pengguna. Seluruh endpoint dapat diakses langsung tanpa autentikasi apa pun.
                  </p>
                  <p>
                    Layanan tidak meminta, menerima, atau menyimpan kata sandi maupun data profil pengguna dalam bentuk apa pun, termasuk dari penyedia autentikasi pihak ketiga seperti Google.
                  </p>
                  <p>
                    Statistik penggunaan yang dipublikasikan melalui endpoint /api/stats bersifat agregat (total permintaan, distribusi per platform, permintaan harian) dan tidak memuat informasi yang dapat mengidentifikasi individu.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>3. Penggunaan dan Perlindungan Data</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Informasi yang dikumpulkan digunakan secara terbatas untuk:
                  </p>
                  <ul className="list-disc list-outside space-y-1.5 pl-5 text-xs font-mono text-black dark:text-neutral-200">
                    <li>Menyediakan dan mengelola layanan API.</li>
                    <li>Memantau stabilitas serta performa infrastruktur.</li>
                    <li>Mengidentifikasi penyalahgunaan dan aktivitas mencurigakan.</li>
                    <li>Mempertahankan statistik agregat penggunaan layanan.</li>
                    <li>Melakukan evaluasi serta peningkatan kualitas layanan.</li>
                  </ul>
                  <p>
                    Pengelola menerapkan langkah-langkah teknis dan operasional yang wajar untuk melindungi informasi dari akses, penggunaan, atau pengungkapan yang tidak sah.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>4. Keamanan Transmisi Data</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Komunikasi antara pengguna dan gateway API dilindungi menggunakan protokol HTTPS dengan enkripsi TLS.
                  </p>
                  <p>
                    Koneksi aman membantu melindungi data selama proses transmisi dari risiko penyadapan maupun manipulasi oleh pihak yang tidak berwenang.
                  </p>
                  <p>
                    Keamanan transmisi tidak menjamin bahwa seluruh sistem atau perangkat pengguna terbebas dari risiko keamanan.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>5. Penyimpanan dan Pengungkapan Informasi</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Data teknis disimpan selama diperlukan untuk mendukung operasional layanan, keamanan, pemantauan, dan pemenuhan kewajiban yang berlaku.
                  </p>
                  <p>
                    Informasi dapat diproses oleh penyedia infrastruktur atau layanan pendukung yang diperlukan untuk menjalankan LIRENXIN API, dengan tetap memperhatikan kebutuhan keamanan dan kerahasiaan data.
                  </p>
                  <p>
                    Data dapat diungkapkan apabila diwajibkan oleh hukum atau diperlukan untuk menangani insiden keamanan dan penyalahgunaan layanan.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>6. Tanggung Jawab Pengguna</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Pengguna bertanggung jawab untuk menggunakan layanan secara legal, menghormati hak cipta dan ketentuan platform pihak ketiga, mengamankan perangkat dan aplikasi yang digunakan, serta menghindari pengiriman informasi sensitif yang tidak diperlukan melalui parameter query.
                  </p>
                  <p>
                    Pengguna disarankan untuk tidak mengirimkan kata sandi, data pribadi sensitif, atau informasi rahasia lainnya kecuali secara khusus diperlukan dan didukung oleh dokumentasi layanan.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>7. Perubahan Kebijakan Privasi</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Kebijakan ini dapat diperbarui sewaktu-waktu untuk mencerminkan perubahan pada sistem, praktik pemrosesan data, atau ketentuan hukum yang berlaku.
                  </p>
                  <p>
                    Versi terbaru akan dipublikasikan pada halaman resmi LIRENXIN API.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-black dark:text-[#FFE600] shrink-0" />
                  <span>8. Kontak</span>
                </h2>
                <div className="space-y-3 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed pl-7">
                  <p>
                    Untuk pertanyaan, permintaan, atau informasi lebih lanjut mengenai kebijakan privasi, pengguna dapat menghubungi pengelola melalui kanal komunikasi resmi LIRENXIN API.
                  </p>
                </div>
              </section>

              {/* Formal Footer Attribution */}
              <div className="mt-8 pt-6 border-t-2 border-black dark:border-[#FFE600] text-xs font-mono font-bold text-black dark:text-[#FFE600]">
                © 2026 LIRENXIN API — Privacy & Data Protection.
              </div>
            </article>
          )}

        </main>
      </div>

    </div>
  );
};
