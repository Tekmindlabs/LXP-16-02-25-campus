import { PrismaClient } from '@prisma/client';
import {
	ActivityScope,
	ActivityStatus,
	UnifiedActivity,
	FormData
} from '@/types/class-activity';

// Placeholder types
type ActivityInput = FormData;

interface ActivityFilters {
	subjectId?: string;
	classId?: string;
	curriculumNodeId?: string;
	scope?: ActivityScope;
	isTemplate?: boolean;
}
export class ActivityService {
	private activityCache = new Map<string, UnifiedActivity>();

	constructor(
		private readonly db: PrismaClient
	) { }

	// Renamed original createActivity to createActivity_old
	async createActivity_old(data: FormData): Promise<UnifiedActivity> {
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

	// Enhanced creation method
	async createActivity(data: ActivityInput): Promise<UnifiedActivity> {
		const baseActivity = await this.createBaseActivity(data);
		return data.scope === ActivityScope.CURRICULUM
			? this.extendForCurriculum(baseActivity)
			: this.extendForClass(baseActivity);
	}

	// Placeholder methods for the enhanced service
	private async createBaseActivity(data: ActivityInput): Promise<UnifiedActivity> {
		// Replace with actual implementation
		return this.createActivity_old(data);
	}

	private async extendForCurriculum(activity: UnifiedActivity): Promise<UnifiedActivity> {
		// Replace with actual implementation
		console.log("Extending for curriculum", activity);
		return activity;
	}

	private async extendForClass(activity: UnifiedActivity): Promise<UnifiedActivity> {
		// Replace with actual implementation
		console.log("Extending for class", activity);
		return activity;
	}

	// Optimized query builder
	private buildOptimizedQuery(filters: ActivityFilters) {
		return {
			where: this.buildWhereClause(filters),
			include: this.getRelevantIncludes(filters),
			orderBy: { createdAt: 'desc' }
		};
	}

	private buildWhereClause(filters: ActivityFilters) {
		// Replace with actual implementation to build where clause
		return {
			...filters
		}
	}

	private getRelevantIncludes(filters: ActivityFilters) {
		// Replace with actual implementation
		return {
			subject: true,
			class: true,
			resources: true,
			curriculumNode: true
		}
	}

	private async createCurriculumInheritance(activityId: string, subjectId: string) {
		interface ClassWithId {
			id: string;
		}

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
			data: classes.map((cls: ClassWithId) => ({
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