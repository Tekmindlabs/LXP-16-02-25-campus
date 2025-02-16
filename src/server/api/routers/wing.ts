import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { wingSchema, wingIdSchema, updateWingSchema } from "../validation/wing";
import { TRPCError } from "@trpc/server";

export const wingRouter = createTRPCRouter({
	create: protectedProcedure
		.input(wingSchema)
		.mutation(async ({ ctx, input }) => {
			const wing = await ctx.prisma.wing.create({
				data: input,
			});
			return wing;
		}),

	getAll: protectedProcedure
		.input(z.object({ floorId: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const where = input.floorId ? { floorId: input.floorId } : {};
			return ctx.prisma.wing.findMany({
				where,
				include: {
					floor: true,
					rooms: true,
				},
				orderBy: {
					name: 'asc',
				},
			});
		}),

	getById: protectedProcedure
		.input(wingIdSchema)
		.query(async ({ ctx, input }) => {
			const wing = await ctx.prisma.wing.findUnique({
				where: { id: input.id },
				include: {
					floor: true,
					rooms: true,
				},
			});

			if (!wing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Wing not found",
				});
			}

			return wing;
		}),

	update: protectedProcedure
		.input(z.object({
			id: z.string(),
			data: updateWingSchema,
		}))
		.mutation(async ({ ctx, input }) => {
			const wing = await ctx.prisma.wing.update({
				where: { id: input.id },
				data: input.data,
			});
			return wing;
		}),

	delete: protectedProcedure
		.input(wingIdSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.prisma.wing.delete({
				where: { id: input.id },
			});
			return { success: true };
		}),
});