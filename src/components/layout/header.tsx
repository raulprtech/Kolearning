"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Plus,
  Menu,
  LogOut,
  User,
  Search,
  LayoutDashboard,
  BookOpen,
  FileBox,
  Archive
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const navItems = [
    { label: t('header.dashboard'), href: "/", icon: LayoutDashboard },
    { label: t('header.explore'), href: "/explore", icon: Search },
    { label: t('header.papers'), href: "/paper-box", icon: FileBox },
    { label: t('header.archive'), href: "/archive", icon: Archive },
  ];

  const renderProfileMenu = () => (
    <>
      <DropdownMenuItem asChild>
        <Link href="/profile" className="flex items-center gap-2 cursor-pointer w-full">
          <User className="h-4 w-4" />
          <span>{t('header.profile')}</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive cursor-pointer w-full">
        <LogOut className="h-4 w-4" />
        <span>{t('header.logout')}</span>
      </DropdownMenuItem>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-8">
        <div className="flex items-center gap-2 mr-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight font-headline hidden md:inline-block">Kolearning</span>
          </Link>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(profile?.name || user?.email)?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.name || user?.email?.split('@')[0]}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {renderProfileMenu()}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
