'use client';

import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BrainCircuit, Flame, Zap } from 'lucide-react';

const CoinIcon = (props: React.HTMLAttributes<HTMLSpanElement>) => (
    <span {...props}>🪙</span>
);

export function UserStats({ user }: { user: User }) {
    return (
        <div className='flex items-center gap-4 mr-2'>
           <Button variant="ghost" size="sm" className="flex items-center gap-2 text-orange-500">
              <Flame className="h-5 w-5" />
              <span className="font-bold">{user.currentStreak}</span>
           </Button>

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
                             <Button variant="link" className="p-0 h-auto text-primary">COMPRAR ENERGÍA</Button>
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
