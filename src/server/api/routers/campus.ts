import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { CampusPermission } from '@/types/campus';
import { TRPCError } from "@trpc/server";

export const campusRouter = createTRPCRouter({
	create: protectedProcedure
		.input(z.object({ 
			name: z.string(),
			code: z.string(),
			establishmentDate: z.string().transform((str) => new Date(str)),
			type: z.enum(["MAIN", "BRANCH"]),
			streetAddress: z.string(),
			city: z.string(),
			state: z.string(),
			country: z.string(),
			postalCode: z.string(),
			primaryPhone: z.string(),
			email: z.string().email(),
			emergencyContact: z.string(),
			secondaryPhone: z.string().optional(),
			gpsCoordinates: z.string().optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			// Verify user exists
			const user = await ctx.prisma.user.findUnique({
				where: { id: ctx.session.user.id },
			});

			if (!user) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'User not found',
				});
			}

			// Create campus with role
			return ctx.prisma.campus.create({
				data: {
					...input,
					roles: {
						create: {
							userId: user.id,
							role: "ADMIN",
							permissions: [
								"VIEW_CAMPUS",
								"EDIT_CAMPUS",
								"DELETE_CAMPUS",
								"VIEW_PROGRAMS",
								"EDIT_PROGRAMS",
								"DELETE_PROGRAMS",
								"VIEW_CLASS_GROUPS",
								"EDIT_CLASS_GROUPS",
								"DELETE_CLASS_GROUPS",
								"VIEW_CLASSES",
								"EDIT_CLASSES",
								"DELETE_CLASSES",
								"VIEW_STUDENTS",
								"EDIT_STUDENTS",
								"DELETE_STUDENTS",
								"VIEW_TEACHERS",
								"EDIT_TEACHERS",
								"DELETE_TEACHERS",
							],
						},
					},
				},
			});
		}),

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

export const campusViewRouter = createTRPCRouter({
	getInheritedPrograms: protectedProcedure
		.input(z.object({ campusId: z.string() }))
		.query(async ({ ctx, input }) => {
			const hasPermission = await ctx.prisma.campusRole.findFirst({
				where: {
					userId: ctx.session.user.id,
					campusId: input.campusId,
					permissions: {
						has: "VIEW_PROGRAMS",
					},
				},
			});

			if (!hasPermission) {
				throw new TRPCError({ code: 'FORBIDDEN' });
			}

			return ctx.prisma.program.findMany({
				where: {
					calendarId: {
						equals: input.campusId,
					},
				},

			});
		}),

	getInheritedClassGroups: protectedProcedure
		.input(z.object({ campusId: z.string() }))
		.query(async ({ ctx, input }) => {
			const hasPermission = await ctx.prisma.campusRole.findFirst({
				where: {
					userId: ctx.session.user.id,
					campusId: input.campusId,
					permissions: {
						has: "VIEW_CLASS_GROUPS",
					},
				},
			});

			if (!hasPermission) {
				throw new TRPCError({ code: 'FORBIDDEN' });
			}

			return ctx.prisma.classGroup.findMany({
				where: {
					calendarId: input.campusId,
				},

			});
		}),
});


