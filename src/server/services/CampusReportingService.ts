import { PrismaClient } from "@prisma/client";
import { CampusUserService } from "./CampusUserService";
import { CampusPermission } from "../../types/enums";
import { TRPCError } from "@trpc/server";

interface AttendanceStats {
	totalStudents: number;
	averageAttendance: number;
	byStatus: Record<string, number>;
	byClass: Array<{
		classId: string;
		className: string;
		attendanceRate: number;
	}>;
}

interface AcademicPerformance {
	overallAverage: number;
	bySubject: Array<{
		subjectId: string;
		subjectName: string;
		average: number;
		passingRate: number;
	}>;
	byClass: Array<{
		classId: string;
		className: string;
		average: number;
	}>;
}

interface TeacherStats {
	totalTeachers: number;
	bySubject: Record<string, number>;
	classDistribution: Array<{
		teacherId: string;
		teacherName: string;
		classCount: number;
		subjectCount: number;
	}>;
}

export class CampusReportingService {
	constructor(
		private readonly db: PrismaClient,
		private readonly campusUserService: CampusUserService
	) {}

	async getAttendanceStats(
		userId: string,
		campusId: string,
		startDate: Date,
		endDate: Date
	): Promise<AttendanceStats> {
		const hasPermission = await this.campusUserService.hasPermission(
			userId,
			campusId,
			CampusPermission.VIEW_CAMPUS
		);

		if (!hasPermission) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Insufficient permissions to view attendance stats"
			});
		}

		const attendance = await this.db.attendance.findMany({
			where: {
				class: {
					campus: { id: campusId }
				},
				date: {
					gte: startDate,
					lte: endDate
				}
			},
			include: {
				class: true
			}
		});

		const totalStudents = await this.db.studentProfile.count({
			where: {
				class: {
					campus: { id: campusId }
				}
			}
		});

		const byStatus = attendance.reduce((acc, record) => {
			acc[record.status] = (acc[record.status] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		const byClass = await this.calculateClassAttendance(attendance);

		const averageAttendance = attendance.length > 0
			? (byStatus['PRESENT'] || 0) / attendance.length * 100
			: 0;

		return {
			totalStudents,
			averageAttendance,
			byStatus,
			byClass
		};
	}

	async getAcademicPerformance(
		userId: string,
		campusId: string,
		termId: string
	): Promise<AcademicPerformance> {
		const hasPermission = await this.campusUserService.hasPermission(
			userId,
			campusId,
			CampusPermission.VIEW_GRADES
		);

		if (!hasPermission) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Insufficient permissions to view academic performance"
			});
		}

		const gradeRecords = await this.db.subjectGradeRecord.findMany({
			where: {
				gradeBook: {
					class: {
						campus: { id: campusId }
					}
				}
			},
			include: {
				subject: true,
				gradeBook: {
					include: {
						class: true
					}
				}
			}
		});

		const bySubject = await this.calculateSubjectPerformance(gradeRecords);
		const byClass = await this.calculateClassPerformance(gradeRecords);

		const overallAverage = bySubject.reduce(
			(sum, subject) => sum + subject.average,
			0
		) / (bySubject.length || 1);

		return {
			overallAverage,
			bySubject,
			byClass
		};
	}

	async getTeacherStats(
		userId: string,
		campusId: string
	): Promise<TeacherStats> {
		const hasPermission = await this.campusUserService.hasPermission(
			userId,
			campusId,
			CampusPermission.VIEW_CAMPUS_USERS
		);

		if (!hasPermission) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Insufficient permissions to view teacher stats"
			});
		}

		const teachers = await this.db.teacherProfile.findMany({
			where: {
				classes: {
					some: {
						class: {
							campus: { id: campusId }
						}
					}
				}
			},
			include: {
				user: true,
				classes: true,
				subjects: true
			}
		});

		const totalTeachers = teachers.length;

		const bySubject = teachers.reduce((acc, teacher) => {
			teacher.subjects.forEach(subject => {
				acc[subject.subjectId] = (acc[subject.subjectId] || 0) + 1;
			});
			return acc;
		}, {} as Record<string, number>);

		const classDistribution = teachers.map(teacher => ({
			teacherId: teacher.id,
			teacherName: teacher.user.name || 'Unknown',
			classCount: teacher.classes.length,
			subjectCount: teacher.subjects.length
		}));

		return {
			totalTeachers,
			bySubject,
			classDistribution
		};
	}

	private async calculateClassAttendance(attendance: any[]) {
		const classGroups = attendance.reduce((acc, record) => {
			const classId = record.class.id;
			if (!acc[classId]) {
				acc[classId] = {
					total: 0,
					present: 0,
					className: record.class.name
				};
			}
			acc[classId].total++;
			if (record.status === 'PRESENT') {
				acc[classId].present++;
			}
			return acc;
		}, {} as Record<string, any>);

		return Object.entries(classGroups).map(([classId, data]) => ({
			classId,
			className: data.className,
			attendanceRate: (data.present / data.total) * 100
		}));
	}

	private async calculateSubjectPerformance(gradeRecords: any[]) {
		const subjectGroups = gradeRecords.reduce((acc, record) => {
			const subjectId = record.subject.id;
			if (!acc[subjectId]) {
				acc[subjectId] = {
					subjectId,
					subjectName: record.subject.name,
					grades: [],
					passing: 0,
					total: 0
				};
			}
			const grades = record.termGrades || {};
			Object.values(grades).forEach((grade: any) => {
				acc[subjectId].grades.push(grade.value);
				acc[subjectId].total++;
				if (grade.value >= 50) {
					acc[subjectId].passing++;
				}
			});
			return acc;
		}, {} as Record<string, any>);

		return Object.values(subjectGroups).map(subject => ({
			subjectId: subject.subjectId,
			subjectName: subject.subjectName,
			average: subject.grades.reduce((a: number, b: number) => a + b, 0) / (subject.grades.length || 1),
			passingRate: (subject.passing / subject.total) * 100
		}));
	}

	private async calculateClassPerformance(gradeRecords: any[]) {
		const classGroups = gradeRecords.reduce((acc, record) => {
			const classId = record.gradeBook.class.id;
			if (!acc[classId]) {
				acc[classId] = {
					classId,
					className: record.gradeBook.class.name,
					grades: []
				};
			}
			const grades = record.termGrades || {};
			Object.values(grades).forEach((grade: any) => {
				acc[classId].grades.push(grade.value);
			});
			return acc;
		}, {} as Record<string, any>);

		return Object.values(classGroups).map(classGroup => ({
			classId: classGroup.classId,
			className: classGroup.className,
			average: classGroup.grades.reduce((a: number, b: number) => a + b, 0) / (classGroup.grades.length || 1)
		}));
	}
}