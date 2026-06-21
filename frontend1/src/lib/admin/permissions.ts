export type AdminRole = 'head' | 'caller' | 'coordinator';

export interface AdminUser {
  userId: string;
  email: string;
  role: AdminRole;
  isSuperAdmin: boolean;
  jumpedIn?: boolean;
}

export const PERMISSIONS = {
  MANAGE_USERS: 'MANAGE_USERS',
  VIEW_AUDIT_LOG: 'VIEW_AUDIT_LOG',
  MANAGE_DRIVES: 'MANAGE_DRIVES',
  APPROVE_DOCUMENTS: 'APPROVE_DOCUMENTS',
  VIEW_ALL_COMPANIES: 'VIEW_ALL_COMPANIES',
  EDIT_COMPANIES: 'EDIT_COMPANIES',
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(user: AdminUser | null, permission: Permission): boolean {
  if (!user) return false;

  // Super Admins have all permissions, UNLESS they are jumped in.
  if (user.isSuperAdmin && !user.jumpedIn) {
    return true;
  }

  // When jumped in, or for normal admins, evaluate based on role.
  const activeRole = user.role;

  switch (permission) {
    case PERMISSIONS.MANAGE_USERS:
    case PERMISSIONS.VIEW_AUDIT_LOG:
      // Only Super Admins (not jumped in) can manage users or view audit logs
      return false;

    case PERMISSIONS.VIEW_ALL_COMPANIES:
    case PERMISSIONS.EDIT_COMPANIES:
      return ['head', 'coordinator', 'caller'].includes(activeRole);

    case PERMISSIONS.APPROVE_DOCUMENTS:
    case PERMISSIONS.MANAGE_DRIVES:
      // Coordinators and callers (and Head TPO jumped in) can manage drives & approve routine docs
      return ['head', 'coordinator', 'caller'].includes(activeRole);

    default:
      return false;
  }
}
