import { useEffect, useState } from "react";
import { Button } from "@neostack/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@neostack/ui/components/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@neostack/ui/components/avatar";
import { Menu, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { authClient, handleSignOut } from "@/lib/authClient";
import { toast } from "sonner";
import { deriveUserData } from "@/utils/deriveUserData";
type HeaderProps = {
  initialAuth: Auth | null;
};

export function AppHeader({ initialAuth }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userData = deriveUserData(initialAuth);
  const isAuthenticated = !!initialAuth?.user;

  return (
    <header className="top-0 z-50 sticky bg-background border-b">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <a
            href="/"
            className="bg-clip-text bg-gradient-to-r from-primary to-primary/60 font-bold text-transparent text-2xl"
          >
            NeoStack
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center space-x-6"></nav>

          {/* Desktop Auth Controls */}
          <div className="hidden sm:flex items-center space-x-3">
            {userData ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="ring-border ring-1 hover:ring-primary/40 size-8">
                      <AvatarImage
                        src={userData.avatar || undefined}
                        alt={userData.name}
                      />
                      <AvatarFallback className="bg-muted font-semibold text-muted-foreground">
                        {userData.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-lg w-60">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3 p-1">
                      <Avatar className="rounded-md size-9">
                        <AvatarImage
                          src={userData.avatar || undefined}
                          alt={userData.name}
                        />
                        <AvatarFallback className="bg-muted rounded-md font-semibold text-muted-foreground">
                          {userData.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 grid min-w-0 text-sm text-left leading-tight">
                        <span className="font-semibold truncate">
                          {userData.name}
                        </span>
                        {/* Conditionally show email */}
                        {userData.email !== "no-email@example.com" && (
                          <span className="text-muted-foreground text-xs truncate">
                            {userData.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* Quick Links */}
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <a href="/dashboard" className="flex items-center w-full">
                      <LayoutDashboard className="mr-2 size-4" />
                      <span>Dashboard</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Sign Out */}
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="focus:bg-destructive/10 text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 size-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <a href="/login">Log In</a>
                </Button>
                <Button asChild>
                  <a href="/register">Register</a>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            className="sm:hidden rounded-full"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="sm:hidden py-4 border-t">
            <nav className="flex flex-col space-y-2 px-4">
              {isAuthenticated ? (
                <>
                  <a
                    href="/dashboard"
                    className="py-2 font-medium text-foreground hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </a>
                  <a
                    href="/profile"
                    className="py-2 font-medium text-foreground hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </a>
                  <Button
                    variant="ghost"
                    className="justify-start text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <a href="/login">Log In</a>
                  </Button>
                  <Button
                    className="justify-start"
                    asChild
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <a href="/register">Register</a>
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
