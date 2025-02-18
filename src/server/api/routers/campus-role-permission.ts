import { z } from "zod";
import { createTRPCRouter, permissionProtectedProcedure } from "../trpc";
import { Permissions } from "@/utils/permissions";
import { TRPCError } from "@trpc/server";

export const campusRolePermissionRouter = createTRPCRouter({
  saveCampusRolePermissions: permissionProtectedProcedure(Permissions.ROLE_UPDATE) // Use ROLE_UPDATE permission for now
    .input(z.object({
      roleId: z.string(),
      permissionId: z.string(),
      campusId: z.string().optional(), // CampusId is now optional
    }))
    .mutation(async ({ ctx, input }) => {
      const { roleId, permissionId, campusId } = input;

      if (!campusId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Campus ID is required for campus-scoped permissions.',
        });
      }

      // Check if RolePermission already exists for this role, permission and campus
      const existingRolePermission = await ctx.prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId_campusId: {
            roleId,
            permissionId,
            campusId,
          },
        },
      } as any); // Explicitly cast to 'any' to allow composite key

      if (existingRolePermission) {
        // If it exists, no need to create again, just return existing record
        return existingRolePermission;
      }

      // Create new RolePermission
      return ctx.prisma.rolePermission.create({
        data: {
          roleId,
          permissionId,
          campusId,
        } as any, // Explicitly cast to 'any' to allow campusId
      });
    }),
});
