import { CampusUserService } from '../services/CampusUserService';
import { CampusRole, CampusPermission } from '../../types/enums';
import { TRPCError } from '@trpc/server';
import { PrismaClient } from '@prisma/client';

const ROLE_HIERARCHY: Record<CampusRole, CampusRole[]> = {
	[CampusRole.CAMPUS_ADMIN]: [
		CampusRole.CAMPUS_MANAGER,
		CampusRole.CAMPUS_TEACHER,
		CampusRole.CAMPUS_STUDENT
	],
	[CampusRole.CAMPUS_MANAGER]: [
		CampusRole.CAMPUS_TEACHER,
		CampusRole.CAMPUS_STUDENT
	],
	[CampusRole.CAMPUS_TEACHER]: [
		CampusRole.CAMPUS_STUDENT
	],
	[CampusRole.CAMPUS_STUDENT]: [],
	[CampusRole.CAMPUS_COORDINATOR]: [
		CampusRole.CAMPUS_TEACHER,
		CampusRole.CAMPUS_STUDENT
	]
};

const ROLE_PERMISSIONS: Record<CampusRole, CampusPermission[]> = {
	[CampusRole.CAMPUS_ADMIN]: Object.values(CampusPermission),
	[CampusRole.CAMPUS_MANAGER]: [
		CampusPermission.VIEW_CAMPUS,
		CampusPermission.MANAGE_BUILDINGS,
		CampusPermission.MANAGE_ROOMS
	],
	[CampusRole.CAMPUS_TEACHER]: [
		CampusPermission.VIEW_CAMPUS,
		CampusPermission.VIEW_BUILDINGS,
		CampusPermission.VIEW_ROOMS
	],
	[CampusRole.CAMPUS_STUDENT]: [
		CampusPermission.VIEW_CAMPUS
	],
	[CampusRole.CAMPUS_COORDINATOR]: [
		CampusPermission.VIEW_CAMPUS,
		CampusPermission.MANAGE_CLASSES,
		CampusPermission.VIEW_BUILDINGS,
		CampusPermission.VIEW_ROOMS
	]
};

export async function withCampusRole(
	userService: CampusUserService,
	userId: string,
	campusId: string,
	requiredRole: CampusRole
): Promise<boolean> {
	const userRole = await userService.getUserRole(userId, campusId);
	if (!userRole) return false;

	return ROLE_HIERARCHY[userRole].includes(requiredRole) || userRole === requiredRole;
}

export async function withCampusPermission(
	userService: CampusUserService,
	userId: string,
	campusId: string,
	permission: CampusPermission
): Promise<boolean> {
	const userRole = await userService.getUserRole(userId, campusId);
	if (!userRole) return false;

	const hasPermission = ROLE_PERMISSIONS[userRole].includes(permission);
	if (!hasPermission) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: `User lacks required permission: ${permission}`
		});
	}

	return true;
}

export function requireCampusPermission(permission: CampusPermission) {
	return async (ctx: { prisma: PrismaClient; userId?: string; campusId?: string }) => {
		if (!ctx.userId || !ctx.campusId) {
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'Missing user or campus context'
			});
		}

		const userService = new CampusUserService(ctx.prisma);
		const result = await withCampusPermission(userService, ctx.userId, ctx.campusId, permission);
		
		if (!result) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: `Missing required permission: ${permission}`
			});
		}

		return true;
	};
}
