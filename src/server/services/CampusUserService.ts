import { PrismaClient } from "@prisma/client";
import { CampusPermission, CampusRoleType } from "../../types/campus";
import { TRPCError } from "@trpc/server";

interface CampusRoleInfo {
	campusId: string;
	role: CampusRoleType;
	permissions: CampusPermission[];
}

interface CampusRoleRecord {
	id: string;
	userId: string;
	campusId: string;
	role: CampusRoleType;
	permissions: CampusPermission[];
}

export class CampusUserService {
	private readonly allowedCampusPermissions: CampusPermission[] = [
		CampusPermission.MANAGE_CAMPUS_CLASSES,
		CampusPermission.MANAGE_CAMPUS_TEACHERS,
		CampusPermission.MANAGE_CAMPUS_STUDENTS,
		CampusPermission.MANAGE_CAMPUS_TIMETABLES,
		CampusPermission.MANAGE_CAMPUS_ATTENDANCE,
		CampusPermission.VIEW_CAMPUS_ANALYTICS,
		CampusPermission.VIEW_PROGRAMS,
		CampusPermission.VIEW_CLASS_GROUPS
	];

	constructor(private readonly db: PrismaClient) {}

	async assignCampusRole(userId: string, campusId: string, role: CampusRoleType): Promise<void> {
		try {
			const defaultPermissions = this.getDefaultPermissionsForRole(role);
			const validPermissions = defaultPermissions.filter(
				perm => this.allowedCampusPermissions.includes(perm)
			);

			await this.db.$executeRaw`
				INSERT INTO campus_roles (user_id, campus_id, role, permissions)
				VALUES (${userId}, ${campusId}, ${role}, ${validPermissions})
			`;
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to assign campus role"
			});
		}
	}

	async updateCampusRole(userId: string, campusId: string, role: CampusRoleType): Promise<void> {
		try {
			await this.db.$executeRaw`
				UPDATE campus_roles
				SET role = ${role}, permissions = ${this.getDefaultPermissionsForRole(role)}
				WHERE user_id = ${userId} AND campus_id = ${campusId}
			`;
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to update campus role"
			});
		}
	}

	async getUserRole(userId: string, campusId: string): Promise<CampusRoleType | null> {
		const result = await this.db.$queryRaw<CampusRoleRecord[]>`
			SELECT * FROM campus_roles
			WHERE user_id = ${userId} AND campus_id = ${campusId}
		`;
		return result[0]?.role ?? null;
	}

	async hasPermission(userId: string, campusId: string, permission: CampusPermission): Promise<boolean> {
		const result = await this.db.$queryRaw<CampusRoleRecord[]>`
			SELECT * FROM campus_roles
			WHERE user_id = ${userId} AND campus_id = ${campusId}
		`;
		return result[0]?.permissions.includes(permission) ?? false;
	}

	async getUserCampusRoles(userId: string): Promise<CampusRoleInfo[]> {
		try {
			const roles = await this.db.$queryRaw<CampusRoleRecord[]>`
				SELECT * FROM campus_roles
				WHERE user_id = ${userId}
			`;
			
			return roles.map(role => ({
				campusId: role.campusId,
				role: role.role,
				permissions: role.permissions
			}));
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch user campus roles"
			});
		}
	}



	private getDefaultPermissionsForRole(role: CampusRoleType): CampusPermission[] {
		switch (role) {
			case CampusRoleType.CAMPUS_ADMIN:
				return [
					CampusPermission.MANAGE_CAMPUS_CLASSES,
					CampusPermission.MANAGE_CAMPUS_TEACHERS,
					CampusPermission.MANAGE_CAMPUS_STUDENTS,
					CampusPermission.MANAGE_CAMPUS_TIMETABLES,
					CampusPermission.MANAGE_CAMPUS_ATTENDANCE,
					CampusPermission.VIEW_CAMPUS_ANALYTICS,
					CampusPermission.VIEW_PROGRAMS,
					CampusPermission.VIEW_CLASS_GROUPS
				];
			case CampusRoleType.CAMPUS_MANAGER:
				return [
					CampusPermission.MANAGE_CAMPUS_CLASSES,
					CampusPermission.MANAGE_CAMPUS_TEACHERS,
					CampusPermission.MANAGE_CAMPUS_STUDENTS,
					CampusPermission.VIEW_CAMPUS_ANALYTICS,
					CampusPermission.VIEW_PROGRAMS,
					CampusPermission.VIEW_CLASS_GROUPS
				];
			case CampusRoleType.CAMPUS_TEACHER:
				return [
					CampusPermission.MANAGE_CAMPUS_ATTENDANCE,
					CampusPermission.VIEW_PROGRAMS,
					CampusPermission.VIEW_CLASS_GROUPS
				];
			default:
				return [CampusPermission.VIEW_PROGRAMS, CampusPermission.VIEW_CLASS_GROUPS];
		}
	}
}