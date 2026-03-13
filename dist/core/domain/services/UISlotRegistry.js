/**
 * UISlotRegistry: Allows connectors to register UI elements in predefined slots.
 */
export class UISlotRegistry {
    static registerItem(slotId, item) {
        if (!this.slots.has(slotId)) {
            this.slots.set(slotId, []);
        }
        this.slots.get(slotId).push(item);
        console.log(`[UISlotRegistry] Elemento registrado en el slot: ${slotId} (ID: ${item.id})`);
    }
    static unregisterItemsByConector(conectorId) {
        for (const [slotId, items] of this.slots.entries()) {
            this.slots.set(slotId, items.filter(item => item.conectorId !== conectorId));
        }
    }
    static getItemsForSlot(slotId) {
        return this.slots.get(slotId) || [];
    }
    static getAllItems() {
        const all = [];
        for (const items of this.slots.values()) {
            all.push(...items);
        }
        return all;
    }
}
UISlotRegistry.slots = new Map();
