"use client";

import React from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Globe, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function OverviewTab() {
  const { data: stats, isLoading } = api.admin.getOverviewStats.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="size-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return <div>Data se nepodařilo načíst.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Uživatelé</CardTitle>
            <div className="rounded-full bg-blue-100 p-2">
              <Users className="size-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalUsers}</div>
            <p className="text-muted-foreground mt-1 text-sm">
              registrovaných účtů
            </p>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Šablony</CardTitle>
            <div className="rounded-full bg-indigo-100 p-2">
              <FileText className="size-6 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalTemplates}</div>
            <p className="text-muted-foreground mt-1 text-sm">
              uloženo v databázi
            </p>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Galerie</CardTitle>
            <div className="rounded-full bg-violet-100 p-2">
              <Globe className="size-6 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {stats.totalPublicTemplates}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              veřejně sdílených
            </p>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Certifikáty</CardTitle>
            <div className="rounded-full bg-emerald-100 p-2">
              <Award className="size-6 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalCertificates}</div>
            <p className="text-muted-foreground mt-1 text-sm">
              vygenerováno celkem
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
