import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroHome } from './components/HeroHome';
import { DocsView } from './components/DocsView';
import { Footer } from './components/Footer';
import { WaterRippleCanvas } from './components/WaterRippleCanvas';
import { TermsPage, TermsSection } from './components/TermsPage';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'home' | 'docs' | 'terms'>('home');
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('health-check');
  const [selectedTermsSection, setSelectedTermsSection] = useState<TermsSection>('tos');
  // Default theme is ALWAYS white/light mode (setiap buka ulang kembali putih)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Sync dark class on document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleGoToDocs = (endpointId?: string) => {
    if (endpointId) {
      setSelectedEndpointId(endpointId);
    }
    setActiveTab('docs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToTerms = (section?: TermsSection) => {
    if (section) {
      setSelectedTermsSection(section);
    }
    setActiveTab('terms');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToHome = () => {
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-grid-pattern text-[#121212] dark:text-[#F3F4F6] transition-colors duration-200">
      {/* Clean Top Navigation: Brand + Dark Mode + Docs Button */}
      <Navbar
        onGoHome={handleGoToHome}
        onGoDocs={() => handleGoToDocs()}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HeroHome onGoToDocs={handleGoToDocs} />
        )}
        {activeTab === 'docs' && (
          <DocsView
            initialEndpointId={selectedEndpointId}
            onGoHome={handleGoToHome}
          />
        )}
        {activeTab === 'terms' && (
          <TermsPage
            initialSection={selectedTermsSection}
            onGoHome={handleGoToHome}
            onGoToDocs={() => handleGoToDocs()}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onGoToDocs={handleGoToDocs} onGoToTerms={handleGoToTerms} />

      {/* Procedural Canvas Cursor & Liquid Ripple Click Waves */}
      <WaterRippleCanvas />
    </div>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
