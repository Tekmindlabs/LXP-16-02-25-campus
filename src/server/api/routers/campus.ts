import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { CampusPermission } from '@/types/campus';

export const campusRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		return ctx.prisma.campus.findMany({
			where: {
				roles: {
					some: {
						userId: ctx.session.user.id,
					},
				},
			},
		});
	}),

	getUserPermissions: protectedProcedure.query(async ({ ctx }) => {
		const campusRole = await ctx.prisma.campusRole.findFirst({
			where: {
				userId: ctx.session.user.id,
			},
		});

		if (!campusRole) {
			return [] as CampusPermission[];
		}

		return campusRole.permissions as CampusPermission[];
	}),

	getMetrics: protectedProcedure
		.input(z.object({ campusId: z.string() }))
		.query(async ({ ctx, input }) => {
			const [studentCount, teacherCount, programCount, classGroupCount] = await Promise.all([
				ctx.prisma.studentProfile.count({
					where: {
						class: {
							campusId: input.campusId,
						},
					},
				}),
				ctx.prisma.teacherProfile.count({
					where: {
						classes: {
							some: {
								class: {
									campusId: input.campusId,
								},
							},
						},
					},
				}),
				ctx.prisma.program.count({
					where: {
						classGroups: {
							some: {
								classes: {
									some: {
										campusId: input.campusId,
									},
								},
							},
						},
					},
				}),
				ctx.prisma.classGroup.count({
					where: {
						classes: {
							some: {
								campusId: input.campusId,
							},
						},
					},
				}),
			]);

			return {
				studentCount,
				teacherCount,
				programCount,
				classGroupCount,
			};
		}),
});


