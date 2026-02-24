import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { certificates, templates } from "@/server/db/schema";
import { db } from "@/server/db";
import { and, eq, gte, ne, sql } from "drizzle-orm";
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
      columns: {
        id: true,
        templateId: true,
        userId: true,
        recipientName: true,
        recipientEmail: true,
        sentAt: true,
        certificateUrl: true,
        validationToken: true,
        createdAt: true,
      }, // Optimalizace - nenačítáme dlouhý recipientData a velký certificateUrl, který tu není potřeba
      orderBy: (certificates, { desc }) => [desc(certificates.createdAt)],
    });
  }),

  getById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const certificate = await ctx.db.query.certificates.findFirst({
        where: and(
          eq(certificates.id, input.id),
          eq(certificates.userId, ctx.session.user.id),
        ),
        with: {
          template: true,
        },
      });

      if (!certificate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Certifikát nebyl nalezen, nebo nemáte oprávnění k jeho zobrazení.",
        });
      }

      return certificate;
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
          eq(certificates.templateId, input.templateId),
        ),
      );
    }),

  getByTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.certificates.findMany({
        where: and(
          eq(certificates.userId, ctx.session.user.id),
          eq(certificates.templateId, input.templateId),
        ),
        orderBy: (certificates, { desc }) => [desc(certificates.createdAt)],
        columns: {
          id: true,
          recipientName: true,
          recipientEmail: true,
          createdAt: true,
          sentAt: true,
        },
      });
    }),

  getByValidationToken: protectedProcedure
    .input(
      z.object({
        validationToken: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const certificate = await db.query.certificates.findFirst({
        where: and(eq(certificates.validationToken, input.validationToken)),
      });

      if (!certificate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Certifikát nebyl nalezen, nebo nemáte oprávnění k jeho zobrazení.",
        });
      }

      return certificate;
    }),

  createCertificate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        recipientName: z.string().min(1),
        recipientEmail: z.string().min(1),
        recipientData: z.record(z.unknown()),
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

      // Increment downloads if using someone else's template
      await db
        .update(templates)
        .set({ downloads: sql`${templates.downloads} + 1` })
        .where(
          and(
            eq(templates.id, input.templateId),
            ne(templates.userId, ctx.session.user.id),
          ),
        );

      return newCertificate;
    }),

  createBatch: protectedProcedure
    .input(
      z.array(
        z.object({
          templateId: z.string(),
          recipientName: z.string().min(1),
          recipientEmail: z.string().min(1),
          recipientData: z.record(z.unknown()),
          certificateUrl: z.string(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.length === 0) return [];

      const values = input.map((cert) => ({
        templateId: cert.templateId,
        userId: ctx.session.user.id,
        recipientName: cert.recipientName,
        recipientEmail: cert.recipientEmail,
        recipientData: cert.recipientData,
        certificateUrl: cert.certificateUrl,
        validationToken: "", // Will be generated by default or needs logic
        // Note: The schema has validationToken as NOT NULL.
        // We should probably generate it here if the DB default isn't sufficient or if we want specific logic.
        // Assuming empty string is a placeholder or we need a generator.
        // Let's use crypto.randomUUID() or similar if available, or just a simple random string.
        // Since we don't have crypto imported, and schema has it as unique, let's use a simple unique string generator or rely on DB if it had a default (it doesn't have default).
        // I will import crypto or use a simple randomizer.
      }));

      // Fix validationToken uniqueness:
      // We can't insert empty string for all if it's unique.
      const valuesWithToken = values.map((v) => ({
        ...v,
        validationToken:
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15),
      }));

      const result = await db
        .insert(certificates)
        .values(valuesWithToken)
        .returning();

      // Increment downloads for each unique foreign template used
      const uniqueTemplateIds = [...new Set(input.map((c) => c.templateId))];
      for (const templateId of uniqueTemplateIds) {
        const count = input.filter((c) => c.templateId === templateId).length;
        await db
          .update(templates)
          .set({ downloads: sql`${templates.downloads} + ${count}` })
          .where(
            and(
              eq(templates.id, templateId),
              ne(templates.userId, ctx.session.user.id),
            ),
          );
      }

      return result;
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
          message:
            "Certificate not found or you do not have permission to edit it.",
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
