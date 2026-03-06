import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import {
  user,
  templates,
  certificates,
  templateReports,
} from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { count, desc, eq, ne, ilike, or, sql, and } from "drizzle-orm";
import { Resend } from "resend";
import { EmailTemplate } from "@/components/emails/email-template";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Zkontroluje, zda je přihlášený uživatel administrátor.
 * Vyhazuje TRPCError pokud ne.
 */
const requireAdmin = (userId: string) => {
  if (userId !== process.env.OFFICIAL_USER_ID) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Přístup odepřen. Tato akce vyžaduje administrátorská práva.",
    });
  }
};

export const adminRouter = createTRPCRouter({
  getOverviewStats: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session.user.id);

    const [
      usersResult,
      templatesResult,
      publicTemplatesResult,
      certificatesResult,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(user)
        .where(ne(user.id, process.env.OFFICIAL_USER_ID!)),
      db.select({ count: count() }).from(templates),
      db
        .select({ count: count() })
        .from(templates)
        .where(eq(templates.isPublic, true)),
      db.select({ count: count() }).from(certificates),
    ]);

    return {
      totalUsers: usersResult[0]?.count ?? 0,
      totalTemplates: templatesResult[0]?.count ?? 0,
      totalPublicTemplates: publicTemplatesResult[0]?.count ?? 0,
      totalCertificates: certificatesResult[0]?.count ?? 0,
    };
  }),

  // -- STAŽENÍ ŠABLONY Z GALERIE --
  takeDownTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        reason: z.string().min(1, "Důvod je povinný"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.id);

      // 1. Získáme info o šabloně a uživateli
      const templateData = await db.query.templates.findFirst({
        where: eq(templates.id, input.templateId),
        columns: {
          id: true,
          name: true,
        },
        with: { user: true },
      });

      if (!templateData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Šablona nebyla nalezena.",
        });
      }

      // 2. Skryjeme šablonu (změníme isPublic na false)
      await db
        .update(templates)
        .set({ isPublic: false })
        .where(eq(templates.id, input.templateId));

      // 3. Smažeme všechny reporty pro danou šablonu, protože už byla stažena
      await db
        .delete(templateReports)
        .where(eq(templateReports.templateId, input.templateId));

      // 4. Pošleme notifikační e-mail autorovi (pokud existuje)
      if (templateData.user?.email) {
        try {
          await resend.emails.send({
            from: "Certifikátor <info@certifikator.eu>",
            to: templateData.user.email,
            subject: "Šablona odstraněna z veřejné galerie",
            react: EmailTemplate({
              emailType: "TEMPLATE_TAKEN_DOWN",
              templateName: templateData.name,
              templateId: templateData.id,
              reason: input.reason,
            }),
          });
        } catch (err) {
          console.error("Nepodařilo se odeslat email o stažení šablony:", err);
          // Necháme projít, šablona se stáhla, e-mail je bonusový side-effect
        }
      }

      return { success: true };
    }),

  // -- NAHLÁŠENÍ (REPORTS) --
  getReports: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session.user.id);

    // Vytáhneme všechny reporty a agregujeme je podle šablon
    const reports = await db.query.templateReports.findMany({
      with: {
        template: {
          with: { user: true },
        },
      },
      orderBy: [desc(templateReports.createdAt)],
    });

    type GroupedReport = {
      templateId: string;
      templateName: string;
      templateDescription: string | null;
      thumbnailImageUrl: string | null;
      authorName: string;
      reportCount: number;
      latestReportAt: Date;
    };

    // Grouping by template ID
    const grouped = new Map<string, GroupedReport>();

    for (const report of reports) {
      if (!report.template) continue; // Skip if templated was deleted outside cascade

      const tid = report.template.id;
      if (!grouped.has(tid)) {
        grouped.set(tid, {
          templateId: tid,
          templateName: report.template.name,
          templateDescription: report.template.description,
          thumbnailImageUrl: report.template.thumbnailImageUrl,
          authorName: report.template.user?.name || "Neznámý",
          reportCount: 0,
          latestReportAt: report.createdAt,
        });
      }

      const entry = grouped.get(tid);
      if (entry) {
        entry.reportCount += 1;
        // We rely on orderBy desc earlier to have the first one be the latest,
        // but let's be safe:
        if (new Date(report.createdAt) > new Date(entry.latestReportAt)) {
          entry.latestReportAt = report.createdAt;
        }
      }
    }

    return Array.from(grouped.values()).sort(
      (a, b) =>
        new Date(b.latestReportAt).getTime() -
        new Date(a.latestReportAt).getTime(),
    );
  }),

  // -- DETAIL REPORTŮ PRO KONKRÉTNÍ ŠABLONU --
  getTemplateReports: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.id);

      const template = await db.query.templates.findFirst({
        where: eq(templates.id, input.templateId),
        with: { user: true },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Šablona nebyla nalezena.",
        });
      }

      const reports = await db.query.templateReports.findMany({
        where: eq(templateReports.templateId, input.templateId),
        with: { reporter: true },
        orderBy: [desc(templateReports.createdAt)],
      });

      return {
        template: {
          ...template,
          authorName: template.user?.name || "Neznámý autor",
        },
        reports: reports.map((r) => ({
          ...r,
          reporterName: r.reporter?.name || "Neznámý uživatel",
          reporterEmail: r.reporter?.email || "",
        })),
      };
    }),

  deleteReport: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.id);

      await db
        .delete(templateReports)
        .where(eq(templateReports.id, input.reportId));

      return { success: true };
    }),

  // -- VYZVEDNUTÍ VŠECH ŠABLON V SYSTÉMU --
  getAllTemplates: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).nullish(),
          cursor: z.number().nullish(),
          search: z.string().nullish(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.id);

      const limit = input?.limit ?? 20;
      const offset = input?.cursor ?? 0;
      const search = input?.search?.trim();

      const isValidUuid = search
        ? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            search,
          )
        : false;

      const searchCondition = search
        ? or(
            ilike(templates.name, `%${search}%`),
            ilike(templates.description, `%${search}%`),
            ilike(user.name, `%${search}%`),
            isValidUuid ? eq(templates.userId, search) : undefined,
            isValidUuid ? eq(templates.id, search) : undefined,
          )
        : undefined;

      const baseQuery = db
        .select({
          id: templates.id,
          userId: templates.userId,
          name: templates.name,
          description: templates.description,
          isPublic: templates.isPublic,
          downloads: templates.downloads,
          createdAt: templates.createdAt,
          updatedAt: templates.updatedAt,
          deletedAt: templates.deletedAt,
          authorName: user.name,
        })
        .from(templates)
        .leftJoin(user, eq(templates.userId, user.id))
        .where(searchCondition)
        .orderBy(desc(templates.createdAt))
        .limit(limit + 1)
        .offset(offset);

      const results = await baseQuery;

      let nextCursor: typeof offset | undefined = undefined;
      if (results.length > limit) {
        results.pop(); // remove last item
        nextCursor = offset + limit;
      }

      return {
        items: results.map((t) => ({
          ...t,
          authorName: t.authorName ?? "Neznámý autor",
        })),
        nextCursor,
      };
    }),

  // -- VYZVEDNUTÍ DETAILU ŠABLONY (PRO ADMINA) --
  getTemplateById: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.id);

      const template = await db.query.templates.findFirst({
        where: eq(templates.id, input.templateId),
        with: { user: true },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Šablona nebyla nalezena.",
        });
      }

      return {
        ...template,
        authorName: template.user?.name || "Neznámý autor",
        user: template.user,
      };
    }),

  // -- VYZVEDNUTÍ VŠECH CERTIFIKÁTŮ S PAGINACÍ --
  getAllCertificates: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).nullish(),
          cursor: z.number().nullish(),
          search: z.string().nullish(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.id);

      const limit = input?.limit ?? 20;
      const offset = input?.cursor ?? 0;
      const search = input?.search?.trim();

      const isValidUuid = search
        ? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            search,
          )
        : false;

      const searchCondition = search
        ? or(
            ilike(certificates.recipientName, `%${search}%`),
            ilike(certificates.recipientEmail, `%${search}%`),
            ilike(user.name, `%${search}%`),
            isValidUuid ? eq(certificates.id, search) : undefined,
            isValidUuid ? eq(certificates.userId, search) : undefined,
            isValidUuid ? eq(certificates.templateId, search) : undefined,
          )
        : undefined;

      const results = await db
        .select({
          id: certificates.id,
          templateId: certificates.templateId,
          userId: certificates.userId,
          recipientName: certificates.recipientName,
          recipientEmail: certificates.recipientEmail,
          sentAt: certificates.sentAt,
          createdAt: certificates.createdAt,
          authorName: user.name,
        })
        .from(certificates)
        .leftJoin(user, eq(certificates.userId, user.id))
        .where(searchCondition)
        .orderBy(desc(certificates.createdAt))
        .limit(limit + 1)
        .offset(offset);

      let nextCursor: typeof offset | undefined = undefined;
      if (results.length > limit) {
        results.pop();
        nextCursor = offset + limit;
      }

      return {
        items: results.map((c) => ({
          ...c,
          authorName: c.authorName ?? "Neznámý uživatel",
        })),
        nextCursor,
      };
    }),

  // -- VYZVEDNUTÍ DETAILU CERTIFIKÁTU (PRO ADMINA) --
  getCertificateById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.id);

      const certificate = await ctx.db.query.certificates.findFirst({
        where: eq(certificates.id, input.id),
        with: {
          template: true,
          user: true,
        },
      });

      if (!certificate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Certifikát nebyl nalezen, nebo nemáte oprávnění k jeho zobrazení.",
        });
      }

      return {
        ...certificate,
        creatorName: certificate.user?.name || "Neznámý uživatel",
        user: certificate.user,
      };
    }),

  // -- VYZVEDNUTÍ URL CERTIFIKÁTU (PRO ADMINA) --
  getCertificateUrl: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.id);

      const certificate = await ctx.db.query.certificates.findFirst({
        where: eq(certificates.id, input.id),
        columns: {
          certificateUrl: true,
          validationToken: true,
        },
      });

      if (!certificate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Certifikát nebyl nalezen.",
        });
      }

      return {
        certificateUrl: certificate.certificateUrl ?? "",
        validationToken: certificate.validationToken,
      };
    }),

  // -- VYZVEDNUTÍ VŠECH UŽIVATELŮ + JEJICH STATISTIK --
  getUsers: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).nullish(),
          cursor: z.number().nullish(),
          search: z.string().nullish(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.id);

      const limit = input?.limit ?? 20;
      const offset = input?.cursor ?? 0;
      const search = input?.search?.trim();

      const isValidUuid = search
        ? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            search,
          )
        : false;

      const searchCondition = search
        ? or(
            ilike(user.name, `%${search}%`),
            ilike(user.email, `%${search}%`),
            isValidUuid ? eq(user.id, search) : undefined,
          )
        : undefined;

      // Subquery pro počty šablon
      const templateCountSq = db
        .select({
          userId: templates.userId,
          count: count().as("tpl_count"),
        })
        .from(templates)
        .groupBy(templates.userId)
        .as("tpl_sq");

      // Subquery pro počty certifikátů
      const certCountSq = db
        .select({
          userId: certificates.userId,
          count: count().as("cert_count"),
        })
        .from(certificates)
        .groupBy(certificates.userId)
        .as("cert_sq");

      const results = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          templatesCount:
            sql<number>`COALESCE(${templateCountSq.count}, 0)`.mapWith(Number),
          certificatesCount:
            sql<number>`COALESCE(${certCountSq.count}, 0)`.mapWith(Number),
        })
        .from(user)
        .leftJoin(templateCountSq, eq(user.id, templateCountSq.userId))
        .leftJoin(certCountSq, eq(user.id, certCountSq.userId))
        .where(and(ne(user.id, process.env.OFFICIAL_USER_ID!), searchCondition))
        .orderBy(desc(user.createdAt))
        .limit(limit + 1)
        .offset(offset);

      let nextCursor: typeof offset | undefined = undefined;
      if (results.length > limit) {
        results.pop();
        nextCursor = offset + limit;
      }

      return {
        items: results,
        nextCursor,
      };
    }),

  deleteUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.id);

      // Drizzle ORM delete by user ID (cascade deletes defined in schema)
      await db.delete(user).where(eq(user.id, input.userId));

      return { success: true };
    }),
});
