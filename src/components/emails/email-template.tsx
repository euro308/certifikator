import * as React from "react";

interface EmailTemplateProps {
  emailType: "FORGOT_PASSWORD" | "CERTIFICATE_SENT" | "TEMPLATE_TAKEN_DOWN";
  username?: string;
  validationToken?: string;
  resetLink?: string;
  templateName?: string;
  templateId?: string;
  reason?: string;
}

/**
 * Poznámka: E-mailoví klienti nepodporují Tailwind ani externí CSS.
 * Používáme proto čisté HTML tabulky (pro layout) a inline styly.
 */
export function EmailTemplate({
  emailType,
  username,
  validationToken,
  resetLink,
  templateName,
  templateId,
  reason,
}: EmailTemplateProps) {
  const mainStyle: React.CSSProperties = {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
    padding: "20px 20px",
    lineHeight: "1.6",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: "600px",
    margin: "0",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "12px",
    backgroundImage: "linear-gradient(to right, #ED765E, #FEA858)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
  };

  const h3Style: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: "600",
    margin: "10px 0 10px 0",
  };

  const pStyle: React.CSSProperties = {
    margin: "0 0 16px 0",
    fontSize: "16px",
  };

  const buttonStyle: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "#ED765E",
    backgroundImage: "linear-gradient(to right, #ED765E, #FEA858)",
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    marginTop: "8px",
    marginBottom: "8px",
  };

  const footerStyle: React.CSSProperties = {
    marginTop: "40px",
    paddingTop: "20px",
    borderTop: "1px solid #eeeeee",
    fontSize: "14px",
    color: "#666666",
  };

  const italicStyle: React.CSSProperties = {
    fontStyle: "italic",
    display: "block",
    marginTop: "20px",
    fontSize: "14px",
    color: "#888888",
  };

  return (
    <div style={mainStyle}>
      <div style={containerStyle}>
        <h1 style={titleStyle}>Certifikátor</h1>

        {emailType === "FORGOT_PASSWORD" && (
          <>
            <h3 style={h3Style}>Zapomněli jste heslo?</h3>
            <p style={pStyle}>
              To se stane každému. Obdrželi jsme žádost pro obnovení hesla k
              Vašemu účtu na platformě Certifikátor.
            </p>
            <p style={pStyle}>
              Kliknutím na tlačítko níže si můžete nastavit nové heslo:
            </p>
            <a href={resetLink} style={buttonStyle}>
              Nastavit nové heslo
            </a>
            <span style={italicStyle}>
              Tento odkaz je platný pouze 1 hodinu. Pokud jste o resetování
              hesla nežádali, můžete tento e-mail bezpečně ignorovat. Vaše heslo
              zůstane nezměněno.
            </span>
          </>
        )}

        {emailType === "CERTIFICATE_SENT" && (
          <>
            <h3 style={h3Style}>Vystavení nového certifikátu</h3>
            <p style={pStyle}>Vážená paní / Vážený pane,</p>
            <p style={pStyle}>
              dovolujeme si Vás informovat, že Vám byl úspěšně vystaven a zaslán
              nový certifikát. Vystavitelem tohoto dokumentu je {username}.
            </p>
            <p style={pStyle}>
              K Vašemu certifikátu byl přidělen unikátní identifikační klíč,
              který slouží k ověření jeho pravosti a platnosti:
            </p>
            <div
              style={{
                backgroundColor: "#f9fafb",
                borderLeft: "4px solid #FEA858",
                padding: "16px",
                margin: "16px 0",
                borderRadius: "4px",
              }}
            >
              <p
                style={{
                  ...pStyle,
                  margin: 0,
                  fontSize: "18px",
                  letterSpacing: "1px",
                  fontFamily: "monospace",
                  color: "#1a1a1a",
                }}
              >
                <strong>{validationToken}</strong>
              </p>
            </div>
            <span style={italicStyle}>
              Identifikační kód si pečlivě uschovejte. Bude vyžadován v případě,
              že budete Vy nebo třetí strana potřebovat elektronicky ověřit
              platnost certifikátu. Pokud dojde k jeho ztrátě, obraťte se přímo
              na vystavitele, který Vám může tento e-mail zaslat opakovaně.
            </span>
          </>
        )}

        {emailType === "TEMPLATE_TAKEN_DOWN" && (
          <>
            <h3 style={h3Style}>Vaše šablona byla stažena z galerie</h3>
            <p style={pStyle}>
              Dobrý den, dovolujeme si Vás informovat, že Vaše šablona{" "}
              <strong>{templateName}</strong> (ID šablony: {templateId}) byla
              stažena z veřejné galerie systému Certifikátor.
            </p>
            <div
              style={{
                backgroundColor: "#f9fafb",
                borderLeft: "4px solid #ED765E",
                padding: "16px",
                margin: "10px 0",
                borderRadius: "4px",
              }}
            >
              <p
                style={{
                  ...pStyle,
                  margin: 0,
                  fontWeight: "600",
                  color: "#4b5563",
                }}
              >
                Důvod stažení:
              </p>
              <p style={{ ...pStyle, margin: 0, color: "#1a1a1a" }}>{reason}</p>
            </div>
            <p style={pStyle}>
              Šablona je i nadále dostupná ve Vašem účtu pro soukromé účely, ale
              již není viditelná pro ostatní uživatele ve veřejné galerii. Pokud
              se domníváte, že došlo k chybě, prosím kontaktujte naši podporu
              odpovědí na tento e-mail.
            </p>
          </>
        )}

        <div style={footerStyle}>
          <p style={pStyle}>
            S pozdravem,
            <br />
            <strong>Tým Certifikátor</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
