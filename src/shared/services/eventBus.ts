// ============================================================
// Optimile ERP – Cross-Module Event Bus
// ============================================================
// This is how modules communicate WITHOUT importing each other.
// Example: When TMS completes a trip, it publishes 'trip.completed'.
//          Finance module listens and auto-creates the expense entry.
//          Fleet module listens and updates vehicle availability.
// ============================================================

import { ERPEvent, ERPModule } from '../types';

type EventHandler = (event: ERPEvent) => void;

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private history: ERPEvent[] = [];

  // Subscribe to events
  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  // Publish an event
  emit(eventType: string, module: ERPModule, payload: any, userId: string, tenantId: string): void {
    const event: ERPEvent = {
      type: eventType,
      module,
      payload,
      timestamp: new Date().toISOString(),
      userId,
      tenantId,
    };

    this.history.push(event);
    // Keep last 1000 events
    if (this.history.length > 1000) this.history.shift();

    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventBus] Error in handler for "${eventType}":`, err);
        }
      });
    }
  }

  // Get recent events (for debugging / audit)
  getHistory(filter?: { module?: ERPModule; type?: string }): ERPEvent[] {
    let events = [...this.history];
    if (filter?.module) events = events.filter(e => e.module === filter.module);
    if (filter?.type) events = events.filter(e => e.type === filter.type);
    return events;
  }

  // Clear all handlers (useful for testing)
  reset(): void {
    this.handlers.clear();
    this.history = [];
  }
}

// Singleton – shared across the entire ERP
export const erpEventBus = new EventBus();
