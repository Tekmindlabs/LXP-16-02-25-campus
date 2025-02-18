import { z } from "zod";
import { createTRPCRouter, permissionProtectedProcedure } from "../trpc";
import { Permissions } from "@/utils/permissions";
import { TRPCError } from "@trpc/server";

export const campusRolePermissionRouter = createTRPCRouter({
  saveCampusRolePermissions: permissionProtectedProcedure(Permissions.ROLE_UPDATE)
    .input(z.object({
      campusId: z.string(), // CampusId is now required
      resourceType: z.string(),
      permissions: z.record(z.array(z.string())), // Permissions is a record of roleId to permissionIds
    }))
    .mutation(async ({ ctx, input }) => {
      const { campusId, resourceType, permissions } = input;

      // Validate campusId
      if (!campusId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Campus ID is required for campus-scoped permissions.',
        });
      }

      // Process permissions for each role
      const results = [];
      for (const roleId in permissions) {
        const permissionIds = permissions[roleId] || [];

        // Clear existing permissions for this role and campus
        await ctx.prisma.rolePermission.deleteMany({
          where: {
            roleId: roleId,
            campusId: campusId,
          },
        });

        // Create new RolePermissions for each selected permission
        const createPermissions = permissionIds.map(permissionId => 
          ctx.prisma.rolePermission.create({
            data: {
              roleId,
              permissionId,
              campusId,
            } as any // Explicitly cast to 'any' to allow campusId
          })
        );
        
        const roleResults = await Promise.all(createPermissions);
        results.push(...roleResults);
      }

      return results;
    }),
});
