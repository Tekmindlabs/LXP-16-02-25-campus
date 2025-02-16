import { createTRPCRouter } from "./trpc";
import { activityRouter } from "./routers/activity";
import { curriculumRouter } from "./routers/curriculum";
import { classRouter } from "./routers/class";
import { classGroupRouter } from "./routers/class-group";
import { subjectRouter } from "./routers/subject";
import { campusRouter } from "./routers/campus";

export const appRouter = createTRPCRouter({
  activity: activityRouter,
  curriculum: curriculumRouter,
  class: classRouter,
  classGroup: classGroupRouter,
  subject: subjectRouter,
  campus: campusRouter,
});

export type AppRouter = typeof appRouter;
