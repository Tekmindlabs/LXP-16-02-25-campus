import { Status, Campus as PrismaCampus, Program, ClassGroup } from "@prisma/client";
import { TeacherProfile } from "./teacher";
import { StudentProfile } from "./student";
import { Class } from "./class";

export interface CampusContextType {
	currentCampus: PrismaCampus | null;
	setCurrentCampus: (campus: PrismaCampus | null) => void;
	programs: Program[];
	classGroups: ClassGroup[];
	refreshData: () => void;
}

export enum CampusPermission {
	MANAGE_USERS = "MANAGE_USERS",
	MANAGE_PROGRAMS = "MANAGE_PROGRAMS",
	MANAGE_CLASSES = "MANAGE_CLASSES",
	MANAGE_CLASSROOMS = "MANAGE_CLASSROOMS",
	VIEW_ANALYTICS = "VIEW_ANALYTICS",
	MANAGE_SETTINGS = "MANAGE_SETTINGS"
}

export interface CampusRole {
	id: string;
	userId: string;
	campusId: string;
	role: string;
	permissions: string[];
}

export interface PerformanceMetrics {
	id: string;
	campusId: string;
	responseTime: number;
	memoryUsage: number;
	cpuUsage: number;
	activeUsers: number;
	timestamp: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface EndpointMetrics {
	id: string;
	campusId: string;
	path: string;
	method: string;
	totalRequests: number;
	averageResponseTime: number;
	errorRate: number;
	lastUpdated: Date;
	createdAt: Date;
	updatedAt: Date;
}

export enum CampusType {
	MAIN = 'MAIN',
	BRANCH = 'BRANCH'
}

export enum RoomType {
	CLASSROOM = 'CLASSROOM',
	LAB = 'LAB',
	ACTIVITY_ROOM = 'ACTIVITY_ROOM',
	LECTURE_HALL = 'LECTURE_HALL'
}

export enum RoomStatus {
	ACTIVE = 'ACTIVE',
	MAINTENANCE = 'MAINTENANCE',
	INACTIVE = 'INACTIVE'
}

export { Status };


export interface Campus {
	id: string;
	name: string;
	code: string;
	establishmentDate: Date;
	type: CampusType;
	status: Status;
	
	// Location Information
	streetAddress: string;
	city: string;
	state: string;
	country: string;
	postalCode: string;
	gpsCoordinates?: string;
	
	// Contact Information
	primaryPhone: string;
	secondaryPhone?: string;
	email: string;
	emergencyContact: string;
	
	// Relations
	buildings?: Building[];

	// Audit fields
	createdAt: Date;
	updatedAt: Date;
}

export interface Building {
	id: string;
	name: string;
	code: string;
	campusId: string;
	campus?: Campus;
	floors?: Floor[];
}

export interface Floor {
	id: string;
	number: number;
	buildingId: string;
	building?: Building;
	wings?: Wing[];
}

export interface Wing {
	id: string;
	name: string;
	floorId: string;
	floor?: Floor;
	rooms?: Room[];
}

export interface Room {
	id: string;
	number: string;
	wingId: string;
	wing?: Wing;
	type: RoomType;
	capacity: number;
	status: RoomStatus;
	resources?: Record<string, any>;
}

export interface CampusClass extends Omit<Class, 'room' | 'campus' | 'building'> {
	campus: {
		id: string;
		name: string;
	};
	building: {
		id: string;
		name: string;
	};
	room: {
		id: string;
		number: string;
		type: RoomType;
		capacity: number;
	};
	campusTeachers: CampusTeacher[];
	campusStudents: CampusStudent[];
}

export interface CampusTeacher extends TeacherProfile {
	campus: {
		id: string;
		name: string;
	};
	assignedBuildings: {
		id: string;
		name: string;
	}[];
	assignedRooms: {
		id: string;
		number: string;
		type: RoomType;
	}[];
}

export interface CampusStudent extends StudentProfile {
	campus: {
		id: string;
		name: string;
	};
	assignedBuilding: {
		id: string;
		name: string;
	};
	assignedRoom: {
		id: string;
		number: string;
		type: RoomType;
	};
}

export interface CampusAttendance {
	id: string;
	student: CampusStudent;
	class: CampusClass;
	date: Date;
	status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
	notes?: string;
	markedBy: CampusTeacher;
	room: {
		id: string;
		number: string;
		type: RoomType;
	};
	building: {
		id: string;
		name: string;
	};
}

export interface CampusGradeBook {
	id: string;
	class: CampusClass;
	term: {
		id: string;
		name: string;
	};
	subjects: {
		id: string;
		name: string;
		teacher: CampusTeacher;
		grades: {
			studentId: string;
			grade: number;
			remarks?: string;
		}[];
	}[];
}