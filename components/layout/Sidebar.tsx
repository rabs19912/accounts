"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, LogOut, Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";

interface Props {
  userName: string;
  userEmail: string;
  userInitials: string;
}

const NAV_ITEMS = [
  { href: "/home", label: "Inicio", icon: Home },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function Sidebar({ userName, userEmail, userInitials }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || (href !== "/home" && pathname.startsWith(href));
  }

  const content = (
    <div className="flex h-full flex-col bg-slate-900">
      <div className="border-b border-white/10 px-5 py-5">
        <span className="text-lg font-bold text-sky-400">Accounts</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              isActive(href)
                ? "bg-white/10 font-medium text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white/90"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-400 text-xs font-semibold text-slate-900">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white/90">{userName}</p>
            <p className="truncate text-xs text-white/40">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-56">{content}</div>
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-md lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-56">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-white/60 hover:text-white"
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
