import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { categories, templates } from "@/server/db/schema";
import { db } from "@/server/db";
import { and, eq, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";


export const templatesRouter = createTRPCRouter({
  getUserTemplates: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.templates.findMany({
      where: eq(templates.userId, ctx.session.user.id), // && eq(templates.deletedAt, null),
      orderBy: (templates, { desc }) => [desc(templates.createdAt)],
    });
  }),

  getUserTemplateCount: publicProcedure
    .input(z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return db.$count(
        templates,
        eq(templates.userId, input.userId))
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
        ),
      );
    }),

  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string(),
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
            isVerified: true,
          })
          .returning();
      }

      if (!category) throw new TRPCError({message: "Failed.", code: "INTERNAL_SERVER_ERROR"});

      const [newTemplate] = await db.insert(templates).values({
        userId: ctx.session.user.id,
        categoryId: category.id,
        name: input.name,
        description: input.description,
        canvasData: input.canvasData,
        placeholders: input.placeholders,
        previewImageUrl: input.previewImageUrl,
        isPublic: input.isPublic,
        isVerified: true,
      }).returning();

      return newTemplate;
    })
});
