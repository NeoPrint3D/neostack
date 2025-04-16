import React, { useEffect, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@neostack/ui/components/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@neostack/ui/components/breadcrumb";
import { Button } from "@neostack/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@neostack/ui/components/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@neostack/ui/components/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@neostack/ui/components/sidebar";
import {
  BarChart,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  FileUp,
  LayoutDashboard as DashboardIcon,
  LogOut,
  Mic,
  Plus,
  Rocket,
  Settings,
  Shield,
  Sparkles,
  User,
  Users,
  AudioLines,
  Home,
} from "lucide-react";
import { handleSignOut } from "@/lib/authClient";
import { cn } from "@neostack/ui/lib/utils";
import DashboardHeader from "./DashboardHeader";
import { deriveUserData } from "@/utils/deriveUserData";

// --- Data Structure Interfaces ---
interface TeamData {
  name: string;
  logo: React.ElementType;
  plan: string;
}

interface NavSubItemData {
  title: string;
  url: string;
  icon?: React.ElementType;
}

interface NavMainItemData {
  title: string;
  url?: string;
  defaultOpenState?: boolean;
  icon: React.ElementType;
  items?: NavSubItemData[];
  matchPaths?: string[];
}

interface UserData {
  name: string;
  email: string;
  avatar?: string | null;
  initials: string;
}

interface LayoutDashboardProps {
  children?: React.ReactNode;
  initialAuth: Auth | null;
  pageName: string;
  initialUrl: string;
}

// --- Helper Functions ---
const isPathActive = (
  currentPath: string,
  itemPath?: string,
  matchPaths?: string[]
): boolean => {
  if (itemPath && currentPath === itemPath) return true;
  if (matchPaths) {
    return matchPaths.some((path) => currentPath.startsWith(path));
  }
  return false;
};

// --- Components ---
function TeamSwitcher({ teams }: { teams: TeamData[] }) {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = useState(teams[0] || null);

  if (!activeTeam) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="opacity-50 pointer-events-none"
          >
            <div className="flex justify-center items-center bg-muted rounded-lg size-8 shrink-0"></div>
            <div className="group-data-[collapsed=true]:hidden flex-1 grid text-sm text-left">
              <span className="font-semibold truncate">No Teams</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={activeTeam.name}
            >
              <div className="flex justify-center items-center bg-primary rounded-lg size-8 text-primary-foreground shrink-0">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="group-data-[collapsed=true]:hidden flex-1 grid text-sm text-left leading-tight">
                <span className="font-semibold truncate">
                  {activeTeam.name}
                </span>
                <span className="text-muted-foreground text-xs truncate">
                  {activeTeam.plan}
                </span>
              </div>
              <ChevronsUpDown className="group-data-[collapsed=true]:hidden ml-auto size-4 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="rounded-lg w-[--radix-dropdown-menu-trigger-width] min-w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex justify-center items-center bg-background border rounded-sm size-6 shrink-0">
                  <team.logo className="size-4" />
                </div>
                {team.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2 cursor-pointer">
              <div className="flex justify-center items-center bg-background border rounded-md size-6 shrink-0">
                <Plus className="size-4" />
              </div>
              <span className="font-medium text-muted-foreground">
                Add team
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function NavMain({
  items,
  initialUrl,
}: {
  items: NavMainItemData[];
  initialUrl: string;
}) {
  // Extract pathname from initialUrl for SSR
  const initialPath = new URL(initialUrl).pathname;
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const updatePathData = () => {
      const newPath = window.location.pathname;
      setCurrentPath(newPath);

      // Initialize open states based on defaultOpenState and active paths
      const initialOpenStates = items.reduce(
        (acc, item) => {
          const hasSubItems = !!item.items?.length;
          if (hasSubItems) {
            // Open if defaultOpenState is true or if the item/sub-item is active
            const isGroupActive =
              item.defaultOpenState ||
              item.items?.some((subItem) =>
                isPathActive(newPath, subItem.url)
              ) ||
              isPathActive(newPath, undefined, item.matchPaths);
            acc[item.title] = isGroupActive;
          }
          return acc;
        },
        {} as Record<string, boolean>
      );
      setOpenStates(initialOpenStates);
    };

    updatePathData();
    document.addEventListener("astro:after-swap", updatePathData);
    return () =>
      document.removeEventListener("astro:after-swap", updatePathData);
  }, [items]);

  const handleOpenChange = (title: string, isOpen: boolean) => {
    setOpenStates((prev) => ({ ...prev, [title]: isOpen }));
  };

  // Initialize open states on server and client based on initialPath
  const initialOpenStates = items.reduce(
    (acc, item) => {
      const hasSubItems = !!item.items?.length;
      if (hasSubItems) {
        const isGroupActive =
          item.defaultOpenState ||
          item.items?.some((subItem) =>
            isPathActive(initialPath, subItem.url)
          ) ||
          isPathActive(initialPath, undefined, item.matchPaths);
        acc[item.title] = isGroupActive;
      }
      return acc;
    },
    {} as Record<string, boolean>
  );

  // Merge server-rendered open states with client-side state
  const effectiveOpenStates = { ...initialOpenStates, ...openStates };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = !!item.items?.length;
          const isOpen = effectiveOpenStates[item.title] ?? false;

          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={cn(
                    isPathActive(currentPath, item.url) &&
                      "bg-sidebar-primary text-sidebar-primary-foreground"
                  )}
                >
                  <a href={item.url ?? "#"} className="flex items-center">
                    <item.icon className="size-4 shrink-0" />
                    <span className="group-data-[collapsed=true]:hidden ml-2 truncate">
                      {item.title}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          const isParentActive = isPathActive(
            currentPath,
            undefined,
            item.matchPaths
          );
          const isChildActive = item.items?.some((subItem) =>
            isPathActive(currentPath, subItem.url)
          );
          const isActive = isParentActive || (isChildActive && isOpen);

          return (
            <Collapsible
              key={item.title}
              asChild
              open={isOpen}
              onOpenChange={(open) => handleOpenChange(item.title, open)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={cn(
                      "w-full",
                      isActive &&
                        "bg-sidebar-accent/50 text-sidebar-accent-foreground"
                    )}
                  >
                    <div className="flex flex-1 items-center">
                      <item.icon className="size-4 shrink-0" />
                      <span className="group-data-[collapsed=true]:hidden ml-2 truncate">
                        {item.title}
                      </span>
                    </div>
                    <ChevronRight className="group-data-[collapsed=true]:hidden ml-auto size-4 group-data-[state=open]/collapsible:rotate-90 transition-transform duration-200 shrink-0" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="group-data-[collapsed=true]:hidden mt-1">
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          size="sm"
                          className={cn(
                            "group/button text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
                            isPathActive(currentPath, subItem.url) &&
                              "text-sidebar-primary-foreground bg-sidebar-primary"
                          )}
                        >
                          <a href={subItem.url} className="flex items-center">
                            {subItem.icon && (
                              <subItem.icon
                                className="group-hover/button:stroke-sidebar-accent-foreground mr-2 size-4 shrink-0"
                                color={
                                  isPathActive(currentPath, subItem.url)
                                    ? "var(--sidebar-primary-foreground)"
                                    : "currentColor"
                                }
                              />
                            )}
                            <span className="truncate">{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavUser({ user }: { user: UserData }) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={user.name}
            >
              <Avatar className="rounded-lg size-8 shrink-0">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="bg-muted rounded-lg font-semibold text-muted-foreground">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="group-data-[collapsed=true]:hidden flex-1 grid text-sm text-left leading-tight">
                <span className="font-semibold truncate">{user.name}</span>
                <span className="text-muted-foreground text-xs truncate">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="group-data-[collapsed=true]:hidden ml-auto size-4 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="rounded-lg w-[--radix-dropdown-menu-trigger-width] min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <Avatar className="rounded-lg size-8">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="bg-muted rounded-lg font-semibold text-muted-foreground">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 grid text-sm text-left leading-tight">
                  <span className="font-semibold truncate">{user.name}</span>
                  <span className="text-muted-foreground text-xs truncate">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <Sparkles className="mr-2 size-4" />
                <span>Upgrade to Pro</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 size-4" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <CreditCard className="mr-2 size-4" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 size-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="focus:bg-destructive/10 text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

const teamsData: TeamData[] = [
  { name: "NeoStack", logo: Rocket, plan: "Enterprise" },
  { name: "Acme Inc.", logo: Users, plan: "Startup" },
  { name: "Dev Team", logo: Shield, plan: "Free" },
];

const navMainData: NavMainItemData[] = [
  { title: "Home", url: "/dashboard", icon: Home },
  {
    title: "Audio",
    defaultOpenState: true,
    icon: AudioLines,
    items: [
      { title: "Record", url: "/dashboard/record", icon: Mic },
      {
        title: "File Upload",
        url: "/dashboard/file-upload",
        icon: FileUp,
      },
    ],
  },
];

export function LayoutDashboard({
  children,
  pageName,
  initialAuth,
  initialUrl,
}: LayoutDashboardProps) {
  const userData = deriveUserData(initialAuth);

  return (
    <SidebarProvider>
      <div className="flex bg-background w-screen min-h-screen">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <TeamSwitcher teams={teamsData} />
          </SidebarHeader>
          <SidebarContent>
            <NavMain items={navMainData} initialUrl={initialUrl} />
          </SidebarContent>
          <SidebarFooter>
            {userData && <NavUser user={userData} />}
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-col flex-1">
          <DashboardHeader pageName={pageName} />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
