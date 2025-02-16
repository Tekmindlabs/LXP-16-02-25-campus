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
			
			// Check if user has permission
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