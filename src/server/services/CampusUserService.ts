import { PrismaClient } from "@prisma/client";
import { CampusRole, CampusPermission } from "../../types/enums";
import { User } from "../../types/user";

export class CampusUserService {
	constructor(private readonly db: PrismaClient) {}

	async assignCampusRole(userId: string, campusId: string, role: CampusRole): Promise<void> {
		await this.db.campusRole.create({
			data: {
				userId,
				campusId,
				role,
				permissions: this.getDefaultPermissionsForRole(role),
				createdAt: new Date(),
				updatedAt: new Date()
			}
		});
	}

	async updateCampusRole(userId: string, campusId: string, role: CampusRole): Promise<void> {
		await this.db.campusRole.update({
			where: {
				userId_campusId: {
					userId,
					campusId
				}
			},
			data: {
				role,
				permissions: this.getDefaultPermissionsForRole(role),
				updatedAt: new Date()
			}
		});
	}

	async removeCampusRole(userId: string, campusId: string): Promise<void> {
		await this.db.campusRole.delete({
			where: {
				userId_campusId: {
					userId,
					campusId
				}
			}
		});
	}

	async getUserCampusRoles(userId: string): Promise<CampusRole[]> {
		const roles = await this.db.campusRole.findMany({
			where: { userId }
		});
		return roles.map(r => r.role as CampusRole);
	}

	async hasPermission(userId: string, campusId: string, permission: CampusPermission): Promise<boolean> {
		const role = await this.db.campusRole.findUnique({
			where: {
				userId_campusId: {
					userId,
					campusId
				}
			}
		});
		return role?.permissions.includes(permission) ?? false;
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