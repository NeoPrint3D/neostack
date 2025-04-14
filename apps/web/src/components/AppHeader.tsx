import { useState } from "react";
import { Button } from "@neo-stack/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@neo-stack/ui/components/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@neo-stack/ui/components/avatar";
import { Menu, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { authClient } from "@/lib/authClient";

type HeaderProps = {
  initialAuth: Auth | null;
};

export function AppHeader({ initialAuth }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      setIsMenuOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  const isAuthenticated = !!initialAuth?.user;
  const userName =
    initialAuth?.user?.name ||
    initialAuth?.user?.email?.split("@")[0] ||
    "User";
  const userImage = initialAuth?.user?.image;
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="bg-background border-b sticky top-0 z-50 ">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <a
            href="/"
            className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60"
          >
            MyApp
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6"></nav>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/20 hover:ring-primary/40">
                      <AvatarImage
                        src={userImage || undefined}
                        alt={userName}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-muted">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <span className="font-semibold">{userName}</span>
                    <p className="text-sm text-muted-foreground">
                      {initialAuth?.user?.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a
                      href="/dashboard"
                      className="flex items-center w-full cursor-pointer"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href="/profile"
                      className="flex items-center w-full cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Profile
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
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
            className="md:hidden rounded-full"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-2 px-4">
              {isAuthenticated && (
                <a
                  href="/dashboard"
                  className="text-foreground hover:text-primary py-2 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </a>
              )}
              {isAuthenticated ? (
                <>
                  <a
                    href="/profile"
                    className="text-foreground hover:text-primary py-2 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </a>
                  <Button
                    variant="ghost"
                    className="justify-start text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
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
