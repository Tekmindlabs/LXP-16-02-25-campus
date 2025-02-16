import { PrismaClient } from '@prisma/client';
import { 
	ActivityScope, 
	ActivityStatus, 
	UnifiedActivity, 
	FormData 
} from '@/types/class-activity';

export class ActivityService {
	constructor(
		private readonly db: PrismaClient
	) {}

	async createActivity(data: FormData): Promise<UnifiedActivity> {
		const activity = await this.db.classActivity.create({
			data: {
				title: data.title,
				description: data.description,
				type: data.type,
				status: ActivityStatus.DRAFT,
				scope: data.scope,
				isTemplate: data.isTemplate || false,
				subjectId: data.subjectId,
				classId: data.classId,
				curriculumNodeId: data.curriculumNodeId,
				configuration: data.configuration,
				resources: {
					create: data.resources
				}
			},
			include: {
				subject: true,
				class: true,
				resources: true
			}
		});

		// Handle curriculum activity inheritance
		if (data.scope === ActivityScope.CURRICULUM && data.curriculumNodeId) {
			await this.createCurriculumInheritance(activity.id, data.subjectId);
		}

		return activity as UnifiedActivity;
	}

	private async createCurriculumInheritance(activityId: string, subjectId: string) {
		// Get all classes with this subject
		const classes = await this.db.class.findMany({
			where: { 
				subjects: { 
					some: { id: subjectId } 
				} 
			}
		});

		// Create inheritance records
		await this.db.activityInheritance.createMany({
			data: classes.map(cls => ({
				activityId,
				classId: cls.id,
				inherited: true
			}))
		});
	}

	async getActivities(filters: {
		subjectId?: string;
		classId?: string;
		curriculumNodeId?: string;
		scope?: ActivityScope;
		isTemplate?: boolean;
	}): Promise<UnifiedActivity[]> {
		return this.db.classActivity.findMany({
			where: {
				...filters,
				OR: filters.classId ? [
					{ classId: filters.classId },
					{
						activityInheritance: {
							some: { classId: filters.classId }
						}
					}
				] : undefined
			},
			include: {
				subject: true,
				class: true,
				resources: true,
				curriculumNode: true
			}
		}) as Promise<UnifiedActivity[]>;
	}

	async updateActivity(
		id: string, 
		data: Partial<FormData>
	): Promise<UnifiedActivity> {
		const activity = await this.db.classActivity.update({
			where: { id },
			data: {
				...data,
				resources: data.resources ? {
					deleteMany: {},
					create: data.resources
				} : undefined
			},
			include: {
				subject: true,
				class: true,
				resources: true
			}
		});

		return activity as UnifiedActivity;
	}

	async deleteActivity(id: string): Promise<void> {
		await this.db.classActivity.delete({
			where: { id }
		});
	}

	async cloneTemplate(
		templateId: string, 
		classId: string
	): Promise<UnifiedActivity> {
		const template = await this.db.classActivity.findUnique({
			where: { id: templateId },
			include: {
				resources: true
			}
		});

		if (!template) {
			throw new Error('Template not found');
		}

		const activity = await this.createActivity({
			...template,
			classId,
			scope: ActivityScope.CLASS,
			isTemplate: false,
			resources: template.resources
		} as FormData);

		return activity;
	}
}