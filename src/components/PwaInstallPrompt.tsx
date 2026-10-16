import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Check, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for Chromium beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      setShowIosGuide(true);
    }
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  // Show banner if deferredPrompt is available or if on mobile iOS/Android
  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-3 py-2 text-xs shadow-md flex items-center justify-between gap-2 border-b border-blue-500">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Smartphone className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="truncate">
            <span className="font-bold">支援安裝至手機/電腦桌面：</span>
            <span className="text-blue-100 hidden sm:inline ml-1">
              全螢幕操作免開瀏覽器，斷網離線照常清點作業！
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 font-bold rounded-lg shadow-xs transition-all text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>安裝 App</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            aria-label="稍後再說"
            className="p-1 text-blue-200 hover:text-white rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS / General Install Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span>安裝 CheckHW 至手機桌面</span>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-blue-900">
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <Share className="w-4 h-4 text-blue-600" />
                  <span>iPhone / iPad (Safari 瀏覽器)：</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-blue-800">
                  <li>點擊 Safari 底部的「<span className="font-bold">分享</span>」圖示</li>
                  <li>向下滑動並點選「<span className="font-bold">加入主畫面</span>」</li>
                  <li>點擊右上角「<span className="font-bold">新增</span>」即完成！</li>
                </ol>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-900">
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-emerald-600" />
                  <span>Android / Chrome 電腦版：</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  點擊瀏覽器網址列右側的「安裝」圖示，或右上角選單 ➔ 點選「安裝 CheckHW」，即可像本機軟體般獨立視窗開啟。
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
};
