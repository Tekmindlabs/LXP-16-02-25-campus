import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { floorSchema, floorIdSchema, updateFloorSchema } from "../validation/floor";
import { TRPCError } from "@trpc/server";

export const floorRouter = createTRPCRouter({
	create: protectedProcedure
		.input(floorSchema)
		.mutation(async ({ ctx, input }) => {
			const floor = await ctx.prisma.floor.create({
				data: input,
			});
			return floor;
		}),

	getAll: protectedProcedure
		.input(z.object({ buildingId: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const where = input.buildingId ? { buildingId: input.buildingId } : {};
			return ctx.prisma.floor.findMany({
				where,
				include: {
					building: true,
					wings: true,
				},
				orderBy: {
					number: 'asc',
				},
			});
		}),

	getById: protectedProcedure
		.input(floorIdSchema)
		.query(async ({ ctx, input }) => {
			const floor = await ctx.prisma.floor.findUnique({
				where: { id: input.id },
				include: {
					building: true,
					wings: true,
				},
			});

			if (!floor) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Floor not found",
				});
			}

			return floor;
		}),

	update: protectedProcedure
		.input(z.object({
			id: z.string(),
			data: updateFloorSchema,
		}))
		.mutation(async ({ ctx, input }) => {
			const floor = await ctx.prisma.floor.update({
				where: { id: input.id },
				data: input.data,
			});
			return floor;
		}),

	delete: protectedProcedure
		.input(floorIdSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.prisma.floor.delete({
				where: { id: input.id },
			});
			return { success: true };
		}),
});