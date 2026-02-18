import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { passwordResets } from "@/server/db/schema";

export const passwordResetsRouter = createTRPCRouter({
  checkForValidToken: publicProcedure
    .input(
      z.object({
        token: z.string()
      })
    ).query(async ({ input }) => {
      return db.query.passwordResets.findFirst({
        where: eq(passwordResets.token, input.token)
      })
    }),
});
