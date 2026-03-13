"use client";

import React, { useEffect, useState } from 'react';
import { UISlotRegistry, UISlotItem } from '../../core/sdk/ConectorSDK';
import { Button } from '@/components/ui/button';
import * as Icons from 'lucide-react';
import { useConectores } from '@/contexts/ConectorContext';

interface UISlotProps {
    slotId: string;
    className?: string;
}

/**
 * UISlot Component: Renders items registered by connectors for a specific slot.
 * Now respects user placement preferences from connector settings.
 */
export function UISlot({ slotId, className = "" }: UISlotProps) {
    const [items, setItems] = useState<UISlotItem[]>([]);
    const { userConectores } = useConectores();

    useEffect(() => {
        const fetchAndFilterItems = () => {
            const allItems = UISlotRegistry.getAllItems();
            
            // Filter items based on user settings
            const filtered = allItems.filter(item => {
                // Find user settings for this connector
                const userConector = userConectores.find(uc => uc.conectorId === item.conectorId);
                const preferredSlot = userConector?.settings?.preferred_slot;

                // Logic: 
                // 1. If user has a preference, show item ONLY in that slot.
                // 2. If NO preference, show item in the slot it was originally registered to.
                if (preferredSlot) {
                    return preferredSlot === slotId;
                }

                // Fallback to original registration
                return UISlotRegistry.getItemsForSlot(slotId).some(i => i.id === item.id);
            });

            setItems(filtered);
        };

        fetchAndFilterItems();
        
        // Polling for dynamic registry changes (MVP simplification)
        const interval = setInterval(fetchAndFilterItems, 2000);

        return () => clearInterval(interval);
    }, [slotId, userConectores]);

    if (items.length === 0) return null;

    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {items.sort((a, b) => (b.priority || 0) - (a.priority || 0)).map(item => {
                const IconComponent = item.icon ? (Icons as any)[item.icon] : null;

                return (
                    <Button
                        key={item.id}
                        variant="ghost"
                        size="sm"
                        onClick={item.onClick}
                        className="gap-2 rounded-full hover:bg-primary/10 hover:text-primary transition-all text-xs border border-transparent hover:border-primary/20"
                        title={item.label}
                    >
                        {IconComponent && <IconComponent className="h-3 w-3" />}
                        <span className="hidden md:inline">{item.label}</span>
                    </Button>
                );
            })}
        </div>
    );
}
