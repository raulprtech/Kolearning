
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderKanban, MessageSquare, PlusCircle, Settings, HelpCircle, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/proyectos', label: 'Proyectos', icon: FolderKanban },
    { href: '/tutor', label: 'Tutor Koli', icon: Bot },
];

const bottomNavItems = [
    { href: '/ajustes', label: 'Ajustes', icon: Settings },
    { href: '/preguntas-frecuentes', label: 'FAQ', icon: HelpCircle },
]

export function AppSidebar() {
    const pathname = usePathname();

    const NavLink = ({ item, isBottom = false }: { item: typeof navItems[0], isBottom?: boolean }) => {
        const isActive = pathname === item.href;
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Link
                            href={item.href}
                            className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:text-foreground',
                                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="sr-only">{item.label}</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {item.label}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-16 flex-col border-r bg-background sm:flex">
             <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                 <Link
                    href="/crear"
                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-10 md:w-10 md:text-base"
                >
                    <PlusCircle className="h-5 w-5 transition-all group-hover:scale-110" />
                    <span className="sr-only">Crear Proyecto</span>
                </Link>
                {navItems.map(item => <NavLink key={item.href} item={item} />)}
            </nav>
            <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
                 {bottomNavItems.map(item => <NavLink key={item.href} item={item} isBottom/>)}
            </nav>
        </aside>
    );
}
