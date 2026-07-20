import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Sparkles,
  History,
  Palette,
  KeyRound,
  Share2,
  Crown,
  Tag,
  Settings,
  HelpCircle,
  Users,
  ClipboardList,
  Wallet,
  Ticket,
  BarChart3,
  Megaphone,
  GraduationCap,
  Mail,
  SlidersHorizontal,
  Activity,
} from "lucide-react";
import {
  USE_BRAND_PROFILES,
  USE_AFFILIATE,
  USE_PRICING_V2,
} from "@/lib/config/flags";
import type { EntitlementStatus } from "@/lib/license/status";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  /** Whether this item should be shown given the current user status. */
  show: (status: EntitlementStatus) => boolean;
}

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  superOnly?: boolean;
  show: (isSuper: boolean) => boolean;
}

// Module-level constants — never recreated per render. Sidebar filters these
// with `.show(...)` inside a useMemo keyed on the relevant status/role.
export const USER_NAV_ALL: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: () => true },
  { label: "Generate Carousel", href: "/generate", icon: Sparkles, show: () => true },
  { label: "History", href: "/dashboard/history", icon: History, show: () => true },
  {
    label: "Brand Profiles",
    href: "/dashboard/brand-profiles",
    icon: Palette,
    show: () => USE_BRAND_PROFILES,
  },
  { label: "API Keys", href: "/dashboard/api-keys", icon: KeyRound, show: () => true },
  {
    label: "Affiliate",
    href: "/dashboard/affiliate",
    icon: Share2,
    show: () => USE_AFFILIATE,
  },
  {
    label: "Founding Member",
    href: "/dashboard/founding",
    icon: Crown,
    show: (status) => USE_PRICING_V2 && status.founderNumber != null,
  },
  { label: "Pricing", href: "/dashboard/pricing", icon: Tag, show: () => true },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, show: () => true },
  { label: "Help & Tutorial", href: "/dashboard/help", icon: HelpCircle, show: () => true },
];

export const ADMIN_NAV_ALL: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, superOnly: true, show: (isSuper) => isSuper },
  { label: "Users", href: "/admin/users", icon: Users, show: () => true },
  { label: "Orders", href: "/admin/orders", icon: ClipboardList, show: () => true },
  { label: "Payments", href: "/admin/payments", icon: Wallet, comingSoon: true, superOnly: true, show: (isSuper) => isSuper },
  {
    label: "Promo Codes",
    href: "/admin/promo-codes",
    icon: Ticket,
    superOnly: true,
    show: (isSuper) => isSuper && USE_PRICING_V2,
  },
  {
    label: "Affiliates",
    href: "/admin/affiliates",
    icon: Share2,
    superOnly: true,
    show: (isSuper) => isSuper && USE_AFFILIATE,
  },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, superOnly: true, show: (isSuper) => isSuper },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone, superOnly: true, show: (isSuper) => isSuper },
  { label: "Tutorials", href: "/admin/tutorials", icon: GraduationCap, superOnly: true, show: (isSuper) => isSuper },
  { label: "Email Broadcast", href: "/admin/email-broadcast", icon: Mail, comingSoon: true, superOnly: true, show: (isSuper) => isSuper },
  { label: "Application Settings", href: "/admin/settings", icon: SlidersHorizontal, comingSoon: true, superOnly: true, show: (isSuper) => isSuper },
  { label: "System Health", href: "/admin/system-health", icon: Activity, comingSoon: true, superOnly: true, show: (isSuper) => isSuper },
];
