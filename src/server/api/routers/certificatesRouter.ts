import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { certificates } from "@/server/db/schema";
import { db } from "@/server/db";
import { and, eq, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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

  createCertificate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        recipientName: z.string().min(1),
        recipientEmail: z.string().min(1),
        recipientData: z.any(),
        certificateUrl: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {

      const [newCertificate] = await db
        .insert(certificates)
        .values({
          templateId: input.templateId,
          userId: ctx.session.user.id,
          recipientName: input.recipientName,
          recipientEmail: input.recipientEmail,
          recipientData: input.recipientData,
          certificateUrl: input.certificateUrl,
          validationToken: "",
        })
        .returning();

      return newCertificate;
    }),

  deleteCertificate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Verify ownership
      const existingCertificate = await db.query.certificates.findFirst({
        where: and(
          eq(certificates.id, input.id),
          eq(certificates.userId, ctx.session.user.id),
        ),
      });

      if (!existingCertificate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Certificate not found or you do not have permission to edit it.",
        });
      }

      // 2. Update
      const [deletedCertificate] = await db
        .delete(certificates)
        .where(eq(certificates.id, input.id))
        .returning();

      return deletedCertificate;
    }),
});
