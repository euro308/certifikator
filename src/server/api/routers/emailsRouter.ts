import { z } from "zod";
import { Resend } from "resend";
import { EmailTemplate } from "@/components/emails/email-template";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
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
        const { error } = await resend.emails.send({
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

        if (error) {
          console.error("Chyba z Resend API:", error);
          return { success: false };
        }

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
        const { error } = await resend.emails.send({
          from: "Certifikátor <info@certifikator.eu>",
          to: input.emailAddresses,
          subject: "Obdrželi jste nový certifikát",
          react: EmailTemplate({
            emailType: "CERTIFICATE_SENT",
            validationToken: input.validationToken,
            username: input.username,
          }),
          attachments: [
            {
              filename: `${input.validationToken}.png`,
              content: input.certificateUrl.split(",")[1],
              contentType: "image/png",
            },
          ],
        });

        if (error) {
          console.error("Chyba z Resend API:", error);
          return { success: false };
        }

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
            id: z.string(),
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
      const statuses = new Map<string, boolean>();

      for (const recipient of input.recipients) {
        try {
          const { error } = await resend.emails.send({
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
            ],
          });

          if (error) {
            console.error(`Chyba z Resend API pro ${recipient.email}:`, error);
            statuses.set(recipient.id, false);
          } else {
            statuses.set(recipient.id, true);
          }
        } catch (error) {
          console.error(
            `Neočekávaná chyba při odesílání e-mailu na ${recipient.email}:`,
            error,
          );
          statuses.set(recipient.id, false);
        }
      }

      // Pokus poslat neodeslané znovu
      const failedRecipients = input.recipients.filter(r => !statuses.get(r.id));
      if (failedRecipients.length > 0) {
        console.log(`Opakovaný pokus pro ${failedRecipients.length} e-mailů...`);
        // Počkáme 2 sekundy, abychom nenaběhli znovu do rate limitu
        await new Promise((resolve) => setTimeout(resolve, 2000));

        for (const recipient of failedRecipients) {
          try {
            const { error } = await resend.emails.send({
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
              ],
            });

            if (error) {
              console.error(`Opakovaná chyba z Resend API pro ${recipient.email}:`, error);
            } else {
              statuses.set(recipient.id, true);
            }
          } catch (error) {
            console.error(
              `Opakovaná neočekávaná chyba při odesílání e-mailu na ${recipient.email}:`,
              error,
            );
          }
        }
      }

      const successfulRecipientIds = Array.from(statuses.entries())
        .filter(([_, success]) => success)
        .map(([id]) => id);

      const failedRecipientIds = Array.from(statuses.entries())
        .filter(([_, success]) => !success)
        .map(([id]) => id);

      return {
        success: true,
        sentCount: successfulRecipientIds.length,
        total: input.recipients.length,
        successfulRecipientIds,
        failedRecipientIds,
      };
    }),
});
