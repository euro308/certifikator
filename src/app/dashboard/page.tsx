import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Award, Users, TrendingUp, Plus, Upload, Download } from "lucide-react";
import Link from "next/link";
import { drizzle } from "drizzle-orm/neon-serverless";
import { certificates, templates } from "@/server/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { auth } from "@/server/better-auth/config";
import { headers } from "next/headers";

export default async function Dashboard() {
  let isThisWeeksCertificateChangePositive = false;
  let isThisWeeksTemplateChangePositive = false;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const db = drizzle(process.env.DATABASE_URL);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let certificateCount = -1;
  let templateCount = -1;
  let certificateChangeThisWeek = -1;
  let templateChangeThisWeek = -1;


  if (session?.user) {
    const userId = session.user.id;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    certificateCount = await db.$count(
      certificates,
      eq(certificates.userId, userId)
    );

    templateCount = await db.$count(
      templates,
      eq(templates.userId, userId)
    );

    certificateChangeThisWeek = await db.$count(
      certificates,
      and(
        eq(certificates.userId, userId),
        gte(certificates.createdAt, weekAgo)
      )
    );

    templateChangeThisWeek = await db.$count(
      templates,
      and(
        eq(templates.userId, userId),
        gte(templates.createdAt, weekAgo)
      )
    );
  }

  if(certificateChangeThisWeek >= 0) {
    isThisWeeksCertificateChangePositive = true;
  }

  if(templateChangeThisWeek >= 0) {
    isThisWeeksTemplateChangePositive = true;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 pt-24 pb-20">
      <div className="flex justify-center px-6 py-8">
        <div className="w-full max-w-7xl space-y-8">
          {/* Header */}
          <div>
            <h1 className="mb-2 text-4xl font-bold text-gray-900 lg:text-5xl">
              Vítejte zpět! 👋
            </h1>
            <p className="text-lg text-gray-600">
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
                    <Award className="h-4 w-4 text-green-600" />
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
                    <FileText className="h-4 w-4 text-blue-600" />
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
                    <Users className="h-4 w-4 text-purple-600" />
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
      </div>
    </main>
  );
}
