import { EmailTemplate } from "@/components/emails/email-template";

export default function EmailZkouska() {
  return (
    <EmailTemplate emailType={"CERTIFICATE_SENT"} validationToken={"1ABCKJLKHGFGHJHKJLKJ-GTFDA129876"} username={"Bob Omáčka"}/>
  );
}