import { PrismaClient } from "@prisma/client";
import { CampusRole, CampusPermission } from "../../types/enums";
import { TRPCError } from "@trpc/server";

interface CampusRoleInfo {
	campusId: string;
	role: CampusRole;
	permissions: CampusPermission[];
}

interface CampusRoleRecord {
	id: string;
	userId: string;
	campusId: string;
	role: CampusRole;
	permissions: CampusPermission[];
}

export class CampusUserService {
	constructor(private readonly db: PrismaClient) {}

	async assignCampusRole(userId: string, campusId: string, role: CampusRole): Promise<void> {
		try {
			await this.db.$executeRaw`
				INSERT INTO campus_roles (user_id, campus_id, role, permissions)
				VALUES (${userId}, ${campusId}, ${role}, ${this.getDefaultPermissionsForRole(role)})
			`;
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to assign campus role"
			});
		}
	}

	async updateCampusRole(userId: string, campusId: string, role: CampusRole): Promise<void> {
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

	async getUserRole(userId: string, campusId: string): Promise<CampusRole | null> {
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



	private getDefaultPermissionsForRole(role: CampusRole): CampusPermission[] {
		switch (role) {
			case CampusRole.CAMPUS_ADMIN:
				return Object.values(CampusPermission);
			case CampusRole.CAMPUS_MANAGER:
				return [
					CampusPermission.VIEW_CAMPUS,
					CampusPermission.MANAGE_BUILDINGS,
					CampusPermission.MANAGE_ROOMS,
					CampusPermission.MANAGE_CAMPUS_USERS,
					CampusPermission.VIEW_CAMPUS_USERS
				];
			case CampusRole.CAMPUS_TEACHER:
				return [
					CampusPermission.VIEW_CAMPUS,
					CampusPermission.VIEW_BUILDINGS,
					CampusPermission.VIEW_ROOMS,
					CampusPermission.MANAGE_ATTENDANCE,
					CampusPermission.MANAGE_GRADES
				];
			default:
				return [CampusPermission.VIEW_CAMPUS];
		}
	}
}