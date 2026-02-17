import { z } from "zod";
import { Resend } from "resend";
import { EmailTemplate } from "@/components/email-template";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { passwordResets, user } from "@/server/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailsRouter = createTRPCRouter({
  requestPasswordResetEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email()
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 1. Najít uživatele v DB
        const foundUser = await db.query.user.findFirst({
          where: eq(user.email, input.email)
        });

        if(!foundUser) {
          return { success: true }; // User uvidí success info, ale nic se nepošle
        }

        // 2. Generace tokenu a zápis do DB
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        const token = crypto.randomUUID();

        await db
          .insert(passwordResets)
          .values({
            userId: foundUser.id,
            token: token,
            expiresAt: expiresAt,
          });

        // 3. Poslat e-mail
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-hesla?token=${token}`;

        await resend.emails.send({
          from: 'Certifikátor <onboarding@resend.dev>',
          to: [foundUser.email],
          subject: "[Certifikátor] Resetování vašeho hesla",
          react: EmailTemplate({ emailType: "FORGOT_PASSWORD", resetLink: resetLink }),
        });

        return { success: true };
        }

        catch(error) {
        console.error("Error při resetování hesla: ", error);
        return { success: false };
        }
    }),

  send: publicProcedure
    .input(
      z.object({
        emailType: z.enum(["FORGOT_PASSWORD", "CERTIFICATE_SENT", "TEMPLATE_TAKEN_DOWN"]),
        emailAddresses: z.array(z.string().email()),
        subject: z.string(),
        header: z.string().optional(),
        content: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { data, error } = await resend.emails.send({
          from: 'Certifikátor <onboarding@resend.dev>',
          to: input.emailAddresses,
          subject: input.subject,
          react: EmailTemplate({ emailType: input.emailType, header: input.header, content: input.content }),
        });

        if (error) {
          throw new Error(error.message);
        }

        return { success: true, data };
      } catch (error) {
        console.error("Chyba při odesílání emailu:", error);
        throw new Error("Nepodařilo se odeslat email.");
      }
    }),
});
