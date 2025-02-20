import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Status, UserType } from "@prisma/client";

export const coordinatorRouter = createTRPCRouter({
	createCoordinator: protectedProcedure
		.input(z.object({
			name: z.string(),
			email: z.string().email(),
			programIds: z.array(z.string()).optional(),
			responsibilities: z.array(z.string()).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { programIds, responsibilities, ...userData } = input;

			const coordinator = await ctx.prisma.user.create({
				data: {
					...userData,
					userType: UserType.COORDINATOR,
					coordinatorProfile: {
						create: {
							...(programIds && {
								programs: {
									connect: programIds.map(id => ({ id })),
								},
							}),
						},
					},
				},
				include: {
					coordinatorProfile: {
						include: {
							programs: true,
						},
					},
				},
			});

			return coordinator;
		}),

	updateCoordinator: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			email: z.string().email().optional(),
			programIds: z.array(z.string()).optional(),
			responsibilities: z.array(z.string()).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, programIds, responsibilities, ...updateData } = input;

			const coordinatorProfile = await ctx.prisma.coordinatorProfile.findUnique({
				where: { userId: id },
			});

			if (!coordinatorProfile) {
				throw new Error("Coordinator profile not found");
			}

			if (programIds) {
				await ctx.prisma.coordinatorProfile.update({
					where: { id: coordinatorProfile.id },
					data: {
						programs: {
							set: programIds.map(id => ({ id })),
						},
					},
				});
			}

			const updatedCoordinator = await ctx.prisma.user.update({
				where: { id },
				data: updateData,
				include: {
					coordinatorProfile: {
						include: {
							programs: true,
						},
					},
				},
			});

			return updatedCoordinator;
		}),

	deleteCoordinator: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.user.delete({
				where: { id: input },
			});
		}),

	getCoordinator: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.user.findUnique({
				where: { id: input },
				include: {
					coordinatorProfile: {
						include: {
							programs: true,
						},
					},
				},
			});
		}),

	searchCoordinators: protectedProcedure
		.input(z.object({
			search: z.string().optional(),
			programId: z.string().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
		}))
		.query(async ({ ctx, input }) => {
			const { search, programId, status } = input;

			return ctx.prisma.user.findMany({
				where: {
					userType: UserType.COORDINATOR,
					...(search && {
						OR: [
							{ name: { contains: search, mode: 'insensitive' } },
							{ email: { contains: search, mode: 'insensitive' } },
						],
					}),
					coordinatorProfile: {
						...(programId && {
							programs: {
								some: { id: programId },
							},
						}),
					},
					...(status && { status }),
				},
				include: {
					coordinatorProfile: {
						include: {
							programs: true,
						},
					},
				},
				orderBy: {
					name: 'asc',
				},
			});
		}),

  // Add new endpoint for coordinator transfer
  transferCoordinator: protectedProcedure
    .input(z.object({
      programId: z.string(),
      fromCoordinatorId: z.string(),
      toCoordinatorId: z.string(),
      transferNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!hasPermission(ctx.session, "MANAGE_COORDINATORS")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to transfer coordinators",
        });
      }

      // Check workload of receiving coordinator
      const toCoordinator = await ctx.prisma.coordinatorProfile.findUnique({
        where: { id: input.toCoordinatorId },
        include: { programs: true },
      });

      if (!toCoordinator) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Receiving coordinator not found",
        });
      }

      if (toCoordinator.currentWorkload >= toCoordinator.maxWorkload) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Receiving coordinator has reached maximum workload",
        });
      }

      // Perform transfer
      const [removedProgram, addedProgram] = await ctx.prisma.$transaction([
        ctx.prisma.program.update({
          where: { id: input.programId },
          data: { coordinatorId: null },
        }),
        ctx.prisma.program.update({
          where: { id: input.programId },
          data: { coordinatorId: input.toCoordinatorId },
        }),
      ]);

      // Update workload counts
      await ctx.prisma.$transaction([
        ctx.prisma.coordinatorProfile.update({
          where: { id: input.fromCoordinatorId },
          data: { currentWorkload: { decrement: 1 } },
        }),
        ctx.prisma.coordinatorProfile.update({
          where: { id: input.toCoordinatorId },
          data: { currentWorkload: { increment: 1 } },
        }),
      ]);

      return { success: true };
    }),

  // Add endpoint to get coordinator's students
  getCoordinatorStudents: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (!hasPermission(ctx.session, "VIEW_COORDINATOR_STUDENTS")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view coordinator students",
        });
      }

      return ctx.prisma.studentProfile.findMany({
        where: {
          class: {
            classGroup: {
              program: {
                coordinatorId: input,
              },
            },
          },
        },
        include: {
          user: true,
          class: {
            include: {
              classGroup: true,
            },
          },
        },
      });
    }),

  // Add endpoint to manage reporting relationships
  updateReportingRelationship: protectedProcedure
    .input(z.object({
      coordinatorId: z.string(),
      reportsToId: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!hasPermission(ctx.session, "MANAGE_COORDINATOR_HIERARCHY")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to manage coordinator hierarchy",
        });
      }

      return ctx.prisma.coordinatorProfile.update({
        where: { id: input.coordinatorId },
        data: { reportsToId: input.reportsToId },
      });
    }),
});
