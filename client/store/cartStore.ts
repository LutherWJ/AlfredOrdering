import { defineStore } from 'pinia';
import type { CreateOrderRequest } from '../../shared/types';

export const useCartStore = defineStore('cart', {
  state: () => ({
    restaurant_id: null as string | null,
    items: [] as CreateOrderRequest['items'],
    pickup_time_requested: null as string | null,
    special_instructions: null as string | null,
  }),

  getters: {
    itemCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    // Check if cart has items
    hasItems: (state) => state.items.length > 0,
    // Check if restaurant is set
    hasRestaurant: (state) => state.restaurant_id !== null,
  },

  actions: {
    // Select a restaurant to order from
    setRestaurant(restaurant_id: string) {
      // If switching restaurants, clear cart
      if (this.restaurant_id && this.restaurant_id !== restaurant_id) {
        this.items = [];
      }
      this.restaurant_id = restaurant_id;
    },

    // Add item to cart
    addItem(item_id: string, quantity: number, extras: string[]) {
      this.items.push({
        item_id,
        quantity,
        extras,
      });
    },

    // Update item quantity
    updateItemQuantity(index: number, quantity: number) {
      if (quantity <= 0) {
        this.removeItem(index);
      } else {
        this.items[index].quantity = quantity;
      }
    },

    // Remove item from cart by index
    removeItem(index: number) {
      this.items.splice(index, 1);
    },

    // Clear entire cart
    clearCart() {
      this.restaurant_id = null;
      this.items = [];
      this.pickup_time_requested = null;
      this.special_instructions = null;
    },

    // Set pickup time
    setPickupTime(time: string | null) {
      this.pickup_time_requested = time;
    },

    // Set special instructions
    setSpecialInstructions(instructions: string | null) {
      this.special_instructions = instructions;
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
