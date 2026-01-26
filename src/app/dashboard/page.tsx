import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Award, Users, Plus } from "lucide-react";
import Link from "next/link";
import { auth } from "@/server/better-auth/config";
import { headers } from "next/headers";
import { api } from "@/trpc/server";

export default async function Dashboard() {
  let isThisWeeksCertificateChangePositive = false;
  let isThisWeeksTemplateChangePositive = false;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let certificateCount = 999;
  let templateCount = 999;
  let certificateChangeThisWeek = 999;
  let templateChangeThisWeek = 999;


  if (session?.user) {
    certificateCount = await api.certificates.getUserCertificateCount({
      userId: session.user.id
    });

    templateCount = await api.templates.getUserTemplateCount({
      userId: session.user.id
      }
    );

    certificateChangeThisWeek = await api.certificates.pastWeeksChange({
      userId: session.user.id
    });

    templateChangeThisWeek = await api.templates.pastWeeksChange({
      userId: session.user.id
    });
  }

  if(certificateChangeThisWeek >= 0) {
    isThisWeeksCertificateChangePositive = true;
  }

  if(templateChangeThisWeek >= 0) {
    isThisWeeksTemplateChangePositive = true;
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
          Vítejte zpět! 👋
        </h1>
        <p className="text-lg text-muted-foreground">
          Zde je přehled vaší aktivity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">
                  Certifikáty
                </CardTitle>
                <Award className="size-7 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{certificateCount}</div>
                {isThisWeeksCertificateChangePositive && <p className="mt-1 text-lg text-gray-500"> +{certificateChangeThisWeek} tento týden</p>}
                {!isThisWeeksCertificateChangePositive && <p className="mt-1 text-lg text-gray-500"> {certificateChangeThisWeek} tento týden</p>}
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Šablony</CardTitle>
                <FileText className="size-7 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{templateCount}</div>
                {isThisWeeksTemplateChangePositive && <p className="mt-1 text-lg text-gray-500"> +{templateChangeThisWeek} tento týden</p>}
                {!isThisWeeksTemplateChangePositive && <p className="mt-1 text-lg text-gray-500"> {templateChangeThisWeek} tento týden</p>}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Rychlé akce</CardTitle>
              <CardDescription className="text-lg">
                Nejčastější úkony pro urychlení práce
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild className="bg-gradient-primary hover:opacity-90">
                <Link href="/dashboard/me-sablony/nova">
                  <Plus className="size-6" />
                  <span className="text-base">Nová šablona</span>
                </Link>
              </Button>
              <Button asChild className="bg-gradient-primary hover:opacity-90">
                <Link href="/dashboard/me-certifikaty/novy" className="text-3xl">
                  <Plus className="size-6" />
                  <span className="text-base">Nový certifikát</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Grid Layout - Recent Activity + Favorites */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Poslední aktivita</CardTitle>
                  <CardDescription>Vaše nedávné změny a akce</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/aktivita">Vše →</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <Award className="size-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Absolvent kurzu XYZ vytvořen
                    </p>
                    <p className="text-xs text-gray-500">před 2 hodinami</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <FileText className="size-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Šablona Ocenění upravena
                    </p>
                    <p className="text-xs text-gray-500">dnes v 14:23</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-purple-100 p-2">
                    <Users className="size-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      5 certifikátů odesláno
                    </p>
                    <p className="text-xs text-gray-500">včera</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Favorite Templates */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Oblíbené šablony</CardTitle>
                  <CardDescription>
                    Rychlý přístup k vašim šablonám
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/me-sablony">Vše →</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link
                  href="/dashboard/me-sablony/1"
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="bg-gradient-primary h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Diplom bakalář</p>
                    <p className="text-xs text-gray-500">
                      Použito: 45× | Upraveno: před týdnem
                    </p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/me-sablony/2"
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="bg-gradient-primary h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Certifikát kurzu</p>
                    <p className="text-xs text-gray-500">
                      Použito: 23× | Upraveno: před 3 dny
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
    </div>
  );
}
