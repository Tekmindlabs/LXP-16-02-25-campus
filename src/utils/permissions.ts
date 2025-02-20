export const Permissions = {
  // User permissions
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  
  // Role permissions
  ROLE_CREATE: "role:create",
  ROLE_READ: "role:read",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",
  ROLE_CAMPUS_ASSIGN: "role:campus-assign",
  
  // Permission management
  PERMISSION_MANAGE: "permission:manage",
  
  // System settings
  SETTINGS_MANAGE: "settings:manage",

  // Campus Management permissions
  CAMPUS_VIEW: "campus:view",
  CAMPUS_MANAGE: "campus:manage",
  CAMPUS_DELETE: "campus:delete",

  // Academic Calendar permissions
  ACADEMIC_CALENDAR_VIEW: "academic-calendar:view",
  ACADEMIC_CALENDAR_MANAGE: "academic-calendar:manage",
  ACADEMIC_YEAR_MANAGE: "academic-year:manage",
  EVENT_MANAGE: "event:manage",

  // Program Management permissions
  PROGRAM_VIEW: "program:view",
  PROGRAM_MANAGE: "program:manage",
  PROGRAM_DELETE: "program:delete",

  // Class Group Management permissions
  CLASS_GROUP_VIEW: "class-group:view",
  CLASS_GROUP_MANAGE: "class-group:manage",
  CLASS_GROUP_DELETE: "class-group:delete",

  // Class Management permissions
  CLASS_VIEW: "class:view",
  CLASS_MANAGE: "class:manage",
  CLASS_DELETE: "class:delete",
  CLASS_ASSIGN_TEACHERS: "class:assign-teachers",
  CLASS_ASSIGN_STUDENTS: "class:assign-students",

  // Gradebook permissions
  GRADEBOOK_VIEW: "gradebook:view",
  GRADEBOOK_OVERVIEW: "gradebook:overview",
  GRADEBOOK_MANAGE: "gradebook:manage",
  GRADE_ACTIVITY: "grade:activity",
  GRADE_MODIFY: "grade:modify",

  // Subject Management permissions
  SUBJECT_VIEW: "subject:view",
  SUBJECT_MANAGE: "subject:manage",
  SUBJECT_DELETE: "subject:delete",
  SUBJECT_ASSIGN_TEACHERS: "subject:assign-teachers",
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

export enum DefaultRoles {
  ADMIN = "admin",
  SUPER_ADMIN = "super-admin",
  CAMPUS_ADMIN = "campus-admin",
  TEACHER = "teacher",
  STUDENT = "student",
  PARENT = "parent",
  COORDINATOR = "coordinator"
}

export const COORDINATOR_PERMISSIONS = {
  VIEW_COORDINATORS: "VIEW_COORDINATORS",
  MANAGE_COORDINATORS: "MANAGE_COORDINATORS",
  VIEW_COORDINATOR_STUDENTS: "VIEW_COORDINATOR_STUDENTS",
  MANAGE_COORDINATOR_HIERARCHY: "MANAGE_COORDINATOR_HIERARCHY",
  ASSIGN_PROGRAMS: "ASSIGN_PROGRAMS",
  TRANSFER_COORDINATOR: "TRANSFER_COORDINATOR",
} as const;

export const hasRole = (userRoles: string[], role: DefaultRoles) => {
  return userRoles.includes(role);
};

export const hasAnyRole = (userRoles: string[], roles: DefaultRoles[]) => {
  return roles.some(role => userRoles.includes(role));
};

export const RolePermissions: Record<DefaultRoles, Permission[]> = {
  [DefaultRoles.SUPER_ADMIN]: [
    ...Object.values(Permissions),
  ],
  [DefaultRoles.ADMIN]: [
    Permissions.USER_CREATE,
    Permissions.USER_READ,
    Permissions.USER_UPDATE,
    Permissions.USER_DELETE,
    Permissions.ROLE_READ,
    Permissions.SETTINGS_MANAGE,
    Permissions.CLASS_GROUP_VIEW,
    Permissions.CLASS_GROUP_MANAGE,
    Permissions.GRADEBOOK_VIEW,
    Permissions.GRADEBOOK_OVERVIEW,
    Permissions.GRADEBOOK_MANAGE,
    Permissions.GRADE_ACTIVITY,
    Permissions.GRADE_MODIFY,
    Permissions.CAMPUS_VIEW,
  ],
  [DefaultRoles.CAMPUS_ADMIN]: [
    Permissions.USER_READ,
    Permissions.USER_UPDATE,
    Permissions.ROLE_READ,
    Permissions.CAMPUS_VIEW,
    Permissions.CAMPUS_MANAGE,
    Permissions.CLASS_GROUP_VIEW,
    Permissions.CLASS_GROUP_MANAGE,
    Permissions.CLASS_VIEW,
    Permissions.CLASS_MANAGE,
    Permissions.CLASS_ASSIGN_TEACHERS,
    Permissions.CLASS_ASSIGN_STUDENTS,
    Permissions.GRADEBOOK_VIEW,
    Permissions.GRADEBOOK_OVERVIEW,
    Permissions.GRADEBOOK_MANAGE,
    Permissions.SUBJECT_VIEW,
    Permissions.SUBJECT_MANAGE,
    Permissions.SUBJECT_ASSIGN_TEACHERS,
  ],
  [DefaultRoles.COORDINATOR]: [
    Permissions.USER_READ,
    Permissions.CLASS_GROUP_VIEW,
    Permissions.CLASS_VIEW,
    Permissions.GRADEBOOK_VIEW,
    Permissions.GRADEBOOK_OVERVIEW,
    Permissions.SUBJECT_VIEW,
  ],
  [DefaultRoles.TEACHER]: [
    Permissions.USER_READ,
    Permissions.CLASS_VIEW,
    Permissions.GRADEBOOK_VIEW,
    Permissions.GRADEBOOK_MANAGE,
    Permissions.GRADE_ACTIVITY,
    Permissions.GRADE_MODIFY,
    Permissions.SUBJECT_VIEW,
  ],
  [DefaultRoles.STUDENT]: [
    Permissions.USER_READ,
    Permissions.CLASS_VIEW,
    Permissions.GRADEBOOK_VIEW,
  ],
  [DefaultRoles.PARENT]: [
    Permissions.USER_READ,
    Permissions.CLASS_VIEW,
    Permissions.GRADEBOOK_VIEW,
  ],
};

export function hasPermission(session: Session | null, permission: keyof typeof COORDINATOR_PERMISSIONS): boolean {
  if (!session?.user?.role) return false;

  // Add your permission checking logic here based on your role system
  const permissionMap = {
    SUPER_ADMIN: Object.values(COORDINATOR_PERMISSIONS),
    ADMIN: [
      COORDINATOR_PERMISSIONS.VIEW_COORDINATOR_STUDENTS,
      COORDINATOR_PERMISSIONS.ASSIGN_PROGRAMS,
    ],
    // Add other roles as needed
  };

  return permissionMap[session.user.role]?.includes(permission) ?? false;
}
