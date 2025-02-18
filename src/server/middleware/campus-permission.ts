import { TRPCError } from '@trpc/server';
import { initTRPC } from '@trpc/server';
import type { Context } from '../api/trpc';
import { CampusPermission } from '@/types/campus';

const t = initTRPC.context<Context>().create();
const middleware = t.middleware;

export const checkCampusPermission = (requiredPermission: CampusPermission, campusId?: string) => middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  // Define whereClause to find RolePermission
  // Define whereClause to find CampusRole
  const whereClause = {
    CampusRole: {
      some: {
        campusId: campusId ?? null,
        role: {
          permissions: {
            some: {
              permission: {
                name: requiredPermission,
              },
            },
          },
        },
      },
    },
  } as any;

  // Fetch CampusRole
  const campusRole = await ctx.prisma.user.findFirst({
    where: {
      id: ctx.session.user.id,
      ...whereClause,
    },
    include: {
      CampusRole: {
        include: {
          role: { // Access role through CampusRole relation
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Check if campusRole exists
  if (!campusRole) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource',
    });
  }

  // Extend context and proceed
  return next({
    ctx: {
      ...ctx,
      campusRole, // Pass campusRole to context
    },
  });
});

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
