import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { eq, and } from "drizzle-orm";
import { verification } from "@/server/db/schema";

export const passwordResetsRouter = createTRPCRouter({
  checkForValidToken: publicProcedure
    .input(
      z.object({
        token: z.string()
      })
    ).query(async ({ input }) => {
      return db.query.verification.findFirst({
        where: and(
          eq(verification.value, input.token),
        )
      })
    }),
});
