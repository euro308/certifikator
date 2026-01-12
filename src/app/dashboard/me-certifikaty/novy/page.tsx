import { auth } from "@/server/better-auth/config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";

export default async function NovyCertifikat() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/prihlaseni");
  }

  return(
    <>
      <h1>Vytvořit certifikát</h1>
      <div>
        <span>Název certifikátu</span>
        <Input type="text" placeholder={"Název"}/>
      </div>
    </>
  )
}