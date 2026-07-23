import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { closeAuthModal } from "@/redux/features/authSlice";
import { X, Lock } from "lucide-react";
import Link from "next/link";

export default function AuthModal() {
  const dispatch = useDispatch();
  const { isAuthModalOpen, authModalMessage } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);
  const [callbackUrl, setCallbackUrl] = useState("");

  useEffect(() => {
    if (isAuthModalOpen && typeof window !== "undefined") {
      setCallbackUrl(window.location.pathname + window.location.search);
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl border ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
        } animate-scale-up`}
      >
        <button 
          onClick={() => dispatch(closeAuthModal())}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
            isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
          }`}
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 mb-4 dark:bg-blue-900/30 dark:text-blue-400">
            <Lock size={32} />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            Sign In Required
          </h2>
          <p className={`text-sm px-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {authModalMessage || "Please sign in to continue with this action."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link 
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            onClick={() => dispatch(closeAuthModal())}
            className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Sign In
          </Link>
          <Link 
            href="/register"
            onClick={() => dispatch(closeAuthModal())}
            className={`w-full flex items-center justify-center py-3 px-4 font-bold rounded-xl transition-all border ${
              isDark 
                ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
