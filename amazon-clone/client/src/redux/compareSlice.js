import { createSlice } from '@reduxjs/toolkit';

const COMPARE_STORAGE_KEY = 'amazon_clone_compare_items';

const DEFAULT_COMPARE_ITEMS = [
  {
    id: 1,
    title: 'Noise-Cancelling Wireless Headphones Pro',
    description: 'Studio-grade active noise cancellation, 40-hour battery life, spatial audio, and plush memory foam ear cups.',
    price: 199.99,
    rating: 4.8,
    num_reviews: 142,
    stock: 45,
    category_id: 1,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
  },
  {
    id: 5,
    title: 'True Wireless Noise-Cancelling Earbuds',
    description: 'Pocket-sized charging case, IPX5 water resistance, low-latency gaming mode, and crystal clear voice calls.',
    price: 129.99,
    rating: 4.6,
    num_reviews: 89,
    stock: 75,
    category_id: 3,
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'],
  },
];

function loadCompareItems() {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return DEFAULT_COMPARE_ITEMS;
}

function saveCompareItems(items) {
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {}
}

const compareSlice = createSlice({
  name: 'compare',
  initialState: {
    items: loadCompareItems(),
  },
  reducers: {
    toggleCompareItem: (state, action) => {
      const product = action.payload;
      const existingIdx = state.items.findIndex((item) => Number(item.id) === Number(product.id));
      if (existingIdx >= 0) {
        state.items.splice(existingIdx, 1);
      } else {
        if (state.items.length >= 4) {
          state.items.shift(); // Keep max 4 items in comparison matrix
        }
        state.items.push(product);
      }
      saveCompareItems(state.items);
    },
    addToCompare: (state, action) => {
      const product = action.payload;
      const exists = state.items.some((item) => Number(item.id) === Number(product.id));
      if (!exists) {
        if (state.items.length >= 4) {
          state.items.shift();
        }
        state.items.push(product);
        saveCompareItems(state.items);
      }
    },
    removeFromCompare: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((item) => Number(item.id) !== Number(id));
      saveCompareItems(state.items);
    },
    clearCompare: (state) => {
      state.items = [];
      saveCompareItems([]);
    },
  },
});

export const { toggleCompareItem, addToCompare, removeFromCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;
