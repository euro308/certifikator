import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import {
  certificates,
  templates,
  templateFavorites,
  user,
} from "@/server/db/schema";
import { db } from "@/server/db";
import { and, count, desc, eq, gte, inArray, isNull, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const templatesRouter = createTRPCRouter({
  getMostUsedTemplates: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Count certificates per template, return top N
      const results = await db
        .select({
          templateId: certificates.templateId,
          usageCount: count(certificates.id).as("usage_count"),
        })
        .from(certificates)
        .where(eq(certificates.userId, ctx.session.user.id))
        .groupBy(certificates.templateId)
        .orderBy(desc(count(certificates.id)))
        .limit(input.limit);

      if (results.length === 0) return [];

      // Fetch template details for the matched IDs
      const templateIds = results.map((r) => r.templateId);
      const matchedTemplates = await db.query.templates.findMany({
        where: and(
          inArray(templates.id, templateIds),
          isNull(templates.deletedAt),
        ),
      });

      const templateMap = new Map(matchedTemplates.map((t) => [t.id, t]));

      return results
        .map((r) => {
          const template = templateMap.get(r.templateId);
          if (!template) return null;
          return {
            ...template,
            usageCount: r.usageCount,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
    }),

  getUserTemplates: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.templates.findMany({
      where: and(
        eq(templates.userId, ctx.session.user.id),
        isNull(templates.deletedAt),
      ),
      orderBy: (templates, { desc }) => [desc(templates.createdAt)],
    });
  }),

  getTemplateById: protectedProcedure
    .input(z.object({ templateId: z.string() }))

    .query(async ({ input }) => {
      return db.query.templates.findFirst({
        where: eq(templates.id, input.templateId),
      });
    }),

  getUserTemplateCount: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return db.$count(
        templates,
        and(eq(templates.userId, input.userId), isNull(templates.deletedAt)),
      );
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
        templates,
        and(
          eq(templates.userId, input.userId),
          gte(templates.createdAt, weekAgo),
          isNull(templates.deletedAt),
        ),
      );
    }),

  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        canvasData: z.any(),
        placeholders: z.array(z.string()), // Changed to string array as per editor
        previewImageUrl: z.string().optional(),
        isPublic: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newTemplate] = await db
        .insert(templates)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          description: input.description,
          canvasData: input.canvasData,
          placeholders: input.placeholders,
          previewImageUrl: input.previewImageUrl,
          isPublic: input.isPublic,
          isVerified: true,
        })
        .returning();

      return newTemplate;
    }),

  updateTemplate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        canvasData: z.any(),
        placeholders: z.array(z.string()),
        previewImageUrl: z.string().optional(),
        isPublic: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Verify ownership
      const existingTemplate = await db.query.templates.findFirst({
        where: and(
          eq(templates.id, input.id),
          eq(templates.userId, ctx.session.user.id),
        ),
      });

      if (!existingTemplate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Template not found or you do not have permission to edit it.",
        });
      }

      // 2. Update
      const [updatedTemplate] = await db
        .update(templates)
        .set({
          name: input.name,
          description: input.description,
          canvasData: input.canvasData,
          placeholders: input.placeholders,
          previewImageUrl: input.previewImageUrl,
          isPublic: input.isPublic,
          updatedAt: new Date(),
        })
        .where(eq(templates.id, input.id))
        .returning();

      return updatedTemplate;
    }),

  getPublicStats: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .query(async ({ input }) => {
      // Verify the template is public
      const template = await db.query.templates.findFirst({
        where: and(
          eq(templates.id, input.templateId),
          eq(templates.isPublic, true),
          isNull(templates.deletedAt),
        ),
        columns: { id: true, userId: true },
      });

      if (!template) {
        return { usageByOthers: 0, favoritesCount: 0 };
      }

      const [usageResult, favoritesResult] = await Promise.all([
        // Count certificates created by OTHER users using this template
        db
          .select({ count: count(certificates.id) })
          .from(certificates)
          .where(
            and(
              eq(certificates.templateId, input.templateId),
              ne(certificates.userId, template.userId),
            ),
          ),
        // Count favorites
        db
          .select({ count: count(templateFavorites.id) })
          .from(templateFavorites)
          .where(eq(templateFavorites.templateId, input.templateId)),
      ]);

      return {
        usageByOthers: usageResult[0]?.count ?? 0,
        favoritesCount: favoritesResult[0]?.count ?? 0,
      };
    }),

  hideTemplate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Verify ownership
      const existingTemplate = await db.query.templates.findFirst({
        where: and(
          eq(templates.id, input.id),
          eq(templates.userId, ctx.session.user.id),
        ),
      });

      if (!existingTemplate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Template not found or you do not have permission to edit it.",
        });
      }

      // 2. Update
      const [hiddenTemplate] = await db
        .update(templates)
        .set({
          updatedAt: new Date(),
          deletedAt: new Date(),
        })
        .where(eq(templates.id, input.id))
        .returning();

      return hiddenTemplate;
    }),

  // =============================================
  // GALERIE – veřejné endpointy
  // =============================================

  getPublicTemplates: publicProcedure.query(async ({ ctx }) => {
    const officialUserId = process.env.OFFICIAL_USER_ID ?? "";

    // Fetch all public templates with author name
    const results = await db
      .select({
        id: templates.id,
        name: templates.name,
        description: templates.description,
        previewImageUrl: templates.previewImageUrl,
        downloads: templates.downloads,
        isVerified: templates.isVerified,
        createdAt: templates.createdAt,
        userId: templates.userId,
        authorName: user.name,
      })
      .from(templates)
      .innerJoin(user, eq(templates.userId, user.id))
      .where(
        and(eq(templates.isPublic, true), isNull(templates.deletedAt)),
      )
      .orderBy(desc(templates.createdAt));

    // Fetch favorites count per template
    const templateIds = results.map((r) => r.id);
    let favoritesMap = new Map<string, number>();

    if (templateIds.length > 0) {
      const favCounts = await db
        .select({
          templateId: templateFavorites.templateId,
          count: count(templateFavorites.id).as("fav_count"),
        })
        .from(templateFavorites)
        .where(inArray(templateFavorites.templateId, templateIds))
        .groupBy(templateFavorites.templateId);

      favoritesMap = new Map(favCounts.map((f) => [f.templateId, f.count]));
    }

    // Check which templates are favorited by the current user
    let userFavoritesSet = new Set<string>();
    if (ctx.session?.user?.id && templateIds.length > 0) {
      const userFavs = await db
        .select({ templateId: templateFavorites.templateId })
        .from(templateFavorites)
        .where(
          and(
            eq(templateFavorites.userId, ctx.session.user.id),
            inArray(templateFavorites.templateId, templateIds),
          ),
        );
      userFavoritesSet = new Set(userFavs.map((f) => f.templateId));
    }

    return results.map((r) => ({
      ...r,
      favoritesCount: favoritesMap.get(r.id) ?? 0,
      isFavorited: userFavoritesSet.has(r.id),
      isOfficial: officialUserId !== "" && r.userId === officialUserId,
    }));
  }),

  getTemplatePublic: publicProcedure
    .input(z.object({ templateId: z.string() }))
    .query(async ({ input }) => {
      const result = await db
        .select({
          id: templates.id,
          name: templates.name,
          description: templates.description,
          canvasData: templates.canvasData,
          placeholders: templates.placeholders,
          previewImageUrl: templates.previewImageUrl,
          isPublic: templates.isPublic,
          isVerified: templates.isVerified,
          downloads: templates.downloads,
          userId: templates.userId,
          createdAt: templates.createdAt,
          updatedAt: templates.updatedAt,
          authorName: user.name,
        })
        .from(templates)
        .innerJoin(user, eq(templates.userId, user.id))
        .where(
          and(
            eq(templates.id, input.templateId),
            eq(templates.isPublic, true),
            isNull(templates.deletedAt),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Veřejná šablona nebyla nalezena.",
        });
      }

      return result[0]!;
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check that the template is public
      const template = await db.query.templates.findFirst({
        where: and(
          eq(templates.id, input.templateId),
          eq(templates.isPublic, true),
          isNull(templates.deletedAt),
        ),
        columns: { id: true },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Šablona nebyla nalezena.",
        });
      }

      // Check if already favorited
      const existing = await db.query.templateFavorites.findFirst({
        where: and(
          eq(templateFavorites.userId, ctx.session.user.id),
          eq(templateFavorites.templateId, input.templateId),
        ),
      });

      if (existing) {
        // Remove favorite
        await db
          .delete(templateFavorites)
          .where(eq(templateFavorites.id, existing.id));
        return { isFavorited: false };
      } else {
        // Add favorite
        await db.insert(templateFavorites).values({
          userId: ctx.session.user.id,
          templateId: input.templateId,
        });
        return { isFavorited: true };
      }
    }),

  getUserFavorites: protectedProcedure.query(async ({ ctx }) => {
    const results = await db
      .select({
        favoriteId: templateFavorites.id,
        favoritedAt: templateFavorites.createdAt,
        templateId: templates.id,
        templateName: templates.name,
        templateDescription: templates.description,
        previewImageUrl: templates.previewImageUrl,
        downloads: templates.downloads,
        isVerified: templates.isVerified,
        authorId: templates.userId,
        authorName: user.name,
      })
      .from(templateFavorites)
      .innerJoin(templates, eq(templateFavorites.templateId, templates.id))
      .innerJoin(user, eq(templates.userId, user.id))
      .where(
        and(
          eq(templateFavorites.userId, ctx.session.user.id),
          eq(templates.isPublic, true),
          isNull(templates.deletedAt),
        ),
      )
      .orderBy(desc(templateFavorites.createdAt));

    return results.map((r) => ({
      ...r,
      isOfficial:
        (process.env.OFFICIAL_USER_ID ?? "") !== "" &&
        r.authorId === process.env.OFFICIAL_USER_ID,
    }));
  }),
});
