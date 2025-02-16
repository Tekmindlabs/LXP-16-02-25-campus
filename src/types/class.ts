import { Status, AssessmentSystemType } from "@prisma/client";
import { SubjectTermGrade, AssessmentPeriodGrade } from "./grades";

export interface Class {
    id: string;
    name: string;
    capacity: number;
    status: Status;
    description?: string;
    academicYear?: string;
    semester?: string;
    classTutorId?: string;
    gradeBook?: {
        id: string;
        assessmentSystem: {
            id: string;
            name: string;
            type: AssessmentSystemType;
        };
        termStructure: {
            id: string;
            name: string;
            academicTerms: Array<{
                id: string;
                name: string;
                assessmentPeriods: Array<{
                    id: string;
                    name: string;
                    weight: number;
                }>;
            }>;
        };
        subjectRecords: Array<{
            id: string;
            subject: {
                id: string;
                name: string;
            };
            termGrades: string | null; // JSON string
            assessmentPeriodGrades: string | null; // JSON string
        }>;
    };
    classGroup: {
        id: string;
        name: string;
        program: {
            id: string;
            name: string;
        };
    };
    students: {
        id: string;
        user: {
            name: string;
            email?: string;
        };
    }[];
    teachers: {
        teacher: {
            id: string;
            user: {
                name: string;
                email?: string;
            };
        };
        isClassTutor?: boolean;
        subjects?: {
            id: string;
            name: string;
        }[];
    }[];
}

export interface ClassStats {
    totalStudents: number;
    activeStudents: number;
    averageAttendance: number;
    averagePerformance: number;
}

export interface ClassActivity {
    id: string;
    type: 'ASSIGNMENT' | 'QUIZ' | 'EXAM';
    title: string;
    deadline?: Date;
    status: 'PENDING' | 'COMPLETED' | 'GRADED';
    averageScore?: number;
}