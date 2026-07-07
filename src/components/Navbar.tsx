import { Search, PenSquare, LogOut, LogIn, User, BookOpen } from "lucide-react";
import { User as UserType } from "../types";

interface NavbarProps {
  user: UserType | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAuthModal: () => void;
  onOpenFormModal: () => void;
  onLogout: () => void;
  onGoHome: () => void;
}

export default function Navbar({
  user,
  searchQuery,
  setSearchQuery,
  onOpenAuthModal,
  onOpenFormModal,
  onLogout,
  onGoHome
}: NavbarProps) {
  return (
    <header id="app-header" className="sticky top-0 z-40 w-full border-b border-stone-800 bg-[#0c0a09]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div
          id="brand-logo"
          onClick={onGoHome}
          className="flex cursor-pointer items-center space-x-3 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-900 border border-stone-800 text-stone-300 transition-transform group-hover:scale-105">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-tight text-stone-100">
              The Inkwell
            </h1>
            <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-stone-500 font-medium">
              Verse & Manuscript
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div id="search-container" className="hidden max-w-xs flex-1 px-4 md:block">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-600">
              <Search className="h-4 w-4" />
            </div>
            <input
              id="nav-search-input"
              type="text"
              placeholder="Search manuscripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-stone-800 bg-[#080706] py-1.5 pl-9 pr-4 font-sans text-sm text-stone-200 placeholder-stone-600 focus:border-stone-600 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div id="nav-actions" className="flex items-center space-x-3">
          {user ? (
            <>
              {/* Write Post Button */}
              <button
                id="btn-create-post"
                onClick={onOpenFormModal}
                className="flex items-center space-x-1.5 rounded bg-stone-100 px-4 py-2 font-sans text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-200 focus:outline-none transition-all cursor-pointer"
              >
                <PenSquare className="h-3.5 w-3.5" />
                <span>Write</span>
              </button>

              {/* User profile dropdown & Logout */}
              <div id="user-menu" className="flex items-center space-x-3 border-l border-stone-800 pl-3">
                <div className="hidden flex-col items-end sm:flex">
                  <span className="font-sans text-xs font-semibold text-stone-300">
                    {user.username}
                  </span>
                  <span className="font-sans text-[9px] text-stone-500 uppercase tracking-widest">
                    Author
                  </span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded bg-stone-900 border border-stone-800 text-stone-400">
                  <User className="h-4 w-4" />
                </div>
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Sign Out"
                  className="rounded p-1.5 text-stone-500 hover:bg-stone-900 hover:text-stone-200 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
            ) : (
              <button
                id="btn-login-trigger"
                onClick={onOpenAuthModal}
                className="flex items-center space-x-1.5 rounded border border-stone-800 bg-stone-900/30 px-4 py-2 font-sans text-xs font-semibold text-stone-300 shadow-sm hover:bg-stone-900 hover:text-stone-100 focus:outline-none transition-all cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
      </div>
    </header>
  );
}
