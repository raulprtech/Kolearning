"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Search,
    MessageSquare,
    LayoutDashboard,
    BrainCircuit,
    Library,
    ChevronRight,
    ChevronLeft,
    PanelLeft,
    BookOpen,
    Menu,
    Clock,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UISlot } from "@/components/connectors/UISlot";

export function Sidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const isProjectPage = pathname.startsWith('/study/') && !pathname.includes('/explore') && !pathname.includes('/archive');
    const projectId = isProjectPage ? pathname.split('/')[2] : null;
    const currentTab = searchParams.get('tab') || 'study';

    const navItems = [
        {
            label: "Chat",
            href: "/",
            icon: MessageSquare,
            active: pathname === "/"
        },
        {
            label: "Proyectos",
            href: "/projects",
            icon: LayoutDashboard,
            active: pathname === "/projects"
        }, {
            label: "Explorar",
            href: "/explore",
            icon: Search,
            active: pathname === "/explore"
        },
        {
            label: "Tareas Cron",
            href: "/scheduler",
            icon: Clock,
            active: pathname === "/scheduler"
        },
        {
            label: "Conectores",
            href: "/connectors",
            icon: Zap,
            active: pathname === "/connectors"
        }
    ];

    return (
        <>
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 bg-card border-r transition-all duration-300 ease-in-out md:relative md:translate-x-0 shadow-xl md:shadow-none",
                    isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:w-20 md:translate-x-0"
                )}
            >
                <div className="flex flex-col h-full">
                    <div className={cn(
                        "p-4 flex items-center transition-all duration-300",
                        isOpen ? "justify-between" : "justify-center"
                    )}>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggle}
                            className={cn("hover:bg-muted transition-colors", !isOpen && "md:w-12 md:h-12")}
                            title={isOpen ? "Cerrar barra lateral" : "Abrir barra lateral"}
                        >
                            <Menu className={cn("h-5 w-5", !isOpen && "scale-110")} />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto pt-2 no-scrollbar">
                        <div className="px-4 py-2">
                            <nav className="space-y-2">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        title={!isOpen ? item.label : undefined}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                            item.active
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                            !isOpen && "justify-center px-0"
                                        )}
                                    >
                                        <item.icon className={cn("h-5 w-5 shrink-0 transition-transform", !isOpen && "scale-110")} />
                                        <span className={cn(
                                            "transition-all duration-300 whitespace-nowrap overflow-hidden",
                                            isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 md:hidden"
                                        )}>
                                            {item.label}
                                        </span>
                                    </Link>
                                ))}
                            </nav>
                        </div>
                        
                        {/* Global Sidebar Slot for connectors */}
                        <div className={cn("mt-4 px-4 transition-all", !isOpen && "px-0 flex justify-center")}>
                            <UISlot slotId="global_sidebar" className={cn("flex-col items-start gap-1", !isOpen && "items-center")} />
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
