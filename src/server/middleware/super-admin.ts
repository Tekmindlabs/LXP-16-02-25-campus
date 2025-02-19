// In /src/server/middleware/super-admin.ts
import { t } from "../api/trpc";
import { TRPCError } from "@trpc/server";
import { DefaultRoles } from "@prisma/client";

export const superAdminMiddleware = t.middleware(async ({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}

	const isSuperAdmin = ctx.session.user.roles?.includes(DefaultRoles.SUPER_ADMIN);
	const hasManagePermission = ctx.session.user.permissions?.includes('campus:manage');

	if (!isSuperAdmin && !hasManagePermission) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'Insufficient permissions'
		});
	}

	return next();
});