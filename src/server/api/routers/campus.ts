import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Status } from "@prisma/client";

export const campusRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		return ctx.prisma.campus.findMany({
			where: { status: Status.ACTIVE },
			include: {
				buildings: {
					include: {
						floors: {
							include: {
								wings: {
									include: {
										rooms: true
									}
								}
							}
						}
					}
				}
			}
		});
	}),
});


