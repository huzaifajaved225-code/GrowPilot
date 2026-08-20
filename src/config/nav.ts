export interface NavItem {
  title: string;
  href: string;
  icon: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Icon names reference `lucide-react` component names and are resolved
 * to actual components in `components/layout/sidebar.tsx` (Phase 3),
 * keeping this config file free of JSX/React imports.
 */
export const dashboardNav: NavSection[] = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" }],
  },
  {
    title: "Growth",
    items: [
      { title: "SEO", href: "/seo", icon: "Search" },
      { title: "GEO", href: "/geo", icon: "Sparkles" },
      { title: "AEO", href: "/aeo", icon: "MessageCircleQuestion" },
      { title: "Content", href: "/content", icon: "FileText" },
      { title: "Analytics", href: "/analytics", icon: "BarChart3" },
    ],
  },
  {
    title: "Presence",
    items: [
      { title: "Google Business Profile", href: "/gbp", icon: "MapPin" },
      { title: "Social Media", href: "/social", icon: "Share2" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { title: "Projects", href: "/projects", icon: "FolderKanban" },
      { title: "Team", href: "/team", icon: "Users" },
      { title: "Billing", href: "/billing", icon: "CreditCard" },
      { title: "Settings", href: "/settings", icon: "Settings" },
    ],
  },
];
