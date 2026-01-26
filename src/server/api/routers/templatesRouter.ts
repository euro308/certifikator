import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { categories, templates } from "@/server/db/schema";
import { db } from "@/server/db";
import { and, eq, gte, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const templatesRouter = createTRPCRouter({
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
      // Find a default category or create one to satisfy the Foreign Key constraint
      // This allows us to "ignore" categories in the UI for now.
      let category = await db.query.categories.findFirst();

      if (!category) {
        [category] = await ctx.db
          .insert(categories)
          .values({
            name: "Obecné",
            slug: "obecne",
            description: "Výchozí kategorie",
          })
          .returning();
      }

      if (!category)
        throw new TRPCError({
          message: "Failed.",
          code: "INTERNAL_SERVER_ERROR",
        });

      const [newTemplate] = await db
        .insert(templates)
        .values({
          userId: ctx.session.user.id,
          categoryId: category.id,
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
          message: "Template not found or you do not have permission to edit it.",
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
          message: "Template not found or you do not have permission to edit it.",
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
});
