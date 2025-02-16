import { Status, CampusType } from "@prisma/client";

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
	createdAt: Date;
	updatedAt: Date;
}

export interface Floor {
	id: string;
	number: number;
	buildingId: string;
	building?: Building;
	wings?: Wing[];
	createdAt: Date;
	updatedAt: Date;
}

export interface Wing {
	id: string;
	name: string;
	floorId: string;
	floor?: Floor;
	rooms?: Room[];
	createdAt: Date;
	updatedAt: Date;
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
	periods?: Period[];
	createdAt: Date;
	updatedAt: Date;
}

export interface Period {
	id: string;
	startTime: Date;
	endTime: Date;
	durationInMinutes: number;
	dayOfWeek: number;
	subjectId: string;
	roomId?: string;
	timetableId: string;
	teacherId: string;
	createdAt: Date;
	updatedAt: Date;
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