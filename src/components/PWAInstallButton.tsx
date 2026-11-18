import React, { useState } from 'react';
import { Download, Check, X, Laptop } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../utils/aacBoardLogic';

interface PWAInstallButtonProps {
  lang: Language;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return (
      <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 whitespace-nowrap shrink-0">
        <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
        {lang === 'es' ? 'App instalada' : 'Installed'}
      </span>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={lang === 'es' ? 'Instalar App en este dispositivo' : 'Install app on this device'}
        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
      >
        <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{lang === 'es' ? 'Instalar App' : 'Install App'}</span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Laptop className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
                <h2 id="pwa-install-title" className="text-lg font-bold text-slate-900 font-display">
                  {lang === 'es'
                    ? 'Instalar en Laptop Táctil o Tableta'
                    : 'Install on Touch Laptop or Tablet'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label={lang === 'es' ? 'Cerrar guía de instalación' : 'Close install guide'}
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700 leading-relaxed">
              {isIOS ? (
                <p>
                  {lang === 'es' ? (
                    <>
                      1. Toca el botón <strong>Compartir</strong> en la barra de Safari.<br />
                      2. Selecciona <strong>Agregar a la pantalla de inicio</strong> para usar PictoVoice a pantalla completa y sin internet.
                    </>
                  ) : (
                    <>
                      1. Tap the <strong>Share</strong> button in your Safari toolbar.<br />
                      2. Select <strong>Add to Home Screen</strong> to use PictoVoice full-screen and offline.
                    </>
                  )}
                </p>
              ) : (
                <>
                  <p>
                    {lang === 'es'
                      ? 'Esta aplicación cuenta con Service Worker activo para funcionar 100% sin conexión a internet.'
                      : 'This app has an active Service Worker so all 12 picture buttons and voices work 100% offline.'}
                  </p>
                  <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 text-slate-800 space-y-1.5">
                    <p className="font-semibold text-amber-950">
                      {lang === 'es'
                        ? 'En Chrome o Edge (Laptop Táctil):'
                        : 'On Chrome or Edge (Touch Laptop):'}
                    </p>
                    <p className="text-xs sm:text-sm">
                      {lang === 'es'
                        ? 'Haz clic en el icono de "Instalar PictoVoice" en el lado derecho de la barra de direcciones (o abre la aplicación en una pestaña nueva fuera de la vista previa).'
                        : 'Click the "Install PictoVoice" icon on the right side of your browser address bar (or open the app in a standalone tab outside the preview frame).'}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {lang === 'es' ? 'Entendido' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
