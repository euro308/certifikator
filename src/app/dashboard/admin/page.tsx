"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./overview-tab";
import { UsersTab } from "./users-tab";
import { PublicTemplatesTab } from "./public-templates-tab";
import { AllTemplatesTab } from "./all-templates-tab";
import { CertificatesTab } from "./certificates-tab";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administrace zóny</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Správa uživatelů, veřejných šablon a systémových dat
        </p>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto justify-start h-auto p-1 pb-2 no-scrollbar border-b rounded-none bg-transparent gap-4">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium"
          >
            Přehled
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium"
          >
            Uživatelé
          </TabsTrigger>
          <TabsTrigger
            value="public-templates"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium"
          >
            Veřejné šablony
          </TabsTrigger>
          <TabsTrigger
            value="all-templates"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium"
          >
            Všechny šablony
          </TabsTrigger>
          <TabsTrigger
            value="certificates"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium"
          >
            Všechny certifikáty
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
      </Tabs>
    </div>
  );
}