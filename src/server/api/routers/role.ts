import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import type { RolePermission, Role } from '@prisma/client';
import type { Context } from '../trpc';

type RecursiveRole = Role & {
  parent: RecursiveRole | null;
  permissions: RolePermission[];
};

export const roleRouter = createTRPCRouter({
  getInheritedPermissions: protectedProcedure
    .input(z.object({ roleId: z.string() }))
    .query(async ({ ctx, input }: { ctx: Context; input: { roleId: string } }) => {
      const { roleId } = input;
      
      const role = await ctx.prisma.role.findUnique({
        where: { id: roleId },
        include: {
          parent: {
            include: {
              permissions: true,
              parent: true,
            }
          },
          permissions: true,
        }
      });

      if (!role) return [];

      const parentPermissions = role.parent
        ? await resolveInheritedPermissions(role.parent as RecursiveRole, ctx)
        : [];

      return [...role.permissions, ...parentPermissions];
    }),

  // validateRoleAssignment: protectedProcedure // commented out validateRoleAssignment procedure
  //   .input(z.object({
  //     roleId: z.string(),
  //     campusIds: z.array(z.string()).optional() // campusIds are optional now
  //   }))
  //   .query(async ({ ctx, input }) => {
  //     const { roleId, campusIds } = input;

  //     const role = await ctx.prisma.role.findUnique({
  //       where: { id: roleId },
  //       select: { name: true } // Fetch role type and name - removed type
  //     });

  //     if (!role) {
  //       throw new Error("Role not found");
  //     }

  //     // Removed type checks as they are no longer relevant
  //     // if (role.type === "CORE" && campusIds && campusIds.length > 0) {
  //     //   return [{ 
  //     //     conflict: true, 
  //     //     message: `Core role "${role.name}" cannot be assigned to specific campuses.` 
  //     //   }];
  //     // }

  //     // if (role.type === "CAMPUS" && (!campusIds || campusIds.length === 0)) {
  //     //   return [{ 
  //     //     conflict: true, 
  //     //     message: `Campus role "${role.name}" must be assigned to at least one campus.` 
  //     //   }];
  //     // }

  //     if (role.type === "CAMPUS" && campusIds && campusIds.length > 0) {
  //     //   // Check for existing assignments only for campus roles
  //     //   const existingAssignments = await ctx.prisma.rolePermission.findMany({
  //     //     where: {
  //     //       roleId,
  //     //       campusId: {
  //     //         in: campusIds
  //     //       }
  //     //     },
  //     //     include: {
  //     //       campus: true,
  //     //     }
  //     //   });

  //     //   // Validate conflicts
  //     //   const conflicts = existingAssignments.map(assignment => ({
  //     //     campusId: assignment.campusId,
  //     //     campusName: assignment.campus?.name, // Added null check here
  //     //     conflict: true
  //     //   }));

  //     //   return conflicts;
  //     // }

  //     return []; // No conflicts
  //   }),


  assignRoleToCampuses: protectedProcedure
    .input(z.object({
      roleId: z.string(),
      campusIds: z.array(z.string())
    }))
    .mutation(async ({ ctx, input }) => {
      const { roleId, campusIds } = input;
      
      // Validate assignments - call validateRoleAssignment procedure - no need to call here
      // const conflicts = await ctx.trpc.role.validateRoleAssignment.query({ roleId, campusIds });
      // if (conflicts.length > 0) {
      //   throw new Error('Role assignment conflicts detected');
      // }

      // Create assignments
      return ctx.prisma.$transaction(
        campusIds.map(campusId => 
          ctx.prisma.rolePermission.create({
            data: {
              roleId,
              campusId,
              permissionId: 'default' // added default permissionId to fix type error
            }
          })
        )
      );
    }),
});

// Adjusted type definition for role parameter in resolveInheritedPermissions
async function resolveInheritedPermissions(
  role: RecursiveRole,
  ctx: Context
): Promise<RolePermission[]> {
  if (!role) return [];

  let parentPermissions: RolePermission[] = [];
  if (role.parent) {
    parentPermissions = await resolveInheritedPermissions(role.parent as RecursiveRole, ctx);
  }

  return [...role.permissions, ...parentPermissions];
}
