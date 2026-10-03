export interface NavItem {
  title: string;
  href: string;
  icon: string;
  /** When true the feature is not yet implemented; shown as disabled in the sidebar. */
  isDisabled?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Icon names reference `lucide-react` component names and are resolved
 * to actual components in `components/layout/sidebar.tsx`,
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
      { title: "SEO", href: "/dashboard/seo", icon: "Search" },
      { title: "GEO", href: "/dashboard/geo", icon: "Sparkles" },
      { title: "Schema", href: "/dashboard/schema", icon: "Code" },
      { title: "Lead Generation", href: "/dashboard/leads", icon: "UserCheck" },
      { title: "AEO", href: "/dashboard/aeo", icon: "MessageCircleQuestion", isDisabled: true },
      { title: "Content", href: "/dashboard/content", icon: "FileText", isDisabled: true },
      { title: "Analytics", href: "/dashboard/analytics", icon: "BarChart3", isDisabled: true },
    ],
  },
  {
    title: "Presence",
    items: [
      { title: "Google Business Profile", href: "/dashboard/gbp", icon: "MapPin", isDisabled: true },
      { title: "Social Media", href: "/dashboard/social", icon: "Share2", isDisabled: true },
    ],
  },
  {
    title: "Workspace",
    items: [
      { title: "Projects", href: "/dashboard/projects", icon: "FolderKanban", isDisabled: true },
      { title: "Team", href: "/dashboard/team", icon: "Users", isDisabled: true },
      { title: "Billing", href: "/dashboard/billing", icon: "CreditCard", isDisabled: true },
      { title: "Settings", href: "/dashboard/settings", icon: "Settings", isDisabled: true },
    ],
  },
];
