import { Status } from "./enums";
import { StudentProfile } from "./student";
import { TeacherClass } from "./teacher";

export interface Class {
    id: string;
    name: string;
    classGroupId: string;
    capacity: number;
    status: Status;
    students: StudentProfile[];
    teachers: TeacherClass[];
    createdAt: Date;
    updatedAt: Date;
}
