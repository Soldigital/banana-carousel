// Friendly page title + breadcrumb trail per dashboard/admin route. Keyed by
// exact pathname since the route set is small and fixed (no dynamic segments
// in this shell today).
export const ROUTE_TITLES: Record<string, { title: string; breadcrumb: string[] }> = {
  "/dashboard": { title: "Dashboard", breadcrumb: ["Dashboard"] },
  "/generate": { title: "Generate Carousel", breadcrumb: ["Dashboard", "Generate Carousel"] },
  "/dashboard/history": { title: "History", breadcrumb: ["Dashboard", "History"] },
  "/dashboard/brand-profiles": { title: "Brand Profiles", breadcrumb: ["Dashboard", "Brand Profiles"] },
  "/dashboard/api-keys": { title: "API Keys", breadcrumb: ["Dashboard", "API Keys"] },
  "/dashboard/affiliate": { title: "Affiliate", breadcrumb: ["Dashboard", "Affiliate"] },
  "/dashboard/founding": { title: "Founding Member", breadcrumb: ["Dashboard", "Founding Member"] },
  "/dashboard/pricing": { title: "Pricing", breadcrumb: ["Dashboard", "Pricing"] },
  "/dashboard/settings": { title: "Settings", breadcrumb: ["Dashboard", "Settings"] },
  "/dashboard/help": { title: "Help & Tutorial", breadcrumb: ["Dashboard", "Help & Tutorial"] },

  "/admin": { title: "Admin Dashboard", breadcrumb: ["Admin"] },
  "/admin/analytics": { title: "Analytics", breadcrumb: ["Admin", "Analytics"] },
  "/admin/users": { title: "Users", breadcrumb: ["Admin", "Users"] },
  "/admin/orders": { title: "Orders", breadcrumb: ["Admin", "Orders"] },
  "/admin/payments": { title: "Payments", breadcrumb: ["Admin", "Payments"] },
  "/admin/promo-codes": { title: "Promo Codes", breadcrumb: ["Admin", "Promo Codes"] },
  "/admin/affiliates": { title: "Affiliates", breadcrumb: ["Admin", "Affiliates"] },
  "/admin/announcements": { title: "Announcements", breadcrumb: ["Admin", "Announcements"] },
  "/admin/tutorials": { title: "Tutorials", breadcrumb: ["Admin", "Tutorials"] },
  "/admin/email-broadcast": { title: "Email Broadcast", breadcrumb: ["Admin", "Email Broadcast"] },
  "/admin/settings": { title: "Application Settings", breadcrumb: ["Admin", "Application Settings"] },
  "/admin/system-health": { title: "System Health", breadcrumb: ["Admin", "System Health"] },
};

export function getRouteTitle(pathname: string) {
  return ROUTE_TITLES[pathname] ?? { title: "Dashboard", breadcrumb: ["Dashboard"] };
}
