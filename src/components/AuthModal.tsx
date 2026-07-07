import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Lock, User, AlertCircle, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, user: { id: string; username: string }) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!username.trim() || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    const endpoint = activeTab === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed. Please try again.");
      }

      onAuthSuccess(data.token, data.user);
      onClose();
      // Reset fields
      setUsername("");
      setPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="auth-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            id="auth-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            id="auth-modal-card"
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-lg bg-[#0c0a09] p-6 shadow-2xl border border-stone-800"
          >
            {/* Close Button */}
            <button
              id="auth-modal-close"
              onClick={onClose}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-200 rounded p-1 hover:bg-stone-900 transition-all cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Header */}
            <div className="mb-6 mt-2 text-center">
              <h2 className="font-serif text-2xl font-medium tracking-tight text-stone-100">
                Welcome to The Inkwell
              </h2>
              <p className="font-sans text-xs text-stone-400 mt-1">
                {activeTab === "login"
                  ? "Sign in to join the discussion and share your thoughts"
                  : "Create an account to start writing and commenting"}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-800 mb-6">
              <button
                id="tab-login-btn"
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setError(null);
                }}
                className={`flex-1 py-2 text-center font-sans text-sm font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === "login"
                    ? "border-stone-200 text-stone-100"
                    : "border-transparent text-stone-500 hover:text-stone-300"
                }`}
              >
                Log In
              </button>
              <button
                id="tab-register-btn"
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setError(null);
                }}
                className={`flex-1 py-2 text-center font-sans text-sm font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === "register"
                    ? "border-stone-200 text-stone-100"
                    : "border-transparent text-stone-500 hover:text-stone-300"
                }`}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div
                  id="auth-error-banner"
                  className="flex items-start space-x-2 rounded border border-red-900/40 bg-red-950/10 p-3 text-sm text-red-400"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="font-sans">{error}</span>
                </div>
              )}

              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-stone-500 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-600">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="auth-username-input"
                    type="text"
                    required
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded border border-stone-800 bg-[#080706] py-2.5 pl-10 pr-4 font-sans text-sm text-stone-200 placeholder-stone-600 focus:border-stone-600 focus:outline-none transition-colors"
                  />
                </div>
                {activeTab === "register" && (
                  <p className="text-[11px] text-stone-500 mt-1 font-sans">
                    Must be at least 3 characters.
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-stone-500 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-600">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="auth-password-input"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded border border-stone-800 bg-[#080706] py-2.5 pl-10 pr-4 font-sans text-sm text-stone-200 placeholder-stone-600 focus:border-stone-600 focus:outline-none transition-colors"
                  />
                </div>
                {activeTab === "register" && (
                  <p className="text-[11px] text-stone-500 mt-1 font-sans">
                    Must be at least 6 characters.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 rounded bg-stone-100 py-3 font-sans text-sm font-semibold text-stone-900 hover:bg-stone-200 disabled:bg-stone-900/40 disabled:text-stone-600 disabled:border disabled:border-stone-800 focus:outline-none transition-all cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : activeTab === "login" ? (
                  <span>Log In</span>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
