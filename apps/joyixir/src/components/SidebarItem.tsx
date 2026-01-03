/**
 * Sidebar Item Component
 * Navigation item with icon, label, and tooltip support when collapsed
 * Uses shadcn Tooltip for better collapsed state UX
 */

import type { LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from './ui/tooltip';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  badge?: string | number;
  onClick?: () => void;
}

export function SidebarItem({
  icon: Icon,
  label,
  active = false,
  collapsed = false,
  badge,
  onClick,
}: SidebarItemProps) {
  const button = (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 ${
        active
          ? 'bg-gray-800 text-white'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      } ${collapsed ? 'justify-center px-2' : ''}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate transition-opacity duration-150">
            {label}
          </span>
          {badge !== undefined && (
            <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-xs text-violet-400">
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );

  // Show tooltip when collapsed
  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

interface SidebarSectionProps {
  title: string;
  collapsed?: boolean;
  children: React.ReactNode;
}

export function SidebarSection({
  title,
  collapsed = false,
  children,
}: SidebarSectionProps) {
  return (
    <div className="mb-4">
      {!collapsed && (
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-gray-500 transition-opacity duration-150">
          {title}
        </p>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}
