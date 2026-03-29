import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { certificates, templates } from "@/server/db/schema";
import { db } from "@/server/db";
import { and, eq, gte, ne, sql, or, ilike } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const certificatesRouter = createTRPCRouter({
  getUserCertificateCount: protectedProcedure.query(async ({ ctx }) => {
    return db.$count(
      certificates,
      eq(certificates.userId, ctx.session.user.id),
    );
  }),

  pastWeeksChange: protectedProcedure.query(async ({ ctx }) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return db.$count(
      certificates,
      and(
        eq(certificates.userId, ctx.session.user.id),
        gte(certificates.createdAt, weekAgo),
      ),
    );
  }),

  getUserCertificates: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).nullish(),
          cursor: z.number().nullish(),
          search: z.string().optional(),
          sortBy: z.enum(["name", "email", "date"]).nullish(),
          sortDir: z.enum(["asc", "desc"]).nullish(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const search = input?.search?.trim();
      const limit = input?.limit ?? 50;
      const offset = input?.cursor ?? 0;
      const sortBy = input?.sortBy ?? "date";
      const sortDir = input?.sortDir ?? "desc";

      const isValidUuid = search
        ? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            search,
          )
        : false;

      const searchCondition = search
        ? or(
            ilike(certificates.recipientName, `%${search}%`),
            ilike(certificates.recipientEmail, `%${search}%`),
            isValidUuid ? eq(certificates.id, search) : undefined,
            isValidUuid ? eq(certificates.templateId, search) : undefined,
          )
        : undefined;

      const certs = await ctx.db.query.certificates.findMany({
        where: and(
          eq(certificates.userId, ctx.session.user.id),
          searchCondition,
        ),
        columns: {
          id: true,
          templateId: true,
          userId: true,
          recipientName: true,
          recipientEmail: true,
          sentAt: true,
          thumbnailImageUrl: true,
          certificateUrl: true,
          validationToken: true,
          createdAt: true,
        }, // Optimalizace - nenačítáme dlouhý recipientData a velký certificateUrl, který tu není potřeba
        orderBy: (certificates, { asc, desc }) => {
          if (sortBy === "name")
            return sortDir === "asc"
              ? [asc(certificates.recipientName)]
              : [desc(certificates.recipientName)];
          if (sortBy === "email")
            return sortDir === "asc"
              ? [asc(certificates.recipientEmail)]
              : [desc(certificates.recipientEmail)];
          return sortDir === "asc"
            ? [asc(certificates.createdAt)]
            : [desc(certificates.createdAt)];
        },
        limit: limit + 1,
        offset: offset,
      });

      let nextCursor: typeof offset | undefined = undefined;
      if (certs.length > limit) {
        certs.pop();
        nextCursor = offset + limit;
      }

      return {
        items: certs.map((c) => ({
          ...c,
          certificateUrl: c.certificateUrl ?? "",
          thumbnailImageUrl: c.thumbnailImageUrl ?? "",
        })),
        nextCursor,
      };
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

  getCertificateUrl: protectedProcedure
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
        columns: {
          certificateUrl: true,
        },
      });

      if (!certificate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Certifikát nebyl nalezen, nebo nemáte oprávnění k jeho zobrazení.",
        });
      }

      return { certificateUrl: certificate.certificateUrl ?? "" };
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
        thumbnailImageUrl: z.string(),
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
          thumbnailImageUrl: input.thumbnailImageUrl,
          validationToken: "",
        })
        .returning();

      // Zvýšit počet stáhnutí při použití cizí šablony
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
          thumbnailImageUrl: z.string(),
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
        thumbnailImageUrl: cert.thumbnailImageUrl,
        validationToken: "",
      }));

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

      const mappedResult = result.map((c) => ({
        ...c,
        certificateUrl: c.certificateUrl ?? "",
        thumbnailImageUrl: c.thumbnailImageUrl ?? "",
      }));

      // Zvýšit počet stáhnutí pro každou využitou cizí šablonu
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

      return mappedResult;
    }),

  deleteCertificate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Ověření vlastnictví
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
