import { z } from "zod";
import { Resend } from "resend";
import { EmailTemplate } from "@/components/email-template";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { auth } from "@/server/better-auth/config";

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailsRouter = createTRPCRouter({
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        emailAddress: z.string().email(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await auth.api.requestPasswordReset({
          body: {
            email: input.emailAddress,
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/obnovit-heslo`,
          },
        });
        return { success: true };
      } catch (error) {
        console.error("Chyba při odesílání e-mailu: ", error);
        return { success: false };
      }
    }),

  sendTemplateTakenDown: publicProcedure
    .input(
      z.object({
        emailAddress: z.string().email(),
        templateName: z.string(),
        templateId: z.string(),
        reason: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await resend.emails.send({
          from: "Certifikátor <info@certifikator.eu>",
          to: input.emailAddress,
          subject: "Šablona stažena z veřejné galerie",
          react: EmailTemplate({
            emailType: "TEMPLATE_TAKEN_DOWN",
            templateName: input.templateName,
            templateId: input.templateId,
            reason: input.reason,
          }),
        });

        return { success: true };
      } catch (error) {
        console.error("Chyba při odesílání emailu:", error);
        return { success: false };
      }
    }),

  sendCertificateSent: publicProcedure
    .input(
      z.object({
        emailAddresses: z.array(z.string().email()),
        subject: z.string(),
        header: z.string().optional(),
        content: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await resend.emails.send({
          from: "Certifikátor <info@certifikator.eu>",
          to: input.emailAddresses,
          subject: input.subject,
          react: EmailTemplate({
            emailType: "CERTIFICATE_SENT",
            header: input.header,
            content: input.content,
          }),
        });

        return { success: true };
      } catch (error) {
        console.error("Chyba při odesílání emailu:", error);
        return { success: false };
      }
    }),
});
