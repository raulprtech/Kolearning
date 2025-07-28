'use client'

import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { BookOpenCheck, Home, Package, Bot, BarChart4, Settings } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navLinks = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/proyectos', icon: Package, label: 'Proyectos' },
    { href: '/tutor', icon: Bot, label: 'Tutor' },
]

export function AppSidebar() {
    const pathname = usePathname()
    return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <Link
                href="#"
                className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
                <BookOpenCheck className="h-4 w-4 transition-all group-hover:scale-110" />
                <span className="sr-only">Kolearning</span>
            </Link>
            <TooltipProvider>
                {navLinks.map((link) => (
                     <Tooltip key={link.href}>
                        <TooltipTrigger asChild>
                        <Link
                            href={link.href}
                            className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                                pathname === link.href && "bg-accent text-accent-foreground"
                            )}
                        >
                            <link.icon className="h-5 w-5" />
                            <span className="sr-only">{link.label}</span>
                        </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{link.label}</TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Link
                        href="/ajustes"
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                            pathname === "/ajustes" && "bg-accent text-accent-foreground"
                        )}
                    >
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Settings</span>
                    </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">Settings</TooltipContent>
                </Tooltip>
             </TooltipProvider>
        </nav>
    </aside>
    )
}
