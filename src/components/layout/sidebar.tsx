"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Code,
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageCircleQuestion,
  Search,
  Settings,
  Share2,
  Sparkles,
  Users,
  UserCheck,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { dashboardNav, type NavItem, type NavSection } from "@/config/nav";
import { siteConfig } from "@/config/site";

/* ──────────────────────────────────────────────
   Icon resolver — maps string names from nav config
   to actual lucide-react components.
   ────────────────────────────────────────────── */

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Search,
  Sparkles,
  MessageCircleQuestion,
  FileText,
  BarChart3,
  MapPin,
  Share2,
  FolderKanban,
  Users,
  UserCheck,
  CreditCard,
  Settings,
  Code,
};

function resolveIcon(name: string): LucideIcon | null {
  return iconMap[name] ?? null;
}

/* ──────────────────────────────────────────────
   Main sidebar component
   ────────────────────────────────────────────── */

interface DashboardSidebarProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}

export function DashboardSidebar({
  userName,
  userEmail,
}: DashboardSidebarProps): React.JSX.Element {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleSignOut = async (): Promise<void> => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r border-border bg-card">
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Brand */}
          <div className="flex h-16 items-center gap-3 border-b border-border px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight">
              {siteConfig.name}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
            {dashboardNav.map((section) => (
              <SidebarSection
                key={section.title}
                section={section}
                pathname={pathname}
              />
            ))}
          </nav>

          {/* User footer */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {userName?.charAt(0)?.toUpperCase() ??
                  userEmail?.charAt(0)?.toUpperCase() ??
                  "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">
                  {userName ?? "User"}
                </p>
                {userEmail ? (
                  <p className="truncate text-xs text-muted-foreground leading-tight">
                    {userEmail}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setMobileOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
          />

          {/* Slide-in panel */}
          <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-card shadow-xl">
            {/* Brand */}
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-heading text-lg font-semibold tracking-tight">
                  {siteConfig.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
              {dashboardNav.map((section) => (
                <SidebarSection
                  key={section.title}
                  section={section}
                  pathname={pathname}
                />
              ))}
            </nav>

            {/* User footer */}
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {userName?.charAt(0)?.toUpperCase() ??
                    userEmail?.charAt(0)?.toUpperCase() ??
                    "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">
                    {userName ?? "User"}
                  </p>
                  {userEmail ? (
                    <p className="truncate text-xs text-muted-foreground leading-tight">
                      {userEmail}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Mobile trigger (rendered inside DashboardHeader) ── */}
      {/* Exposed so the header can call setMobileOpen */}
      <MobileSidebarTrigger onOpen={() => setMobileOpen(true)} />
    </>
  );
}

/* ──────────────────────────────────────────────
   Section group within the sidebar
   ────────────────────────────────────────────── */

function SidebarSection({
  section,
  pathname,
}: {
  section: NavSection;
  pathname: string;
}): React.JSX.Element {
  return (
    <div className="mb-6">
      <h3 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {section.title}
      </h3>
      <div className="space-y-0.5">
        {section.items.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Individual nav link
   ────────────────────────────────────────────── */

function SidebarLink({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}): React.JSX.Element {
  const Icon = resolveIcon(item.icon);
  const disabled = item.isDisabled === true;

  if (disabled) {
    return (
      <div className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50">
        {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
        <span className="flex-1 truncate">{item.title}</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          Soon
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      <span className="flex-1 truncate">{item.title}</span>
    </Link>
  );
}

/* ──────────────────────────────────────────────
   Hidden helper — exposes mobile open callback
   so DashboardHeader can trigger it.
   Uses a custom DOM event to avoid prop drilling.
   ────────────────────────────────────────────── */

function MobileSidebarTrigger({
  onOpen,
}: {
  onOpen: () => void;
}): null {
  React.useEffect(() => {
    const handler = (): void => onOpen();
    window.addEventListener("growpilot:open-sidebar", handler);
    return () => {
      window.removeEventListener("growpilot:open-sidebar", handler);
    };
  }, [onOpen]);

  return null;
}

/** Opens the mobile sidebar (call from header button). */
export function openMobileSidebar(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("growpilot:open-sidebar"));
  }
}

/** Hamburger button for the dashboard header. */
export function MobileMenuButton(): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => openMobileSidebar()}
      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
      aria-label="Open navigation"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
