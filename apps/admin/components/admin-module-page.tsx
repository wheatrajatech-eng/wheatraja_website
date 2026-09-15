"use client";

import { useRef } from "react";
import { AdminActions } from "@/components/admin-actions";
import { AdminBlogEditor } from "@/components/admin-blog-editor";
import { AdminCommerceModule } from "@/components/admin-commerce-module";
import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminShell } from "@/components/admin-shell";
import { AdminManagement, ManagementKey } from "@/components/admin-management";
import { AdminModuleKey, getAdminModule } from "@/lib/admin-config";

export function AdminModulePage({ moduleKey }: { moduleKey: AdminModuleKey }) {
  const module = getAdminModule(moduleKey);
  const reloadRef = useRef<(() => Promise<void>) | null>(null);
  const customModules = ["products", "orders", "inventory", "returns", "refunds", "shipments", "customers", "payments", "banners", "blogs"];

  return (
    <AdminShell>
      {module.key === "dashboard" ? (
        <AdminDashboard />
      ) : ["subscriptions", "reviews", "contact", "users", "support", "recoveries", "deliverySlots"].includes(module.key) ? (
        <AdminManagement module={module.key as ManagementKey} />
      ) : module.key === "blogs" ? (
        <AdminBlogEditor />
      ) : customModules.includes(module.key) ? (
        <AdminCommerceModule moduleKey={module.key as "products" | "orders" | "inventory" | "returns" | "refunds" | "shipments" | "customers" | "payments" | "banners" | "blogs"} />
      ) : (
        <div className="grid gap-5">
          <section>
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#D4960E]">{module.label}</p>
            <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">{module.label}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">{module.description}</p>
          </section>
          <AdminActions module={module.key} onDone={async () => reloadRef.current?.()} />
          {module.endpoint ? (
            <AdminDataTable
              endpoint={module.endpoint}
              title={`${module.label} records`}
              description="Search, sort, paginate and inspect backend records."
              refetch={(fn) => {
                reloadRef.current = fn;
              }}
            />
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}
