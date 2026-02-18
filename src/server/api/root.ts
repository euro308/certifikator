import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { certificatesRouter } from "./routers/certificatesRouter";
import { templatesRouter } from "@/server/api/routers/templatesRouter";
import { emailsRouter } from "@/server/api/routers/emailsRouter";
import { passwordResetsRouter } from "@/server/api/routers/passwordResetsRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  certificates: certificatesRouter,
  templates: templatesRouter,
  emails: emailsRouter,
  passwordResets: passwordResetsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
