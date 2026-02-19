"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EmailTemplate } from "@/components/email-template";
import { cn } from "@/lib/utils";

interface EmailSettingsFormProps {
  senderName: string;
  onSenderNameChange: (name: string) => void;
  validationToken?: string;
  className?: string;
}

export function EmailSettingsForm({
  senderName,
  onSenderNameChange,
  validationToken = "xxxxxxxxxxxxxxxxxxxxxx",
  className,
}: EmailSettingsFormProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="shrink-0 space-y-2">
        <Label htmlFor="sender-name">Jméno odesílatele</Label>
        <Input
          id="sender-name"
          value={senderName}
          onChange={(e) => onSenderNameChange(e.target.value)}
          placeholder="Např. Jan Novák"
        />
      </div>

      <div className="bg-muted/30 flex min-h-0 flex-1 flex-col rounded-md border p-4">
        <h4 className="text-muted-foreground mb-2 shrink-0 text-sm font-semibold">
          Náhled zprávy v e-mailu:
        </h4>
        <div className="relative min-h-[250px] flex-1 overflow-hidden rounded-md border bg-white shadow-sm">
          <div className="absolute inset-0 overflow-x-hidden overflow-y-auto">
            <div className="w-[133%] origin-top-left scale-[0.75] p-4">
              <EmailTemplate
                emailType="CERTIFICATE_SENT"
                username={senderName}
                validationToken={validationToken}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
