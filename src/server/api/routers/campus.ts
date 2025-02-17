import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { CampusPermission, CampusRoleType } from '@/types/campus';
import { TRPCError } from "@trpc/server";
import { CampusUserService } from "../../services/CampusUserService";

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
			try {
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

				console.log('Creating campus for user:', user.id);

				// First create the campus
				const campus = await ctx.prisma.campus.create({
					data: {
						...input,
					},
				});

				console.log('Campus created:', campus.id);

				// Use CampusUserService to assign role
				const campusUserService = new CampusUserService(ctx.prisma);
				await campusUserService.assignCampusRole(
					user.id,
					campus.id,
					CampusRoleType.CAMPUS_ADMIN
				);

				console.log('Campus role assigned');


				return campus;
			} catch (error) {
				console.error('Error creating campus:', error);
				throw error;
			}
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
						has: CampusPermission.VIEW_PROGRAMS,
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
						has: CampusPermission.VIEW_CLASS_GROUPS,
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


