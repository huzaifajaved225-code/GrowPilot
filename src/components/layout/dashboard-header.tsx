import * as React from "react";
import { Sparkles } from "lucide-react";

import { siteConfig } from "@/config/site";
import { MobileMenuButton } from "@/components/layout/sidebar";
import { SignOutButton } from "@/components/layout/sign-out-button";

interface DashboardHeaderProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}

export function DashboardHeader({
  userName,
  userEmail,
  userImage,
}: DashboardHeaderProps): React.JSX.Element {
  const initials = userName?.charAt(0)?.toUpperCase() ?? userEmail?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6 lg:px-8">
      {/* Left: mobile menu toggle + branding (mobile only) */}
      <div className="flex items-center gap-3">
        <MobileMenuButton />
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-heading text-sm font-semibold">{siteConfig.name}</span>
        </div>
      </div>

      {/* Right: user menu */}
      <div className="flex items-center gap-2">
        {/* User avatar + name (hidden on very small screens) */}
        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right">
            <p className="text-sm font-medium leading-tight">{userName ?? "User"}</p>
            {userEmail ? (
              <p className="text-xs leading-tight text-muted-foreground">{userEmail}</p>
            ) : null}
          </div>
          {userImage ? (
            <div
              className="h-8 w-8 rounded-full bg-cover bg-center"
              style={{ backgroundImage: `url(${userImage})` }}
              role="img"
              aria-label={userName ?? "User"}
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {initials}
            </div>
          )}
        </div>

        {/* Sign-out button */}
        <SignOutButton />
      </div>
    </header>
  );
}
