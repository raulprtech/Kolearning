/**
 * UISlotRegistry: Allows connectors to register UI elements in predefined slots.
 */
export class UISlotRegistry {
    private static slots: Map<string, UISlotItem[]> = new Map();

    static registerItem(slotId: string, item: UISlotItem) {
        if (!this.slots.has(slotId)) {
            this.slots.set(slotId, []);
        }
        this.slots.get(slotId)!.push(item);
        console.log(`[UISlotRegistry] Elemento registrado en el slot: ${slotId} (ID: ${item.id})`);
    }

    static unregisterItemsByConector(conectorId: string) {
        for (const [slotId, items] of this.slots.entries()) {
            this.slots.set(slotId, items.filter(item => item.conectorId !== conectorId));
        }
    }

    static getItemsForSlot(slotId: string): UISlotItem[] {
        return this.slots.get(slotId) || [];
    }

    static getAllItems(): UISlotItem[] {
        const all: UISlotItem[] = [];
        for (const items of this.slots.values()) {
            all.push(...items);
        }
        return all;
    }
}

export interface UISlotItem {
    id: string;          // Individual item ID
    conectorId: string;  // Which conector registered this
    label: string;
    icon?: string;       // Lucide icon name
    onClick: () => void;
    component?: any;     // Optional: A React component if the environment supports it
    priority?: number;   // Higher number = higher in position
}
