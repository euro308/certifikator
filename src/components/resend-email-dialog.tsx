"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { authClient } from "@/server/better-auth/client";
import { EmailSettingsForm } from "./email-settings-form";

interface ResendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: {
    id: string;
    recipientEmail: string;
    recipientName: string;
    validationToken: string;
    certificateUrl: string;
  };
}

export function ResendEmailDialog({
  open,
  onOpenChange,
  certificate,
}: ResendEmailDialogProps) {
  const { data: session } = authClient.useSession();
  const [senderName, setSenderName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const hasInitializedSenderName = useRef(false);

  // Nastavení výchozího jména odesílatele (pouze jednou)
  useEffect(() => {
    if (session?.user?.name && !hasInitializedSenderName.current) {
      setSenderName(session.user.name);
      hasInitializedSenderName.current = true;
    }
  }, [session?.user?.name]);

  const sendEmailMutation = api.emails.sendCertificateSingle.useMutation({
    onSuccess: () => {
      toast.success("E-mail byl úspěšně odeslán.");
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error("Chyba při odesílání e-mailu: " + err.message);
    },
    onSettled: () => {
      setIsSending(false);
    },
  });

  const handleSend = () => {
    if (!senderName.trim()) {
      toast.error("Zadejte jméno odesílatele.");
      return;
    }

    setIsSending(true);
    sendEmailMutation.mutate({
      emailAddresses: [certificate.recipientEmail],
      validationToken: certificate.validationToken,
      username: senderName,
      certificateUrl: certificate.certificateUrl,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] max-w-2xl flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Znovu odeslat e-mail</DialogTitle>
          <DialogDescription>
            Příjemci {certificate.recipientName} ({certificate.recipientEmail})
            bude odeslán e-mail s certifikátem.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <EmailSettingsForm
            senderName={senderName}
            onSenderNameChange={setSenderName}
            validationToken={certificate.validationToken}
            className="py-4"
          />
        </div>

        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Odeslat e-mail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
