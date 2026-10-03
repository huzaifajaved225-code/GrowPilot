"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

/**
 * Interactive sign-out control. Extracted as a Client Component because
 * signOut() from next-auth/react requires browser APIs — the dashboard
 * header stays a Server Component and renders this instead.
 */
export function SignOutButton(): React.JSX.Element {
  const handleSignOut = async (): Promise<void> => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
