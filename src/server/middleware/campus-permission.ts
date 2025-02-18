import { TRPCError } from '@trpc/server';
import { initTRPC } from '@trpc/server';
import type { Context } from '../api/trpc';
import { CampusPermission } from '@/types/campus';

const t = initTRPC.context<Context>().create();
const middleware = t.middleware;

export const checkCampusPermission = (requiredPermission: CampusPermission, campusId?: string) => {
	return middleware(async ({ ctx, next }) => {
		if (!ctx.session?.user?.id) {
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'You must be logged in to access this resource',
			});
		}

		const whereClause = {
			userId: ctx.session.user.id,
			permissions: {
				has: requiredPermission,
			},
		} as any; // Explicitly cast to 'any' to allow conditional property

		if (campusId) {
			whereClause.campusId = campusId;
		}


		const campusRole = await ctx.prisma.campusRole.findFirst({
			where: whereClause,
		});

		if (!campusRole) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'You do not have permission to access this resource',
			});
		}

		return next({
			ctx: {
				...ctx,
				campusRole,
			},
		});
	});
};

export const protectedCampusRoute = middleware(async ({ ctx, next }) => {
	if (!ctx.session?.user?.id) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You must be logged in to access this resource',
		});
	}

	const campusRole = await ctx.prisma.campusRole.findFirst({
		where: {
			userId: ctx.session.user.id,
		},
	});

	if (!campusRole) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'You do not have access to campus resources',
		});
	}

	return next({
		ctx: {
			...ctx,
			campusRole,
		},
	});
});
