import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { campusSchema } from "@/types/validation/campus";
import { CampusService } from "../../services/campus.service";
import { CampusUserService } from "../../services/CampusUserService";
import { Status, CampusType, CampusPermission } from "@/types/enums";
import { TRPCError } from "@trpc/server";

export const campusRouter = createTRPCRouter({
	create: protectedProcedure
		.input(campusSchema)
		.mutation(async ({ ctx, input }) => {


			const campusService = new CampusService(ctx.prisma);
			const existingCampus = await ctx.prisma.campus.findUnique({
				where: { code: input.code },
			});

			if (existingCampus) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Campus code must be unique"
				});
			}

			return campusService.createCampus(input);
		}),

	getAll: protectedProcedure
		.query(async ({ ctx }) => {
			const campusService = new CampusService(ctx.prisma);
			return campusService.listCampuses();
		}),

	getById: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			const campusUserService = new CampusUserService(ctx.prisma);
			const hasPermission = await campusUserService.hasPermission(
				ctx.session.user.id,
				input,
				CampusPermission.VIEW_CAMPUS
			);

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Insufficient permissions"
				});
			}

			const campusService = new CampusService(ctx.prisma);
			return campusService.getCampus(input);
		}),

	update: protectedProcedure
		.input(z.object({
			id: z.string(),
			data: campusSchema.partial()
		}))
		.mutation(async ({ ctx, input }) => {
			const campusUserService = new CampusUserService(ctx.prisma);
			const hasPermission = await campusUserService.hasPermission(
				ctx.session.user.id,
				input.id,
				CampusPermission.MANAGE_CAMPUS
			);

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Insufficient permissions"
				});
			}

			const campusService = new CampusService(ctx.prisma);
			
			if (input.data.code) {
				const existingCampus = await ctx.prisma.campus.findFirst({
					where: {
						code: input.data.code,
						NOT: { id: input.id },
					},
				});

				if (existingCampus) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Campus code must be unique"
					});
				}
			}

			return campusService.updateCampus(input.id, input.data);
		}),

	delete: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			const campusUserService = new CampusUserService(ctx.prisma);
			const hasPermission = await campusUserService.hasPermission(
				ctx.session.user.id,
				input,
				CampusPermission.MANAGE_CAMPUS
			);

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Insufficient permissions"
				});
			}

			const campusService = new CampusService(ctx.prisma);
			await campusService.deleteCampus(input);
			return { success: true };
		}),

	list: protectedProcedure
		.input(z.object({
			status: z.nativeEnum(Status).optional(),
			type: z.nativeEnum(CampusType).optional(),
		}).optional())
		.query(async ({ ctx, input }) => {
			const campusUserService = new CampusUserService(ctx.prisma);
			const hasPermission = await campusUserService.hasPermission(
				ctx.session.user.id,
				"", // For list endpoint, we don't need a specific campus ID
				CampusPermission.VIEW_CAMPUS
			);

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Insufficient permissions"
				});
			}

			const where: {
				status?: Status;
				type?: CampusType;
			} = {};

			if (input?.status) where.status = input.status;
			if (input?.type) where.type = input.type;

			return ctx.prisma.campus.findMany({
				where,
				orderBy: { name: 'asc' },
				include: {
					buildings: true
				}
			});
		}),
});

