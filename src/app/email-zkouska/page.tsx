import { EmailTemplate } from "@/components/email-template";

export default function EmailZkouska() {
  return (
    <EmailTemplate emailType={"TEMPLATE_TAKEN_DOWN"} resetLink={"/login"} templateName={"BOB"} templateId={"ABCDE"} reason={"Porušení veřejných práv"}/>
  );
}