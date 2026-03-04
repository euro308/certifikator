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
import { count, desc, eq, ne } from "drizzle-orm";
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
  getAllTemplates: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session.user.id);

    const allTemplates = await db.query.templates.findMany({
      columns: {
        id: true,
        userId: true,
        name: true,
        description: true,
        isPublic: true,
        downloads: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      with: { user: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    return allTemplates.map((t) => ({
      ...t,
      authorName: t.user?.name || "Neznámý autor",
    }));
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

  // -- VYZVEDNUTÍ CERTIFIKÁTŮ UŽIVATELE (PRO ADMINA) --
  getUserCertificates: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.id);

      return db.query.certificates.findMany({
        where: eq(certificates.userId, input.userId),
        columns: {
          id: true,
          templateId: true,
          userId: true,
          recipientName: true,
          recipientEmail: true,
          sentAt: true,
          createdAt: true,
        },
        orderBy: (certificates, { desc }) => [desc(certificates.createdAt)],
      });
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
          message:
            "Certifikát nebyl nalezen.",
        });
      }

      return {
        certificateUrl: certificate.certificateUrl ?? "",
        validationToken: certificate.validationToken
      };
    }),

  // -- VYZVEDNUTÍ VŠECH UŽIVATELŮ + JEJICH STATISTIK --
  getUsers: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session.user.id);

    // Vytáhneme všechny uživatele
    const allUsers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(ne(user.id, process.env.OFFICIAL_USER_ID!));

    // Získáme agregované počty šablon pro každého uživatele
    const templatesGrouped = await db
      .select({ userId: templates.userId, count: count() })
      .from(templates)
      .groupBy(templates.userId);

    // Získáme agregované počty certifikátů pro každého uživatele
    const certsGrouped = await db
      .select({ userId: certificates.userId, count: count() })
      .from(certificates)
      .groupBy(certificates.userId);

    // Namapujeme data do finálního pole
    return allUsers.map((u) => {
      const tCount =
        templatesGrouped.find((t) => t.userId === u.id)?.count ?? 0;
      const cCount = certsGrouped.find((c) => c.userId === u.id)?.count ?? 0;
      return {
        ...u,
        templatesCount: tCount,
        certificatesCount: cCount,
      };
    });
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
