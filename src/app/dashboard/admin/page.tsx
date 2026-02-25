"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/admin-panel/overview-tab";
import { UsersTab } from "@/components/admin-panel/users-tab";
import { PublicTemplatesTab } from "@/components/admin-panel/public-templates-tab";
import { AllTemplatesTab } from "@/components/admin-panel/all-templates-tab";
import { CertificatesTab } from "@/components/admin-panel/certificates-tab";
import { ReportsTab } from "@/components/admin-panel/reports-tab";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administrace zóny</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Správa uživatelů, veřejných šablon a systémových dat
        </p>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="no-scrollbar flex h-auto w-full justify-start gap-4 overflow-x-auto rounded-none border-b bg-transparent p-1 pb-2">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-primary rounded-none px-4 py-2 font-medium data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Přehled
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="data-[state=active]:border-primary rounded-none px-4 py-2 font-medium data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Uživatelé
          </TabsTrigger>
          <TabsTrigger
            value="public-templates"
            className="data-[state=active]:border-primary rounded-none px-4 py-2 font-medium data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Veřejné šablony
          </TabsTrigger>
          <TabsTrigger
            value="all-templates"
            className="data-[state=active]:border-primary rounded-none px-4 py-2 font-medium data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Všechny šablony
          </TabsTrigger>
          <TabsTrigger
            value="certificates"
            className="data-[state=active]:border-primary rounded-none px-4 py-2 font-medium data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Všechny certifikáty
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="data-[state=active]:border-primary rounded-none px-4 py-2 font-medium data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Nahlášení
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="public-templates">
          <PublicTemplatesTab />
        </TabsContent>
        <TabsContent value="all-templates">
          <AllTemplatesTab />
        </TabsContent>
        <TabsContent value="certificates">
          <CertificatesTab />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
