import type { OrgRole } from "@prisma/client";

export type OrgAction =
  | "project:create"
  | "project:update"
  | "project:delete"
  | "member:invite"
  | "member:remove"
  | "member:role:update"
  | "billing:manage"
  | "content:create"
  | "content:publish"
  | "content:delete"
  | "integration:connect"
  | "integration:disconnect"
  | "organization:update"
  | "organization:delete";

/**
 * Permission matrix: which OrgRole values may perform which action.
 * This is the single source of truth for authorization decisions and
 * must be consulted server-side (route handlers / services) — a
 * client-side check is a UX nicety only, never a security boundary.
 */
const PERMISSION_MATRIX: Record<OrgAction, OrgRole[]> = {
  "project:create": ["OWNER", "ADMIN"],
  "project:update": ["OWNER", "ADMIN"],
  "project:delete": ["OWNER"],
  "member:invite": ["OWNER", "ADMIN"],
  "member:remove": ["OWNER", "ADMIN"],
  "member:role:update": ["OWNER"],
  "billing:manage": ["OWNER"],
  "content:create": ["OWNER", "ADMIN", "MEMBER"],
  "content:publish": ["OWNER", "ADMIN"],
  "content:delete": ["OWNER", "ADMIN"],
  "integration:connect": ["OWNER", "ADMIN"],
  "integration:disconnect": ["OWNER", "ADMIN"],
  "organization:update": ["OWNER"],
  "organization:delete": ["OWNER"],
};

export function can(role: OrgRole | null | undefined, action: OrgAction): boolean {
  if (!role) return false;
  return PERMISSION_MATRIX[action].includes(role);
}

export function assertCan(role: OrgRole | null | undefined, action: OrgAction): void {
  if (!can(role, action)) {
    throw new PermissionDeniedError(action);
  }
}

export class PermissionDeniedError extends Error {
  public readonly action: OrgAction;

  constructor(action: OrgAction) {
    super(`Permission denied for action: ${action}`);
    this.name = "PermissionDeniedError";
    this.action = action;
  }
}
