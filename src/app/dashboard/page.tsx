import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Award, Plus } from "lucide-react";
import Link from "next/link";
import { auth } from "@/server/better-auth/config";
import { headers } from "next/headers";
import { api } from "@/trpc/server";
import type { ActivityItem } from "@/server/api/routers/activityRouter";
import Image from "next/image";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "právě teď";
  if (diffMinutes < 60) return `před ${diffMinutes} min`;
  if (diffHours < 24) return `před ${diffHours} h`;
  if (diffDays === 1) return "včera";
  if (diffDays < 7) return `před ${diffDays} dny`;
  if (diffDays < 30) return `před ${Math.floor(diffDays / 7)} týdny`;
  return date.toLocaleDateString("cs-CZ");
}

function ActivityItemRow({ item }: { item: ActivityItem }) {
  const isTemplate = item.type === "template_created";
  const href = isTemplate
    ? `/dashboard/me-sablony/${item.id}`
    : `/dashboard/me-certifikaty/${item.id}`;
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
    >
      <div
        className={`rounded-full p-2 ${isTemplate ? "bg-blue-100" : "bg-green-100"}`}
      >
        {isTemplate ? (
          <FileText className="size-4 text-blue-600" />
        ) : (
          <Award className="size-4 text-green-600" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">
          {isTemplate
            ? `Šablona "${item.name}" vytvořena`
            : `Certifikát pro ${item.name} vytvořen`}
        </p>
        <p className="text-xs text-gray-500">
          {formatRelativeTime(item.createdAt)}
        </p>
      </div>
    </Link>
  );
}

export default async function Dashboard() {
  let isThisWeeksCertificateChangePositive = false;
  let isThisWeeksTemplateChangePositive = false;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let certificateCount = 0;
  let templateCount = 0;
  let certificateChangeThisWeek = 0;
  let templateChangeThisWeek = 0;
  let recentActivity: ActivityItem[] = [];
  let mostUsedTemplates: Awaited<
    ReturnType<typeof api.templates.getMostUsedTemplates>
  > = [];

  if (session?.user) {
    [
      certificateCount,
      templateCount,
      certificateChangeThisWeek,
      templateChangeThisWeek,
      recentActivity,
      mostUsedTemplates,
    ] = await Promise.all([
      api.certificates.getUserCertificateCount({ userId: session.user.id }),
      api.templates.getUserTemplateCount({ userId: session.user.id }),
      api.certificates.pastWeeksChange({ userId: session.user.id }),
      api.templates.pastWeeksChange({ userId: session.user.id }),
      api.activity.getRecentActivity({ limit: 10 }),
      api.templates.getMostUsedTemplates({ limit: 10 }),
    ]);
  }

  if (certificateChangeThisWeek >= 0) {
    isThisWeeksCertificateChangePositive = true;
  }

  if (templateChangeThisWeek >= 0) {
    isThisWeeksTemplateChangePositive = true;
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
          Vítejte zpět! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Zde je přehled vaší aktivity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Certifikáty</CardTitle>
            <Award className="size-7 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{certificateCount}</div>
            {isThisWeeksCertificateChangePositive && (
              <p className="mt-1 text-lg text-gray-500">
                {" "}
                +{certificateChangeThisWeek} tento týden
              </p>
            )}
            {!isThisWeeksCertificateChangePositive && (
              <p className="mt-1 text-lg text-gray-500">
                {" "}
                {certificateChangeThisWeek} tento týden
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Šablony</CardTitle>
            <FileText className="size-7 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{templateCount}</div>
            {isThisWeeksTemplateChangePositive && (
              <p className="mt-1 text-lg text-gray-500">
                {" "}
                +{templateChangeThisWeek} tento týden
              </p>
            )}
            {!isThisWeeksTemplateChangePositive && (
              <p className="mt-1 text-lg text-gray-500">
                {" "}
                {templateChangeThisWeek} tento týden
              </p>
            )}
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
          </CardHeader>
          <CardContent className="max-h-[180px] overflow-y-auto sm:max-h-[220px] lg:max-h-[260px]">
            <div className="space-y-1">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500">Zatím žádná aktivita.</p>
              ) : (
                recentActivity.map((item) => (
                  <ActivityItemRow
                    key={`${item.type}-${item.id}`}
                    item={item}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Favorite Templates (Most Used) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Oblíbené šablony</CardTitle>
              <CardDescription>Nejčastěji používané šablony</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/me-sablony">Vše →</Link>
            </Button>
          </CardHeader>
          <CardContent className="max-h-[180px] overflow-y-auto sm:max-h-[220px] lg:max-h-[260px]">
            <div className="space-y-1">
              {mostUsedTemplates.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Zatím žádné šablony nebyly použity.
                </p>
              ) : (
                mostUsedTemplates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/dashboard/me-sablony/${template.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                  >
                    {template.previewImageUrl ? (
                      <Image
                        src={template.previewImageUrl}
                        alt={template.name}
                        className="rounded-xs object-cover"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className="bg-gradient-primary h-12 w-12 rounded-lg" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{template.name}</p>
                      <p className="text-xs text-gray-500">
                        Použito: {template.usageCount}× | Upraveno:{" "}
                        {formatRelativeTime(template.updatedAt)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
