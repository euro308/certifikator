import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/server/db";
import { localization } from "better-auth-localization";
import { Resend } from "resend";
import { EmailTemplate } from "@/components/emails/email-template";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      const resend = new Resend(process.env.RESEND_API_KEY);
      void resend.emails.send({
        from: "Certifikátor <info@certifikator.eu>",
        to: [user.email],
        subject: "Obnovení Vašeho hesla",
        react: EmailTemplate({
          emailType: "FORGOT_PASSWORD",
          resetLink: url,
        }),
      });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
    },
  },
  plugins: [
    localization({
      defaultLocale: "fr",
      fallbackLocale: "default",
      translations: {
        fr: {
          USER_NOT_FOUND: "Uživatel nenalezen",
          FAILED_TO_CREATE_USER: "Nepodařilo se vytvořit uživatele",
          FAILED_TO_UPDATE_USER: "Nepodařilo se aktualizovat uživatele",
          USER_ALREADY_EXISTS: "Uživatel již existuje",
          USER_EMAIL_NOT_FOUND: "Email uživatele nenalezen",
          USER_ALREADY_HAS_PASSWORD:
            "Uživatel již má heslo. Pro smazání účtu ho zadejte.",
          USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
            "Uživatel již existuje. Použijte jiný email.",

          FAILED_TO_CREATE_SESSION: "Nepodařilo se vytvořit relaci",
          FAILED_TO_GET_SESSION: "Nepodařilo se získat relaci",
          SESSION_EXPIRED:
            "Platnost relace vypršela. Pro provedení této akce se znovu přihlaste.",

          INVALID_PASSWORD: "Neplatné heslo",
          INVALID_EMAIL: "Neplatný email",
          INVALID_EMAIL_OR_PASSWORD: "Neplatný email nebo heslo",
          INVALID_TOKEN: "Neplatný token",
          EMAIL_NOT_VERIFIED: "Email nebyl ověřen",
          CREDENTIAL_ACCOUNT_NOT_FOUND: "Účet s přihlašovacími údaji nenalezen",

          PASSWORD_TOO_SHORT: "Heslo je příliš krátké",
          PASSWORD_TOO_LONG: "Heslo je příliš dlouhé",

          SOCIAL_ACCOUNT_ALREADY_LINKED: "Účet je již propojen",
          PROVIDER_NOT_FOUND: "Poskytovatel nenalezen",
          ID_TOKEN_NOT_SUPPORTED: "id_token není podporován",
          FAILED_TO_GET_USER_INFO: "Nepodařilo se získat informace o uživateli",

          EMAIL_CAN_NOT_BE_UPDATED: "Email nelze aktualizovat",
          FAILED_TO_UNLINK_LAST_ACCOUNT: "Nemůžete odpojit svůj poslední účet",
          ACCOUNT_NOT_FOUND: "Účet nenalezen",
        },
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
