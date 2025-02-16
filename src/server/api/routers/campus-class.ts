import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Status } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { CampusUserService } from "../../services/CampusUserService";
import { CampusPermission } from "../../../types/enums";

export const campusClassRouter = createTRPCRouter({
	create: protectedProcedure
		.input(z.object({
			name: z.string(),
			campusId: z.string(),
			buildingId: z.string(),
			roomId: z.string(),
			capacity: z.number(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional().default(Status.ACTIVE),
			teacherIds: z.array(z.string()),
			classTutorId: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			const campusUserService = new CampusUserService(ctx.prisma);
			const hasPermission = await campusUserService.hasPermission(
				ctx.session.user.id,
				input.campusId,
				CampusPermission.MANAGE_CAMPUS_CLASSES
			);

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Insufficient permissions"
				});
			}

			return ctx.prisma.class.create({
				data: {
					name: input.name,
					capacity: input.capacity,
					status: input.status,
					campus: { connect: { id: input.campusId } },
					building: { connect: { id: input.buildingId } },
					room: { connect: { id: input.roomId } },
					teachers: {
						create: input.teacherIds.map(teacherId => ({
							teacher: { connect: { id: teacherId } },
							isClassTeacher: teacherId === input.classTutorId,
							status: Status.ACTIVE
						}))
					}
				},
				include: {
					campus: true,
					building: true,
					room: true,
					teachers: {
						include: {
							teacher: {
								include: {
									user: true
								}
							}
						}
					}
				}
			});
		}),

	getByCampus: protectedProcedure
		.input(z.object({
			campusId: z.string()
		}))
		.query(async ({ ctx, input }) => {
			const campusUserService = new CampusUserService(ctx.prisma);
			const hasPermission = await campusUserService.hasPermission(
				ctx.session.user.id,
				input.campusId,
				CampusPermission.VIEW_CAMPUS_CLASSES
			);

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Insufficient permissions"
				});
			}

			return ctx.prisma.class.findMany({
				where: {
					campusId: input.campusId
				},
				include: {
					campus: true,
					building: true,
					room: true,
					teachers: {
						include: {
							teacher: {
								include: {
									user: true
								}
							}
						}
					},
					students: {
						include: {
							user: true
						}
					}
				}
			});
		})
});