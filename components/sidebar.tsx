"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PenSquare,
  Search,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const WORKFLOW_ITEMS = [
  { href: "/create", label: "Create", icon: PenSquare },
  { href: "/research", label: "Research", icon: Search },
];

const LIBRARY_ITEMS = [
  { href: "/my-posts", label: "Post Library", icon: FileText },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  active: boolean;
  collapsed: boolean;
}

function NavItem({ href, label, icon: Icon, active, collapsed }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={collapsed ? label : undefined}
      className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        active
          ? "bg-surface-hover text-text"
          : "text-text-secondary hover:bg-surface-hover hover:text-text"
      }`}
    >
      <Icon size={18} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function SectionLabel({
  children,
  collapsed,
}: {
  children: React.ReactNode;
  collapsed: boolean;
}) {
  if (collapsed) return null;
  return (
    <span className="mb-2 block px-3 text-[10px] uppercase tracking-wide text-text-secondary">
      {children}
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col border-r border-border bg-surface transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight">
            LCI Engine
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded p-1 text-text-secondary hover:bg-surface-hover hover:text-text"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-4 p-2 pt-4">
        {/* Workflow Section */}
        <div>
          <SectionLabel collapsed={collapsed}>Workflow</SectionLabel>
          <div className="space-y-1">
            {WORKFLOW_ITEMS.map(({ href, label, icon }) => (
              <NavItem
                key={href}
                href={href}
                label={label}
                icon={icon}
                active={pathname.startsWith(href)}
                collapsed={collapsed}
              />
            ))}
          </div>
        </div>

        {/* Library Section */}
        <div>
          <SectionLabel collapsed={collapsed}>Library</SectionLabel>
          <div className="space-y-1">
            {LIBRARY_ITEMS.map(({ href, label, icon }) => (
              <NavItem
                key={href}
                href={href}
                label={label}
                icon={icon}
                active={pathname.startsWith(href)}
                collapsed={collapsed}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer - Settings */}
      <div className="border-t border-border p-2">
        <NavItem
          href="/settings"
          label="Settings"
          icon={Settings}
          active={pathname.startsWith("/settings")}
          collapsed={collapsed}
        />
        {!collapsed && (
          <p className="mt-2 px-3 text-[10px] text-text-secondary">
            Public staging build
          </p>
        )}
      </div>
    </aside>
  );
}
