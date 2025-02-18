import { createTRPCRouter } from "./trpc";
import { activityRouter } from "./routers/activity";
import { curriculumRouter } from "./routers/curriculum";
import { classRouter } from "./routers/class";
import { classGroupRouter } from "./routers/class-group";
import { subjectRouter } from "./routers/subject";
import { campusRouter } from "./routers/campus";
import { programRouter } from "./routers/program";
import { calendarRouter } from "./routers/calendar";
import { studentRouter } from "./routers/student";
import { teacherRouter } from "./routers/teacher";
import { workspaceRouter } from "./routers/workspace";
import { campusRolePermissionRouter } from "./routers/campus-role-permission"; // ADDED LINE


export const appRouter = createTRPCRouter({
  campusRolePermission: campusRolePermissionRouter, // NEW LINE
  activity: activityRouter,
  curriculum: curriculumRouter,
  class: classRouter,
  classGroup: classGroupRouter,
  subject: subjectRouter,
  campus: campusRouter,
  program: programRouter,
  calendar: calendarRouter,
  student: studentRouter,
  teacher: teacherRouter,
  workspace: workspaceRouter,
});

export type AppRouter = typeof appRouter;
