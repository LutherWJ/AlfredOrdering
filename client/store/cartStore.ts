import { defineStore } from 'pinia';
import type { CreateOrderRequest, SelectedExtra } from '../../shared/types';

// Load cart from localStorage
function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem('cart');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load cart from localStorage:', e);
  }
  return {
    restaurant_id: null,
    items: [],
    pickup_time_requested: null,
    special_instructions: null,
  };
}

export const useCartStore = defineStore('cart', {
  state: () => loadCartFromStorage(),

  getters: {
    itemCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    // Check if cart has items
    hasItems: (state) => state.items.length > 0,
    // Check if restaurant is set
    hasRestaurant: (state) => state.restaurant_id !== null,
  },

  actions: {
    // Save cart to localStorage
    saveToStorage() {
      try {
        localStorage.setItem('cart', JSON.stringify(this.$state));
      } catch (e) {
        console.error('Failed to save cart to localStorage:', e);
      }
    },

    // Select a restaurant to order from
    setRestaurant(restaurant_id: string) {
      // If switching restaurants, clear cart
      if (this.restaurant_id && this.restaurant_id !== restaurant_id) {
        this.items = [];
      }
      this.restaurant_id = restaurant_id;
      this.saveToStorage();
    },

    // Add item to cart with selected extras (supports nested extras for meals)
    addItem(item_id: string, quantity: number, extras: SelectedExtra[]) {
      this.items.push({
        item_id,
        quantity,
        extras,
      });
      console.log('[CartStore] Item added:', { item_id, quantity, extras, totalItems: this.items.length });
      this.saveToStorage();
    },

    // Update item quantity
    updateItemQuantity(index: number, quantity: number) {
      if (quantity <= 0) {
        this.removeItem(index);
      } else {
        this.items[index].quantity = quantity;
        this.saveToStorage();
      }
    },

    // Remove item from cart by index
    removeItem(index: number) {
      this.items.splice(index, 1);
      this.saveToStorage();
    },

    // Clear entire cart
    clearCart() {
      this.restaurant_id = null;
      this.items = [];
      this.pickup_time_requested = null;
      this.special_instructions = null;
      this.saveToStorage();
    },

    // Set pickup time
    setPickupTime(time: string | null) {
      this.pickup_time_requested = time;
      this.saveToStorage();
    },

    // Set special instructions
    setSpecialInstructions(instructions: string | null) {
      this.special_instructions = instructions;
      this.saveToStorage();
    },

    // Build CreateOrderRequest for API submission
    buildOrderRequest(): CreateOrderRequest {
      if (!this.restaurant_id) {
        throw new Error('Restaurant not set');
      }

      return {
        restaurant_id: this.restaurant_id,
        items: this.items,
        pickup_time_requested: this.pickup_time_requested || undefined,
        special_instructions: this.special_instructions || undefined,
      };
    },
  },
});
