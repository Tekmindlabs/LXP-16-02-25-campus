import { Status } from "@prisma/client";
import type { Campus } from "./campus";

export interface CampusClass {
	id: string;
	name: string;
	code: string;
	campusId: string;
	campus: Campus;
	status: Status;
	capacity: number;
	gradeBook?: CampusGradeBook;
	students?: CampusStudent[];
	teachers?: CampusTeacher[];
	createdAt: Date;
	updatedAt: Date;
}

export interface CampusStudent {
	id: string;
	userId: string;
	campusId: string;
	classId: string;
	status: Status;
	enrollmentDate: Date;
	campus?: Campus;
	class?: CampusClass;
	createdAt: Date;
	updatedAt: Date;
}

export interface CampusTeacher {
	id: string;
	userId: string;
	campusId: string;
	status: Status;
	campus?: Campus;
	classes?: CampusClass[];
	subjects?: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface CampusGradeBook {
	id: string;
	classId: string;
	class: CampusClass;
	termId: string;
	grades: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
}

export interface CampusAttendance {
	id: string;
	studentId: string;
	classId: string;
	date: Date;
	status: AttendanceStatus;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}

export enum AttendanceStatus {
	PRESENT = 'PRESENT',
	ABSENT = 'ABSENT',
	LATE = 'LATE',
	EXCUSED = 'EXCUSED'
}