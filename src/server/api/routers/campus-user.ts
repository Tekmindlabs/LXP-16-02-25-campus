import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { CampusUserService } from "../../services/CampusUserService";
import { CampusPermission, CampusRole } from "../../../types/enums";
import { TRPCError } from "@trpc/server";

export const campusUserRouter = createTRPCRouter({
	assignRole: protectedProcedure
	  .input(z.object({
		userId: z.string(),
		campusId: z.string(),
		role: z.nativeEnum(CampusRole)
	  }))
	  .mutation(async ({ ctx, input }) => {
		const campusUserService = new CampusUserService(ctx.prisma);
		
		// Add specific validation for coordinator roles
		if (input.role === CampusRole.CAMPUS_PROGRAM_COORDINATOR) {
		  // Verify coordinator exists
		  const coordinator = await ctx.prisma.coordinatorProfile.findFirst({
			where: { userId: input.userId }
		  });
		  
		  if (!coordinator) {
			throw new TRPCError({
			  code: "BAD_REQUEST",
			  message: "User is not a coordinator"
			});
		  }
		}
  
		await campusUserService.assignCampusRole(
		  input.userId,
		  input.campusId,
		  input.role
		);
  
		return { success: true };
	  }),

	updateRole: protectedProcedure
		.input(z.object({
			userId: z.string(),
			campusId: z.string(),
			role: z.nativeEnum(CampusRole)
		}))
		.mutation(async ({ ctx, input }) => {
			const campusUserService = new CampusUserService(ctx.prisma);
			
			const hasPermission = await campusUserService.hasPermission(
				ctx.session.user.id,
				input.campusId,
				CampusPermission.MANAGE_CAMPUS_USERS
			);

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Insufficient permissions"
				});
			}

			await campusUserService.updateCampusRole(
				input.userId,
				input.campusId,
				input.role
			);

			return { success: true };
		}),

	getUserRoles: protectedProcedure
		.input(z.object({
			userId: z.string()
		}))
		.query(async ({ ctx, input }) => {
			const campusUserService = new CampusUserService(ctx.prisma);
			return campusUserService.getUserCampusRoles(input.userId);
		})
});