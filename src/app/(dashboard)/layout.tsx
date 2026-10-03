import * as React from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { DashboardSidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared authenticated layout for all /dashboard/* routes.
 *
 * - Fetches the session via NextAuth (server component).
 * - Renders the fixed sidebar + sticky header + scrollable content area.
 * - Middleware already protects these routes; the auth() call here
 *   provides session data for the sidebar/header user info.
 */
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps): Promise<React.JSX.Element> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed left sidebar (desktop) + mobile overlay */}
      <DashboardSidebar
        userName={session.user.name}
        userEmail={session.user.email}
        userImage={session.user.image}
      />

      {/* Main content area — offset on desktop to account for sidebar */}
      <div className="lg:pl-64">
        <DashboardHeader
          userName={session.user.name}
          userEmail={session.user.email}
          userImage={session.user.image}
        />
        <div className="animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
