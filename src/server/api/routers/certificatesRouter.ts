import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { certificates } from "@/server/db/schema";
import { db } from "@/server/db";
import { and, eq, gte } from "drizzle-orm";

export const certificatesRouter = createTRPCRouter({
  getUserCertificateCount: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return db.$count(certificates, eq(certificates.userId, input.userId));
    }),

  pastWeeksChange: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      return db.$count(
        certificates,
        and(
          eq(certificates.userId, input.userId),
          gte(certificates.createdAt, weekAgo),
        ),
      );
    }),

  getUserCertificates: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.certificates.findMany({
      where: eq(certificates.userId, ctx.session.user.id),
      orderBy: (certificates, { desc }) => [desc(certificates.createdAt)],
    });
  }),

  getCertificateCountByTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.$count(
        certificates,
        and(
          eq(certificates.userId, ctx.session.user.id),
          eq(certificates.templateId, input.templateId)
        )
      );
    }),
});
