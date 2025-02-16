import { createTRPCRouter } from "@/server/api/trpc";
import { activityRouter } from "./routers/activity";
import { settingsRouter } from "./routers/settings";
import { campusRouter } from "./routers/campus";
import { userRouter } from "./routers/user";
import { buildingRouter } from "./routers/building";
import { floorRouter } from "./routers/floor";
import { wingRouter } from "./routers/wing";
import { roomRouter } from "./routers/room";
import { curriculumRouter } from "./routers/curriculum";
import { roleRouter } from "./routers/role";
import { gradebookRouter } from "./routers/gradebook";
import { attendanceRouter } from "./routers/attendance";
import { historicalDataRouter } from "./routers/historical-data";
import { academicYearRouter } from "./routers/academic-year";
import { permissionRouter } from "./routers/permission";
import { knowledgeBaseRouter } from "./routers/knowledge-base";
import { workspaceRouter } from "./routers/workspace";
import { calendarRouter } from "./routers/calendar";
import { academicCalendarRouter } from "./routers/academic-calendar";
import { programRouter } from "./routers/program";
import { classGroupRouter } from "./routers/class-group";
import { classRouter } from "./routers/class";
import { termRouter } from "./routers/term";
import { subjectRouter } from "./routers/subject";
import { teacherRouter } from "./routers/teacher";
import { studentRouter } from "./routers/student";
import { timetableRouter } from "./routers/timetable";
import { classroomRouter } from "./routers/classroom";
import { messageRouter } from "./routers/message";
import { notificationRouter } from "./routers/notification";
import { classActivityRouter } from "./routers/class-activity";
import { coordinatorRouter } from "./routers/coordinator";
import { assessmentRouter } from "./routers/assessment";


export const appRouter = createTRPCRouter({
  activity: activityRouter,
  settings: settingsRouter,
  campus: campusRouter,
  user: userRouter,
  role: roleRouter,
  permission: permissionRouter,
  academicCalendar: academicCalendarRouter,
  program: programRouter,
  classGroup: classGroupRouter,
  class: classRouter,
  term: termRouter,
  subject: subjectRouter,
  teacher: teacherRouter,
  student: studentRouter,
  timetable: timetableRouter,
  classroom: classroomRouter,
  message: messageRouter,
  notification: notificationRouter,
  classActivity: classActivityRouter,
  calendar: calendarRouter,
  coordinator: coordinatorRouter,
  knowledgeBase: knowledgeBaseRouter,
  workspace: workspaceRouter,
  attendance: attendanceRouter,
  academicYear: academicYearRouter,
  historicalData: historicalDataRouter,
  gradebook: gradebookRouter,
  assessment: assessmentRouter,
  curriculum: curriculumRouter,
  building: buildingRouter,
  floor: floorRouter,
  wing: wingRouter,
  room: roomRouter,
});



export type AppRouter = typeof appRouter;
