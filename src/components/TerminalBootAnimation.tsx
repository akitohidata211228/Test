import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

interface TerminalLogLine {
  id: number;
  time: string;
  type?: 'INFO' | 'OK' | 'URL';
  text: string;
  extra?: string;
}

export const TerminalBootAnimation: React.FC = () => {
  const [typedCommand, setTypedCommand] = useState('');
  const [visibleLines, setVisibleLines] = useState<TerminalLogLine[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const fullCommand = 'npm run api';

  const logLines: TerminalLogLine[] = [
    { id: 1, time: '00:11:14', type: 'INFO', text: 'Waking up the engine...' },
    { id: 2, time: '00:11:14', type: 'OK', text: 'YTUltra & Cuki AIO linked' },
    { id: 3, time: '00:11:14', type: 'OK', text: 'Fallback scrapers armed (wowdl, snapdl, threadsdl)' },
    { id: 4, time: '00:11:14', type: 'OK', text: '11 platform proxy mounted', extra: '(tiktok → threads)' },
    { id: 5, time: '00:11:14', type: 'INFO', text: 'Stats persistence enabled', extra: '(stats.json)' },
    { id: 6, time: '00:11:14', type: 'URL', text: 'https://lirenxin-api.my.id/ online' },
  ];

  useEffect(() => {
    setTypedCommand('');
    setVisibleLines([]);
    setIsCompleted(false);

    let typingTimer: NodeJS.Timeout;
    let logTimer: NodeJS.Timeout;
    let initialTimer: NodeJS.Timeout;

    // Small initial pause before typing starts
    initialTimer = setTimeout(() => {
      let currentTyped = '';
      let charIndex = 0;

      // Natural, deliberate typing of "npm run api" (~100ms per char)
      typingTimer = setInterval(() => {
        if (charIndex < fullCommand.length) {
          currentTyped += fullCommand[charIndex];
          setTypedCommand(currentTyped);
          charIndex++;
        } else {
          clearInterval(typingTimer);

          // Phase 2: Pause 550ms after command before server begins outputting logs
          setTimeout(() => {
            let lineIndex = 0;
            // Phase 3: Server boot sequence
            logTimer = setInterval(() => {
              if (lineIndex < logLines.length) {
                const nextLine = logLines[lineIndex];
                setVisibleLines((prev) => [...prev, nextLine]);
                lineIndex++;
              } else {
                clearInterval(logTimer);
                setIsCompleted(true);
              }
            }, 650);
          }, 550);
        }
      }, 100);
    }, 350);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(typingTimer);
      clearInterval(logTimer);
    };
  }, []);

  return (
    <div className="border-3 border-black dark:border-[#FFE600] bg-[#0A0D14] text-white shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#FFE600] overflow-hidden w-full font-mono transition-colors">
      
      {/* Title Bar in Neo-Brutalist Electric Blue or Kuning Menyala in Dark Mode */}
      <div className="bg-[#1E5CD9] dark:bg-black text-white dark:text-[#FFE600] px-4 py-2.5 border-b-2 border-black dark:border-[#FFE600] flex items-center justify-between font-bold text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 border border-black dark:border-[#FFE600] bg-[#FF5E5E]"></span>
          <span className="w-3 h-3 border border-black dark:border-[#FFE600] bg-[#FFE600]"></span>
          <span className="w-3 h-3 border border-black dark:border-[#FFE600] bg-[#5EADF2] dark:bg-black"></span>
          <span className="ml-1 tracking-tight font-black text-white dark:text-[#FFE600]">
            BASH // root@lirenxin:~/RestApi
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-black px-2 py-0.5 border border-black dark:border-[#FFE600] ${
            isCompleted 
              ? 'bg-[#5EADF2] dark:bg-[#FFE600] text-black' 
              : 'bg-black text-[#5EADF2] dark:text-[#FFE600]'
          }`}>
            {isCompleted ? 'ONLINE' : 'BOOTING...'}
          </span>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="p-4 sm:p-5 text-xs sm:text-sm min-h-[260px] max-h-[340px] overflow-y-auto space-y-2 selection:bg-[#FFE600] selection:text-black leading-relaxed">
        
        {/* Command Prompt Line */}
        <div className="flex flex-wrap items-center gap-x-1.5 text-neutral-300">
          <span className="text-[#5EADF2] dark:text-[#FFE600] font-bold">root@lirenxin</span>
          <span className="text-neutral-400">:</span>
          <span className="text-[#FFE600] font-bold">~/RestApi</span>
          <span className="text-white font-bold">$</span>
          <span className="text-white font-black">{typedCommand}</span>
          {!visibleLines.length && (
            <span className="inline-block w-2 h-4 bg-[#5EADF2] dark:bg-[#FFE600] animate-cursor-blink ml-0.5"></span>
          )}
        </div>

        {/* Animated Log Output Lines */}
        <div className="space-y-1.5 pt-1">
          {visibleLines.map((line) => {
            if (line.type === 'URL') {
              return (
                <div
                  key={line.id}
                  className="animate-in fade-in slide-in-from-left-2 duration-150 flex items-center gap-2"
                >
                  <span className="text-neutral-500 font-normal">[{line.time}]</span>
                  <a
                    href="https://lirenxin-api.my.id/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-white dark:text-[#FFE600] hover:text-[#5EADF2] font-bold flex items-center gap-1.5"
                  >
                    <span>{line.text}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            }

            return (
              <div
                key={line.id}
                className="animate-in fade-in slide-in-from-left-2 duration-150 flex items-center gap-2"
              >
                <span className="text-neutral-500 font-normal">[{line.time}]</span>
                
                {line.type === 'INFO' && (
                  <span className="text-[#5EADF2] dark:text-[#FFE600] font-black tracking-wide">
                    INFO
                  </span>
                )}

                {line.type === 'OK' && (
                  <span className="text-[#38ef7d] dark:text-[#FFE600] font-black tracking-wide">
                    OK
                  </span>
                )}

                <span className="text-neutral-200 font-medium">
                  {line.text}
                </span>

                {line.extra && (
                  <span className="text-[#FFE600] font-black">
                    {line.extra}
                  </span>
                )}
              </div>
            );
          })}

          {/* Trailing Active Prompt when finished */}
          {isCompleted && (
            <div className="pt-2 flex items-center gap-1.5 text-neutral-400 animate-in fade-in duration-200">
              <span className="text-[#5EADF2] dark:text-[#FFE600] font-bold">root@lirenxin</span>
              <span className="text-neutral-500">:</span>
              <span className="text-[#FFE600] font-bold">~/RestApi</span>
              <span className="text-white font-bold">$</span>
              <span className="inline-block w-2 h-4 bg-[#5EADF2] dark:bg-[#FFE600] animate-cursor-blink"></span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
