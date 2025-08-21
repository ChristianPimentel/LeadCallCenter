
"use client";

import Link from "next/link"
import { Home, Users as UsersIcon, PanelLeft, UserCog, LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Logo } from "@/components/icons"
import { useState, useEffect } from "react";
import type { User } from "@/lib/types";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('callflow-currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        if (user.passwordResetRequired && pathname !== '/dashboard/account') {
          window.location.href = '/dashboard/account';
        }
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    }
  }, [pathname]);
  
  const isAdmin = currentUser?.role === 'Admin';
  const passwordResetRequired = currentUser?.passwordResetRequired;

  const navLinkClasses = (href: string, disabled = false) => cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    pathname === href
      ? "bg-background text-foreground shadow-sm"
      : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
    disabled && "pointer-events-none opacity-50"
  );
  
  const mobileNavLinkClasses = (href: string, disabled = false) => cn(
    "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
     pathname === href && "bg-muted text-foreground",
     disabled && "pointer-events-none opacity-50"
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs">
            <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="#"
                onClick={() => setIsSheetOpen(false)}
                className={cn("group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base", passwordResetRequired && "pointer-events-none")}
              >
                <Logo className="h-5 w-5 transition-all group-hover:scale-110" />
                <span className="sr-only">CallFlow</span>
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setIsSheetOpen(false)}
                className={mobileNavLinkClasses("/dashboard", passwordResetRequired)}
              >
                <Home className="h-5 w-5" />
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard/users"
                  onClick={() => setIsSheetOpen(false)}
                  className={mobileNavLinkClasses("/dashboard/users", passwordResetRequired)}
                >
                  <UsersIcon className="h-5 w-5" />
                  Users
                </Link>
              )}
              <Link
                href="/dashboard/account"
                onClick={() => setIsSheetOpen(false)}
                className={mobileNavLinkClasses("/dashboard/account")}
              >
                <UserCog className="h-5 w-5" />
                Manage Account
              </Link>
               <Link
                href="/dashboard/help"
                onClick={() => setIsSheetOpen(false)}
                className={mobileNavLinkClasses("/dashboard/help")}
              >
                <LifeBuoy className="h-5 w-5" />
                Help
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        
        <div className="relative flex-1 md:grow-0">
            <Link href="/dashboard" className={cn("flex items-center gap-2 font-semibold", passwordResetRequired && "pointer-events-none")}>
              <Logo className="h-6 w-6" />
              <span className="hidden sm:inline-block">CallFlow</span>
            </Link>
        </div>

        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
             <Link
                href="/dashboard"
                className={navLinkClasses("/dashboard", passwordResetRequired)}
              >
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard/users"
                  className={navLinkClasses("/dashboard/users", passwordResetRequired)}
                >
                  Users
                </Link>
              )}
               <Link
                href="/dashboard/account"
                className={navLinkClasses("/dashboard/account")}
              >
                Manage Account
              </Link>
              <Link
                href="/dashboard/help"
                className={navLinkClasses("/dashboard/help")}
              >
                Help
              </Link>
        </nav>

        <div className="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarFallback>{currentUser?.name?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account ({currentUser?.role})</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/dashboard/account">
                <DropdownMenuItem>Manage Account</DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <Link href="/">
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        {children}
      </main>
    </div>
  )
}
