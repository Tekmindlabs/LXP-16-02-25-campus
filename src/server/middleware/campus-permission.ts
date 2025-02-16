import { NextApiRequest, NextApiResponse } from 'next';
import { CampusPermission, CampusRole } from '../../types/enums';
import { CampusUserService } from '../services/CampusUserService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const campusUserService = new CampusUserService(prisma);

// Role hierarchy and default permissions mapping
const ROLE_HIERARCHY: Record<CampusRole, CampusRole[]> = {
	[CampusRole.CAMPUS_ADMIN]: [
		CampusRole.CAMPUS_MANAGER,
		CampusRole.CAMPUS_COORDINATOR,
		CampusRole.CAMPUS_TEACHER,
		CampusRole.CAMPUS_STUDENT
	],
	[CampusRole.CAMPUS_MANAGER]: [
		CampusRole.CAMPUS_COORDINATOR,
		CampusRole.CAMPUS_TEACHER,
		CampusRole.CAMPUS_STUDENT
	],
	[CampusRole.CAMPUS_COORDINATOR]: [
		CampusRole.CAMPUS_TEACHER,
		CampusRole.CAMPUS_STUDENT
	],
	[CampusRole.CAMPUS_TEACHER]: [
		CampusRole.CAMPUS_STUDENT
	],
	[CampusRole.CAMPUS_STUDENT]: []
};

const ROLE_PERMISSIONS: Record<CampusRole, CampusPermission[]> = {
	[CampusRole.CAMPUS_ADMIN]: Object.values(CampusPermission),
	[CampusRole.CAMPUS_MANAGER]: [
		CampusPermission.VIEW_CAMPUS,
		CampusPermission.MANAGE_BUILDINGS,
		CampusPermission.MANAGE_ROOMS,
		CampusPermission.VIEW_BUILDINGS,
		CampusPermission.VIEW_ROOMS,
		CampusPermission.MANAGE_CAMPUS_USERS,
		CampusPermission.VIEW_CAMPUS_USERS,
		CampusPermission.MANAGE_CAMPUS_CLASSES,
		CampusPermission.VIEW_CAMPUS_CLASSES
	],
	[CampusRole.CAMPUS_COORDINATOR]: [
		CampusPermission.VIEW_CAMPUS,
		CampusPermission.VIEW_BUILDINGS,
		CampusPermission.VIEW_ROOMS,
		CampusPermission.MANAGE_CAMPUS_CLASSES,
		CampusPermission.VIEW_CAMPUS_CLASSES,
		CampusPermission.MANAGE_ATTENDANCE,
		CampusPermission.VIEW_ATTENDANCE
	],
	[CampusRole.CAMPUS_TEACHER]: [
		CampusPermission.VIEW_CAMPUS,
		CampusPermission.VIEW_BUILDINGS,
		CampusPermission.VIEW_ROOMS,
		CampusPermission.VIEW_CAMPUS_CLASSES,
		CampusPermission.MANAGE_ATTENDANCE,
		CampusPermission.VIEW_ATTENDANCE,
		CampusPermission.MANAGE_GRADES,
		CampusPermission.VIEW_GRADES
	],
	[CampusRole.CAMPUS_STUDENT]: [
		CampusPermission.VIEW_CAMPUS,
		CampusPermission.VIEW_CAMPUS_CLASSES,
		CampusPermission.VIEW_ATTENDANCE,
		CampusPermission.VIEW_GRADES
	]
};

async function checkRoleHierarchy(
	userId: string,
	campusId: string,
	requiredRole: CampusRole
): Promise<boolean> {
	const userRole = await campusUserService.getUserRole(userId, campusId);
	if (!userRole) return false;

	return ROLE_HIERARCHY[userRole].includes(requiredRole) || userRole === requiredRole;
}

export async function withCampusPermission(
	req: NextApiRequest,
	res: NextApiResponse,
	permission: CampusPermission
): Promise<boolean> {
	const userId = req.session?.user?.id;
	const campusId = req.query.campusId as string;

	if (!userId || !campusId) {
		res.status(401).json({ error: 'Unauthorized' });
		return false;
	}

	const userRole = await campusUserService.getUserRole(userId, campusId);
	if (!userRole) {
		res.status(403).json({ error: 'No role assigned for this campus' });
		return false;
	}

	// Check if user has permission through their role
	const hasPermission = ROLE_PERMISSIONS[userRole].includes(permission);
	if (!hasPermission) {
		res.status(403).json({ error: 'Insufficient permissions' });
		return false;
	}

	// Check if user has any additional custom permissions
	const hasCustomPermission = await campusUserService.hasPermission(userId, campusId, permission);
	if (!hasPermission && !hasCustomPermission) {
		res.status(403).json({ error: 'Insufficient permissions' });
		return false;
	}

	return true;
}

export function requireCampusPermission(permission: CampusPermission) {
	return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
		const result = await withCampusPermission(req, res, permission);
		if (result === true) {
			next();
		}
	};
}

export function requireCampusRole(role: CampusRole) {
	return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
		const userId = req.session?.user?.id;
		const campusId = req.query.campusId as string;

		if (!userId || !campusId) {
			res.status(401).json({ error: 'Unauthorized' });
			return;
		}

		const hasRole = await checkRoleHierarchy(userId, campusId, role);
		if (!hasRole) {
			res.status(403).json({ error: 'Insufficient role level' });
			return;
		}

		next();
	};
}