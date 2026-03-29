import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { certificates, templates } from "@/server/db/schema";
import { db } from "@/server/db";
import { and, desc, eq, isNull } from "drizzle-orm";

export type ActivityItem = {
  id: string;
  type: "template_created" | "certificate_created";
  name: string;
  createdAt: Date;
};

export const activityRouter = createTRPCRouter({
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
      }),
    )
    .query(async ({ ctx, input }): Promise<ActivityItem[]> => {
      const userId = ctx.session.user.id;

      const recentTemplates = await db.query.templates.findMany({
        where: and(eq(templates.userId, userId), isNull(templates.deletedAt)),
        orderBy: [desc(templates.createdAt)],
        limit: input.limit,
        columns: {
          id: true,
          name: true,
          createdAt: true,
        },
      });

      const recentCertificates = await db.query.certificates.findMany({
        where: eq(certificates.userId, userId),
        orderBy: [desc(certificates.createdAt)],
        limit: input.limit,
        columns: {
          id: true,
          recipientName: true,
          createdAt: true,
        },
      });

      const activity: ActivityItem[] = [
        ...recentTemplates.map((t) => ({
          id: t.id,
          type: "template_created" as const,
          name: t.name,
          createdAt: t.createdAt,
        })),
        ...recentCertificates.map((c) => ({
          id: c.id,
          type: "certificate_created" as const,
          name: c.recipientName,
          createdAt: c.createdAt,
        })),
      ];

      activity.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return activity.slice(0, input.limit);
    }),
});
