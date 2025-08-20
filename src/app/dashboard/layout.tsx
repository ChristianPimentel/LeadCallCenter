
"use client";

import Link from "next/link"
import { Home, Users as UsersIcon, PanelLeft, UserCog } from "lucide-react"
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
    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
    pathname === href && "text-primary bg-muted",
    disabled && "pointer-events-none opacity-50"
  );
  
  const mobileNavLinkClasses = (href: string, disabled = false) => cn(
    "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
     pathname === href && "bg-muted text-foreground",
     disabled && "pointer-events-none opacity-50"
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className={cn("flex items-center gap-2 font-semibold", passwordResetRequired && "pointer-events-none")}>
              <Logo className="h-6 w-6" />
              <span className="">CallFlow</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                href="/dashboard"
                className={navLinkClasses("/dashboard", passwordResetRequired)}
              >
                <Home className="h-4 w-4" />
                Groups
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard/users"
                  className={navLinkClasses("/dashboard/users", passwordResetRequired)}
                >
                  <UsersIcon className="h-4 w-4" />
                  Users
                </Link>
              )}
               <Link
                href="/dashboard/account"
                className={navLinkClasses("/dashboard/account")}
              >
                <UserCog className="h-4 w-4" />
                Manage Account
              </Link>
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="#"
                  className={cn("flex items-center gap-2 text-lg font-semibold mb-4", passwordResetRequired && "pointer-events-none")}
                >
                  <Logo className="h-6 w-6" />
                  <span className="">CallFlow</span>
                </Link>
                <Link
                  href="/dashboard"
                  className={mobileNavLinkClasses("/dashboard", passwordResetRequired)}
                >
                  <Home className="h-5 w-5" />
                  Groups
                </Link>
                {isAdmin && (
                  <Link
                    href="/dashboard/users"
                    className={mobileNavLinkClasses("/dashboard/users", passwordResetRequired)}
                  >
                    <UsersIcon className="h-5 w-5" />
                    Users
                  </Link>
                )}
                <Link
                  href="/dashboard/account"
                  className={mobileNavLinkClasses("/dashboard/account")}
                >
                  <UserCog className="h-5 w-5" />
                  Manage Account
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
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
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
