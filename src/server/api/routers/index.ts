import { createTRPCRouter } from "../trpc";
import { campusRouter } from "./campus";
import { classRouter } from "./class";
import { classGroupRouter } from "./class-group";
import { subjectRouter } from "./subject";

export const appRouter = createTRPCRouter({
	campus: campusRouter,
	class: classRouter,
	classGroup: classGroupRouter,
	subject: subjectRouter,
});

export type AppRouter = typeof appRouter;