
'use client';

import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from '@/components/ui/popover';
import { BrainCircuit, Flame, Zap } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '../ui/separator';

const CoinIcon = (props: React.HTMLAttributes<HTMLSpanElement>) => (
    <span {...props}>🪙</span>
);

export function UserStats({ user }: { user: User }) {
     const weeklyActivity = [
        { day: 'Lun', active: true },
        { day: 'Mar', active: true },
        { day: 'Mié', active: false },
        { day: 'Jue', active: false },
        { day: 'Vie', active: true },
        { day: 'Sáb', active: true },
        { day: 'Dom', active: true },
    ];

    return (
        <div className='flex items-center gap-4 mr-2'>
           <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-orange-500">
                        <Flame className="h-5 w-5" />
                        <span className="font-bold">{user.currentStreak}</span>
                    </Button>
                </PopoverTrigger>
                 <PopoverContent className="w-auto p-4 px-12 py-4">
                    <div className="text-center">
                        <h4 className="text-sm font-semibold mb-2">Racha de estudio</h4>
                         <div className="flex justify-center gap-3 w-full mb-4">
                            {weeklyActivity.map((dayActivity) => (
                            <div key={dayActivity.day} className="flex flex-col items-center gap-2">
                                <p className="text-xs text-muted-foreground">{dayActivity.day}</p>
                                <div
                                className={`h-6 w-6 rounded-full ${dayActivity.active ? 'bg-orange-500' : 'bg-muted'}`}
                                title={`${dayActivity.day}: ${dayActivity.active ? 'Activo' : 'Inactivo'}`}
                                ></div>
                            </div>
                            ))}
                        </div>
                        <Separator className="my-2"/>
                        <p className="text-xs text-muted-foreground mt-2">¡Sigue así para no perder tu racha de {user.currentStreak} días!</p>
                    </div>
                </PopoverContent>
            </Popover>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-yellow-500">
                        <CoinIcon className="h-5 w-5" />
                        <span className="font-bold">{user.coins}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                    <div className="flex gap-4 items-center">
                        <div>
                            <BrainCircuit className="h-12 w-12 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold">Créditos Cognitivos</h4>
                            <p className="text-sm text-muted-foreground">Tienes {user.coins} créditos.</p>
                             <PopoverClose asChild>
                                <Button variant="link" asChild className="p-0 h-auto text-primary">
                                    <Link href="/tienda">COMPRAR ENERGÍA</Link>
                                </Button>
                             </PopoverClose>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

           <Button variant="ghost" size="sm" className="flex items-center gap-2 text-primary">
              <Zap className="h-5 w-5" />
              <span className="font-bold">{user.energy}</span>
           </Button>
        </div>
    );
}
