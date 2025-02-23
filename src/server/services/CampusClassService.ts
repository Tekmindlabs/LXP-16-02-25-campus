import { PrismaClient, Prisma } from "@prisma/client";
import { CampusPermission } from "../../types/campus";
import { CampusUserService } from "./CampusUserService";

interface CampusClass {
	id: string;
	name: string;
	campusId: string;
	classGroupId: string;
	capacity: number;
	status: string;
	createdAt: Date;
	updatedAt: Date;
}

export class CampusClassService {
	constructor(
		private readonly db: PrismaClient,
		private readonly userService: CampusUserService
	) {}

	async createClass(userId: string, campusId: string, data: { name: string; classGroupId: string; capacity?: number }): Promise<CampusClass> {
		const hasPermission = await this.userService.hasPermission(
			userId,
			campusId,
			CampusPermission.MANAGE_CAMPUS_CLASSES
		);

		if (!hasPermission) {
			throw new Error("User does not have permission to create classes");
		}

		const result = await this.db.$queryRaw<CampusClass[]>(
			Prisma.sql`
				INSERT INTO campus_classes (
					name, campus_id, class_group_id, capacity, status
				) VALUES (
					${data.name}, ${campusId}, ${data.classGroupId}, 
					${data.capacity || 30}, 'ACTIVE'
				)
				RETURNING *
			`
		);
		return result[0];
	}

	async updateClass(userId: string, campusId: string, classId: string, data: { name?: string; capacity?: number }): Promise<CampusClass | null> {
		const hasPermission = await this.userService.hasPermission(
			userId,
			campusId,
			CampusPermission.MANAGE_CAMPUS_CLASSES
		);

		if (!hasPermission) {
			throw new Error("User does not have permission to update classes");
		}

		const updateFields: Prisma.Sql[] = [];
		if (data.name) {
			updateFields.push(Prisma.sql`name = ${data.name}`);
		}
		if (data.capacity) {
			updateFields.push(Prisma.sql`capacity = ${data.capacity}`);
		}

		if (updateFields.length === 0) return null;

		const result = await this.db.$queryRaw<CampusClass[]>(
			Prisma.sql`
				UPDATE campus_classes 
				SET ${Prisma.join(updateFields, ', ')}
				WHERE id = ${classId}
				RETURNING *
			`
		);
		return result[0];
	}

	async getClass(userId: string, campusId: string, classId: string): Promise<CampusClass | null> {
		const hasPermission = await this.userService.hasPermission(
			userId,
			campusId,
			CampusPermission.VIEW_CAMPUS_CLASSES
		);

		if (!hasPermission) {
			throw new Error("User does not have permission to view classes");
		}

		const result = await this.db.$queryRaw<CampusClass[]>(
			Prisma.sql`
				SELECT * FROM campus_classes 
				WHERE id = ${classId}
			`
		);
		return result[0] || null;
	}

	async getClasses(userId: string, campusId: string): Promise<CampusClass[]> {
		const hasPermission = await this.userService.hasPermission(
			userId,
			campusId,
			CampusPermission.VIEW_CAMPUS_CLASSES
		);

		if (!hasPermission) {
			throw new Error("User does not have permission to view classes");
		}

		return this.db.$queryRaw<CampusClass[]>(
			Prisma.sql`
				SELECT * FROM campus_classes 
				WHERE campus_id = ${campusId}
				ORDER BY name ASC
			`
		);
	}

	async deleteClass(userId: string, campusId: string, classId: string): Promise<void> {
		const hasPermission = await this.userService.hasPermission(
			userId,
			campusId,
			CampusPermission.MANAGE_CAMPUS_CLASSES
		);

		if (!hasPermission) {
			throw new Error("User does not have permission to delete classes");
		}

		await this.db.$executeRaw(
			Prisma.sql`
				DELETE FROM campus_classes 
				WHERE id = ${classId}
			`
		);
	}

	async assignTeacher(userId: string, campusId: string, classId: string, teacherId: string): Promise<void> {
		const hasPermission = await this.userService.hasPermission(
			userId,
			campusId,
			CampusPermission.MANAGE_CAMPUS_CLASSES
		);

		if (!hasPermission) {
			throw new Error("User does not have permission to assign teachers");
		}

		await this.db.$executeRaw(
			Prisma.sql`
				INSERT INTO campus_class_teachers (class_id, teacher_id)
				VALUES (${classId}, ${teacherId})
			`
		);
	}

	async removeTeacher(userId: string, campusId: string, classId: string, teacherId: string): Promise<void> {
		const hasPermission = await this.userService.hasPermission(
			userId,
			campusId,
			CampusPermission.MANAGE_CAMPUS_CLASSES
		);

		if (!hasPermission) {
			throw new Error("User does not have permission to remove teachers");
		}

		await this.db.$executeRaw(
			Prisma.sql`
				DELETE FROM campus_class_teachers 
				WHERE class_id = ${classId} AND teacher_id = ${teacherId}
			`
		);
	}

	async getTeachers(userId: string, campusId: string, classId: string): Promise<any[]> {
		const hasPermission = await this.userService.hasPermission(
			userId,
			campusId,
			CampusPermission.VIEW_CAMPUS_CLASSES
		);

		if (!hasPermission) {
			throw new Error("User does not have permission to view class teachers");
		}

		return this.db.$queryRaw(
			Prisma.sql`
				SELECT t.* FROM campus_class_teachers ct
				JOIN teachers t ON t.id = ct.teacher_id
				WHERE ct.class_id = ${classId}
			`
		);
	}
}
