import { z } from "zod";
import { Resend } from "resend";
import { EmailTemplate } from "@/components/emails/email-template";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { auth } from "@/server/better-auth/config";

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailsRouter = createTRPCRouter({
  sendPasswordReset: publicProcedure
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

  sendCertificateSingle: publicProcedure
    .input(
      z.object({
        emailAddresses: z.array(z.string().email()),
        validationToken: z.string(),
        username: z.string(),
        certificateUrl: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await resend.emails.send({
          from: "Certifikátor <info@certifikator.eu>",
          to: input.emailAddresses,
          subject: "Obdrželi jste nový certifikát",
          react: EmailTemplate({
            emailType: "CERTIFICATE_SENT",
            validationToken: input.validationToken,
            username: input.username
          }),
          attachments: [
            {
              filename: `${input.validationToken}.png`,
              content: input.certificateUrl.split(",")[1],
              contentType: "image/png",
            },
        ]
        });

        return { success: true };
      } catch (error) {
        console.error("Chyba při odesílání emailu:", error);
        return { success: false };
      }
    }),

  sendCertificatesBatch: protectedProcedure
    .input(
      z.object({
        recipients: z.array(
          z.object({
            email: z.string().email(),
            name: z.string(),
            validationToken: z.string(),
            certificateUrl: z.string(),
          }),
        ),
        senderName: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const senderString = input.senderName;

      const results = await Promise.allSettled(
        input.recipients.map(async (recipient) => {
          try {
             await resend.emails.send({
              from: "Certifikátor <info@certifikator.eu>",
              to: recipient.email,
              subject: "Obdrželi jste nový certifikát",
              react: EmailTemplate({
                emailType: "CERTIFICATE_SENT",
                validationToken: recipient.validationToken,
                username: senderString,
              }),
              attachments: [
                {
                  filename: `${recipient.validationToken}.png`,
                  content: recipient.certificateUrl.split(",")[1],
                  contentType: "image/png",
                },
              ]
            });
            return { email: recipient.email, status: "fulfilled" };
          } catch (error) {
            console.error(`Nastala chyba při odesílání e-mailu na ${recipient.email}:`, error);
            throw error;
          }
        }),
      );
      
      const successCount = results.filter((r) => r.status === "fulfilled").length;
      return { success: true, sentCount: successCount, total: input.recipients.length };
    }),
});
