import { z } from "zod";
import { createTRPCRouter, permissionProtectedProcedure } from "../trpc";
import { Permissions } from "@/utils/permissions";

type BaseCampusType = z.infer<typeof baseCampusSchema>;

const baseCampusSchema = z.object({
	name: z.string().min(1),
	code: z.string().regex(/^[A-Z0-9-]+$/),
	establishmentDate: z.string(),
	type: z.enum(["MAIN", "BRANCH"]),
	status: z.enum(["ACTIVE", "INACTIVE"]),
	streetAddress: z.string().min(1),
	city: z.string().min(1),
	state: z.string().min(1),
	country: z.string().min(1),
	postalCode: z.string().regex(/^[A-Z0-9-\s]+$/),
	gpsCoordinates: z.string().optional(),
	primaryPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
	secondaryPhone: z.string().optional(),
	email: z.string().email(),
	emergencyContact: z.string().regex(/^\+?[1-9]\d{1,14}$/),
});

const campusSchema = baseCampusSchema.transform((data) => ({
	...data,
	establishmentDate: new Date(data.establishmentDate),
}));

const updateCampusSchema = z.object({
	id: z.string(),
	...Object.fromEntries(
		Object.entries(baseCampusSchema.shape).map(([key, value]) => [
			key,
			(value as z.ZodTypeAny).optional(),
		])
	),
}) satisfies z.ZodType<{ id: string } & Partial<BaseCampusType>>;

export const campusRouter = createTRPCRouter({
	create: permissionProtectedProcedure(Permissions.CAMPUS_MANAGE)
		.input(campusSchema)
		.mutation(async ({ ctx, input }) => {
			const existingCampus = await ctx.prisma.campus.findUnique({
				where: { code: input.code },
			});

			if (existingCampus) {
				throw new Error("Campus code must be unique");
			}

			return ctx.prisma.campus.create({
				data: input,
			});
		}),

	getAll: permissionProtectedProcedure(Permissions.CAMPUS_VIEW)
		.query(({ ctx }) => {
			return ctx.prisma.campus.findMany({
				orderBy: { name: 'asc' },
			});
		}),

	getById: permissionProtectedProcedure(Permissions.CAMPUS_VIEW)
		.input(z.string())
		.query(({ ctx, input }) => {
			return ctx.prisma.campus.findUnique({
				where: { id: input },
			});
		}),

	update: permissionProtectedProcedure(Permissions.CAMPUS_MANAGE)
		.input(updateCampusSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...inputData } = input as { id: string } & Partial<BaseCampusType>;
			const data = {
				...inputData,
				...(inputData.establishmentDate && {
					establishmentDate: new Date(inputData.establishmentDate),
				}),
			};

			if (data.code) {
				const existingCampus = await ctx.prisma.campus.findFirst({
					where: {
						code: data.code,
						NOT: { id },
					},
				});

				if (existingCampus) {
					throw new Error("Campus code must be unique");
				}
			}

			return ctx.prisma.campus.update({
				where: { id },
				data,
			});
		}),

	delete: permissionProtectedProcedure(Permissions.CAMPUS_DELETE)
		.input(z.string())
		.mutation(({ ctx, input }) => {
			return ctx.prisma.campus.delete({
				where: { id: input },
			});
		}),

	list: permissionProtectedProcedure(Permissions.CAMPUS_VIEW)
		.input(
			z.object({
				status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
				type: z.enum(["MAIN", "BRANCH"]).optional(),
			}).optional()
		)
		.query(({ ctx, input }) => {
			return ctx.prisma.campus.findMany({
				where: {
					...(input?.status && { status: input.status }),
					...(input?.type && { type: input.type }),
				},
				orderBy: { name: 'asc' },
			});
		}),
});
