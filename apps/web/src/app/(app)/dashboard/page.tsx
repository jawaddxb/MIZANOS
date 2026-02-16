"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { MizanLogo } from "@/components/atoms/brand/MizanLogo";
import { Button } from "@/components/molecules/buttons/Button";
import { PageHeader } from "@/components/molecules/layout/PageHeader";
import { QuickStats } from "@/components/organisms/dashboard/QuickStats";
import { ActionItems } from "@/components/organisms/dashboard/ActionItems";
import { ProductionHealth } from "@/components/organisms/dashboard/ProductionHealth";
import { StageChart } from "@/components/organisms/dashboard/StageChart";
import { RecentActivity } from "@/components/organisms/dashboard/RecentActivity";
import { ProductsSection } from "@/components/organisms/dashboard/ProductsSection";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        title="Dashboard"
        subtitle="Project health overview and key action points"
        icon={<MizanLogo size={22} className="text-primary" />}
      >
        <Link href="/intake">
          <Button className="shadow-sm hover:shadow-md transition-shadow">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </PageHeader>

      <QuickStats />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="lg:col-span-1 min-w-0 animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          <ActionItems />
        </div>

        <div
          className="lg:col-span-1 min-w-0 animate-fade-in"
          style={{ animationDelay: "150ms" }}
        >
          <ProductionHealth />
        </div>

        <div
          className="lg:col-span-1 min-w-0 space-y-4 animate-fade-in"
          style={{ animationDelay: "200ms" }}
        >
          <StageChart />
          <RecentActivity />
        </div>
      </div>

      <ProductsSection />
    </div>
  );
}
