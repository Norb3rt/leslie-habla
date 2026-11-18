import React, { useRef, useState } from 'react';
import { Lock, X, Delete, KeyRound, CheckCircle2 } from 'lucide-react';
import { Language, verifyCaregiverPin } from '../utils/aacBoardLogic';

type PinModalMode = 'unlock' | 'verify-current' | 'enter-new';

interface PinLockModalProps {
  isOpen: boolean;
  lang: Language;
  expectedPin: string;
  onClose: () => void;
  onUnlockSuccess: () => void;
  onChangePin: (newPin: string) => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  lang,
  expectedPin,
  onClose,
  onUnlockSuccess,
  onChangePin,
}) => {
  const [mode, setMode] = useState<PinModalMode>('unlock');
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const modeRef = useRef<PinModalMode>('unlock');
  const enteredRef = useRef('');

  if (!isOpen) return null;

  const updateMode = (nextMode: PinModalMode) => {
    modeRef.current = nextMode;
    setMode(nextMode);
  };

  const updateEntered = (nextEntered: string) => {
    enteredRef.current = nextEntered;
    setEntered(nextEntered);
  };

  const resetAndClose = () => {
    updateMode('unlock');
    updateEntered('');
    setError(false);
    setStatusMessage(null);
    onClose();
  };

  const handleDigit = (digit: string) => {
    setError(false);
    setStatusMessage(null);
    if (enteredRef.current.length >= 4) return;
    const next = enteredRef.current + digit;
    updateEntered(next);

    if (next.length === 4) {
      const currentMode = modeRef.current;
      if (currentMode === 'unlock') {
        if (verifyCaregiverPin(next, expectedPin)) {
          updateEntered('');
          updateMode('unlock');
          setStatusMessage(null);
          onUnlockSuccess();
        } else {
          setError(true);
          setTimeout(() => {
            updateEntered('');
          }, 450);
        }
      } else if (currentMode === 'verify-current') {
        if (verifyCaregiverPin(next, expectedPin)) {
          updateEntered('');
          updateMode('enter-new');
        } else {
          setError(true);
          setTimeout(() => {
            updateEntered('');
          }, 450);
        }
      } else if (currentMode === 'enter-new') {
        onChangePin(next);
        updateEntered('');
        updateMode('unlock');
        setStatusMessage(
          lang === 'es'
            ? 'PIN actualizado. Usa tu nuevo PIN para desbloquear.'
            : 'PIN updated. Enter your new PIN to unlock.'
        );
      }
    }
  };

  const handleBackspace = () => {
    setError(false);
    updateEntered(enteredRef.current.slice(0, -1));
  };

  const titleText =
    mode === 'verify-current'
      ? lang === 'es'
        ? 'Ingresa el PIN actual'
        : 'Enter Current 4-Digit PIN'
      : mode === 'enter-new'
      ? lang === 'es'
        ? 'Ingresa el nuevo PIN'
        : 'Enter New 4-Digit PIN'
      : lang === 'es'
      ? 'Acceso para Adultos (PIN)'
      : 'Caregiver Access (4-Digit PIN)';

  const subtitleText =
    mode === 'verify-current'
      ? lang === 'es'
        ? 'Confirma tu PIN actual antes de cambiarlo'
        : 'Verify your current PIN before setting a new one'
      : mode === 'enter-new'
      ? lang === 'es'
        ? 'Elige un nuevo PIN de 4 dígitos'
        : 'Choose any new 4-digit PIN'
      : expectedPin === '1234'
      ? lang === 'es'
        ? 'Desbloquea "Voice & JSON" e "Install App" (PIN inicial: 1234)'
        : 'Unlocks "Voice & JSON" and "Install App" (Default PIN: 1234)'
      : lang === 'es'
      ? 'Desbloquea "Voice & JSON" e "Install App"'
      : 'Unlocks "Voice & JSON" and "Install App"';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              {mode === 'unlock' ? (
                <Lock className="w-5 h-5" aria-hidden="true" />
              ) : (
                <KeyRound className="w-5 h-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <h2 id="pin-modal-title" className="text-lg font-bold text-slate-900 font-display">
                {titleText}
              </h2>
              <p className="text-xs text-slate-500">{subtitleText}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label={lang === 'es' ? 'Cerrar PIN' : 'Close PIN modal'}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Digit Dots Display */}
        <div className="flex flex-col items-center gap-2">
          <div
            data-testid="pin-dots"
            className="flex items-center justify-center gap-3 py-2"
          >
            {[0, 1, 2, 3].map((idx) => {
              const filled = idx < entered.length;
              return (
                <div
                  key={idx}
                  className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-xl font-bold font-mono transition-colors ${
                    error
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : filled
                      ? 'border-amber-500 bg-amber-50 text-slate-900'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  {filled ? '●' : ''}
                </div>
              );
            })}
          </div>
          {error && (
            <p role="alert" className="text-xs font-bold text-rose-600">
              {lang === 'es' ? 'PIN incorrecto. Intenta de nuevo.' : 'Incorrect PIN. Try again.'}
            </p>
          )}
          {statusMessage && (
            <p
              data-testid="pin-status-message"
              className="text-xs font-bold text-emerald-700 flex items-center gap-1 text-center"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{statusMessage}</span>
            </p>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              aria-label={`PIN digit ${digit}`}
              className="min-h-[54px] rounded-2xl border border-slate-200 bg-slate-50 hover:bg-amber-50 active:scale-95 text-xl font-bold text-slate-900 font-mono transition-all cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              updateEntered('');
              setError(false);
            }}
            className="min-h-[54px] rounded-2xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            {lang === 'es' ? 'Borrar' : 'Clear'}
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            aria-label="PIN digit 0"
            className="min-h-[54px] rounded-2xl border border-slate-200 bg-slate-50 hover:bg-amber-50 active:scale-95 text-xl font-bold text-slate-900 font-mono transition-all cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label={lang === 'es' ? 'Borrar último dígito' : 'Backspace digit'}
            className="min-h-[54px] rounded-2xl border border-slate-200 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Change PIN Action Footer */}
        <div className="pt-1 border-t border-slate-100 flex items-center justify-center">
          {mode === 'unlock' ? (
            <button
              type="button"
              data-testid="change-pin-button"
              onClick={() => {
                updateEntered('');
                setError(false);
                setStatusMessage(null);
                updateMode('verify-current');
              }}
              className="min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
              <span>{lang === 'es' ? 'Cambiar PIN de 4 dígitos' : 'Change 4-digit PIN'}</span>
            </button>
          ) : (
            <button
              type="button"
              data-testid="cancel-change-pin-button"
              onClick={() => {
                updateEntered('');
                setError(false);
                updateMode('unlock');
              }}
              className="min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {lang === 'es' ? 'Cancelar cambio de PIN' : 'Cancel PIN change'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
