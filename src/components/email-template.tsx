import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmailTemplateProps {
  emailType: 'FORGOT_PASSWORD' | "CERTIFICATE_SENT" | 'TEMPLATE_TAKEN_DOWN',
  header?: string;
  content?: string;
  resetLink?: string;
}

export function EmailTemplate({
  emailType,
  header,
  content,
  resetLink,
}: EmailTemplateProps) {
  return (
    <div>
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
        <span className="bg-gradient-primary bg-clip-text text-transparent">Certifikátor</span>
      </h1>

      {emailType === "FORGOT_PASSWORD" && (
        <>
        <p>
          <h3>Zapomněli jste heslo?</h3>
        </p>

        <p>
          <span>To se stane každému. Obdrželi jsme žádost o resetování hesla pro váš účet na platformě Certifikátor.</span>
          <span>Kliknutím na tlačítko níže si můžete nastavit nové heslo:</span>
          <Button asChild>
            <Link href={resetLink!}>Nastavit nové heslo</Link> {/* !, protože link vždy bude existovat */}
          </Button>
          <span className="italic">Tento odkaz je platný pouze 1 hodinu. Pokud jste o resetování hesla nežádali, můžete tento e-mail bezpečně ignorovat. Vaše heslo zůstane nezměněno.</span>

          <span>S pozdravem,</span>
          <span>Tým Certifikátor</span>
        </p>
        </>
      )}

      {emailType === "CERTIFICATE_SENT" && (
        <>
        <p>
          <h3>{header}</h3>
        </p>

        <p>
          <span>{content}</span>

          <span>S pozdravem,</span>
          <span>Tým Certifikátor</span>
        </p>
        </>
      )}

      {emailType === "TEMPLATE_TAKEN_DOWN" && (
        <>
          <p>
            <h3></h3>
          </p>
        </>
      )}
    </div>
  );
}
