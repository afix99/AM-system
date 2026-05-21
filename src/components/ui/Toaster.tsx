"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

type Toast = { id: string; message: string; type: "success" | "error" };
type ToastContextType = { toast: (message: string, type?: "success" | "error") => void };

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium toast-enter pointer-events-auto backdrop-blur-sm ${
              t.type === "success"
                ? "bg-stone-900/95 border-[#D97756]/30 text-stone-200"
                : "bg-stone-900/95 border-red-500/30 text-red-300"
            }`}
          >
            {t.type === "success"
              ? <CheckCircle size={16} className="text-[#D97756] shrink-0" />
              : <XCircle size={16} className="text-red-400 shrink-0" />}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-stone-500 hover:text-stone-300 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
