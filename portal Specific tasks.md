Based on the provided codebase, I'll analyze the current implementation and identify where campus role permissions need to be adjusted to align with the intended design.

Current Implementation Issues:

1. Over-permissive Campus Role Permissions:
```typescript
// From /types/campus.ts
export enum CampusPermission {
  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_PROGRAMS = "MANAGE_PROGRAMS", // Should be removed for campus roles
  MANAGE_CLASSES = "MANAGE_CLASSES",
  MANAGE_CLASSROOMS = "MANAGE_CLASSROOMS",
  VIEW_ANALYTICS = "VIEW_ANALYTICS",
  MANAGE_SETTINGS = "MANAGE_SETTINGS"
}
```

2. Campus Role Service Implementation:
```typescript
// From /server/services/CampusUserService.ts
export class CampusUserService {
  // Currently allows assigning any permission to campus roles
  async assignCampusRole(userId: string, campusId: string, role: CampusRole) {
    // No validation to prevent program/classgroup management permissions
  }
}
```

3. API Router Implementation:
```typescript
// From /server/api/routers/campus.ts
export const campusRouter = createTRPCRouter({
  // Currently allows campus roles to manage programs and class groups
  // Should be restricted to only viewing inherited programs/groups
});
```

Recommended Changes:

1. Update Permission Structure:
```typescript
export enum CampusPermission {
  // Campus-specific permissions
  MANAGE_CAMPUS_CLASSES = "MANAGE_CAMPUS_CLASSES",
  MANAGE_CAMPUS_TEACHERS = "MANAGE_CAMPUS_TEACHERS",
  MANAGE_CAMPUS_STUDENTS = "MANAGE_CAMPUS_STUDENTS",
  MANAGE_CAMPUS_TIMETABLES = "MANAGE_CAMPUS_TIMETABLES",
  MANAGE_CAMPUS_ATTENDANCE = "MANAGE_CAMPUS_ATTENDANCE",
  VIEW_CAMPUS_ANALYTICS = "VIEW_CAMPUS_ANALYTICS",
  
  // Read-only permissions for inherited items
  VIEW_PROGRAMS = "VIEW_PROGRAMS",
  VIEW_CLASS_GROUPS = "VIEW_CLASS_GROUPS"
}
```

2. Update Role Service:
```typescript
export class CampusUserService {
  private readonly allowedCampusPermissions = [
    CampusPermission.MANAGE_CAMPUS_CLASSES,
    CampusPermission.MANAGE_CAMPUS_TEACHERS,
    CampusPermission.MANAGE_CAMPUS_STUDENTS,
    CampusPermission.MANAGE_CAMPUS_TIMETABLES,
    CampusPermission.MANAGE_CAMPUS_ATTENDANCE,
    CampusPermission.VIEW_CAMPUS_ANALYTICS,
    CampusPermission.VIEW_PROGRAMS,
    CampusPermission.VIEW_CLASS_GROUPS
  ];

  async assignCampusRole(userId: string, campusId: string, role: CampusRole) {
    // Validate permissions against allowed list
    const validPermissions = role.permissions.filter(
      perm => this.allowedCampusPermissions.includes(perm)
    );

    // Only assign valid permissions
    await this.db.$executeRaw`
      INSERT INTO campus_roles (user_id, campus_id, role, permissions)
      VALUES (${userId}, ${campusId}, ${role.name}, ${validPermissions})
    `;
  }
}
```

3. Update API Routers:
```typescript
// campus-class.ts
export const campusClassRouter = createTRPCRouter({
  create: protectedProcedure
    .input(classCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const hasPermission = await ctx.userService.hasPermission(
        ctx.session.userId,
        input.campusId,
        CampusPermission.MANAGE_CAMPUS_CLASSES
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      // Create class logic
    }),
    
  // Add endpoints for managing teachers, students, timetables, attendance
});
```

4. Implement Read-only Views:
```typescript
// For inherited programs and class groups
export const campusViewRouter = createTRPCRouter({
  getInheritedPrograms: protectedProcedure
    .input(z.object({ campusId: z.string() }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await ctx.userService.hasPermission(
        ctx.session.userId,
        input.campusId,
        CampusPermission.VIEW_PROGRAMS
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      return ctx.prisma.program.findMany({
        where: {
          campuses: {
            some: {
              id: input.campusId
            }
          }
        }
      });
    }),
    
  getInheritedClassGroups: protectedProcedure
    .input(z.object({ campusId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Similar implementation for class groups
    })
});
```

5. Update Class Service:
```typescript
// From CampusClassService.ts
export class CampusClassService {
  async createClass(userId: string, campusId: string, data: ClassCreateInput) {
    const hasPermission = await this.userService.hasPermission(
      userId,
      campusId,
      CampusPermission.MANAGE_CAMPUS_CLASSES
    );

    if (!hasPermission) {
      throw new Error("User does not have permission to create classes");
    }

    // Validate that class group is inherited
    const isInheritedClassGroup = await this.validateInheritedClassGroup(
      campusId,
      data.classGroupId
    );

    if (!isInheritedClassGroup) {
      throw new Error("Cannot create class for non-inherited class group");
    }

    // Create class logic
  }

  private async validateInheritedClassGroup(
    campusId: string,
    classGroupId: string
  ): Promise<boolean> {
    const classGroup = await this.db.classGroup.findFirst({
      where: {
        id: classGroupId,
        program: {
          campuses: {
            some: {
              id: campusId
            }
          }
        }
      }
    });
    
    return !!classGroup;
  }
}
```

These changes will:
1. Restrict campus roles to only managing classes, teachers, students, timetables, and attendance
2. Provide read-only access to inherited programs and class groups
3. Prevent creation of new programs or class groups at the campus level
4. Ensure classes can only be created within inherited class groups
5. Maintain proper separation of concerns between campus and program-level management

The implementation should focus on:
1. Managing campus-specific entities (classes, teachers, students)
2. Viewing and utilizing inherited structures (programs, class groups)
3. Managing operational aspects (timetables, attendance)
4. Maintaining proper access control and validation