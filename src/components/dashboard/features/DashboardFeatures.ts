import { DefaultRoles } from "@/utils/permissions";
import { DashboardFeature } from "@/types/dashboard";

type RoleFeatures = {
  [K in DefaultRoles]: DashboardFeature[];
};

export const DashboardFeatures: RoleFeatures = {
  "super-admin": [
    'system-metrics',
    'user-management',
    'role-management',
    'audit-logs',
    'advanced-settings',
    'academic-calendar',
    'timetable-management',
    'classroom-management',
    'class-activity-management',
    'knowledge-base'
  ],
  "admin": [
    'user-management',
    'audit-logs',
    'timetable-management',
    'classroom-management',
    'class-activity-management',
    'knowledge-base'
  ],
  "coordinator": [
    'class-management',
    'student-progress',
    'timetable-management',
    'class-activity-management',
    'knowledge-base'
  ],
  "teacher": [
    'class-management',
    'student-progress',
    'assignments',
    'grading',
    'class-activity-management',
    'knowledge-base'
  ],
  "student": [
    'assignments',
    'student-progress',
    'class-activities',
    'knowledge-base'
  ],
  "parent": [
    'student-progress',
    'class-activities'
  ]
};