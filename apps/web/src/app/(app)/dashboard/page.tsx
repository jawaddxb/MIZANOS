"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import { QuickStats } from "@/components/organisms/dashboard/QuickStats";
import { ActionItems } from "@/components/organisms/dashboard/ActionItems";
import { ProductionHealth } from "@/components/organisms/dashboard/ProductionHealth";
import { StageChart } from "@/components/organisms/dashboard/StageChart";
import { RecentActivity } from "@/components/organisms/dashboard/RecentActivity";
import { ProductsSection } from "@/components/organisms/dashboard/ProductsSection";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Project health overview and key action points
          </p>
        </div>
        <Link href="/intake">
          <Button className="shadow-sm hover:shadow-md transition-shadow">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      <QuickStats />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="lg:col-span-1 animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          <ActionItems />
        </div>

        <div
          className="lg:col-span-1 animate-fade-in"
          style={{ animationDelay: "150ms" }}
        >
          <ProductionHealth />
        </div>

        <div
          className="lg:col-span-1 space-y-6 animate-fade-in"
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
