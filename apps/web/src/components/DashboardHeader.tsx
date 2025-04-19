import { SidebarTrigger } from "@neostack/ui/components/sidebar";
import { NotificationBell } from "./NotificationBell";

interface DashboardHeaderProps {
  pageName: string;
}
export default function DashboardHeader({ pageName }: DashboardHeaderProps) {
  return (
    <header className="top-0 z-50 sticky flex items-center gap-2 bg-background px-4 md:px-6 border-b h-16 shrink-0">
      <SidebarTrigger className="-ml-4 sm:ml-0" />
      <h1 className="font-semibold text-foreground text-lg truncate">
        {pageName}
      </h1>
      <div className="flex-1" />
      <NotificationBell />
    </header>
  );
}
