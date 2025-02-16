import { createTRPCRouter } from "./trpc";
import { activityRouter } from "./routers/activity";
import { curriculumRouter } from "./routers/curriculum";

export const appRouter = createTRPCRouter({
  activity: activityRouter,
  curriculum: curriculumRouter,
});




export type AppRouter = typeof appRouter;
