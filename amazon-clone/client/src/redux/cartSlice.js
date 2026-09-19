import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const LOCAL_CART_KEY = 'amazon_clone_cart_items';

function getStoredCart() {
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveStoredCart(items) {
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Could not persist cart locally', e);
  }
}

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cart');
    if (Array.isArray(data)) {
      saveStoredCart(data);
    }
    return data;
  } catch (err) {
    // If backend endpoint is offline, return items from local storage
    return getStoredCart();
  }
});

export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ product_id, quantity = 1, product }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/cart', {
        product_id,
        quantity,
        itemData: product,
      });
      dispatch(fetchCart());
      return data;
    } catch (err) {
      // Local fallback
      const current = getStoredCart();
      const existing = current.find((i) => String(i.id) === String(product_id));
      if (existing) {
        existing.quantity += quantity;
      } else if (product) {
        current.push({ ...product, quantity });
      }
      saveStoredCart(current);
      return current;
    }
  }
);

export const updateCartQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ productId, quantity }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/cart/${productId}`, { quantity });
      dispatch(fetchCart());
      return data;
    } catch (err) {
      const current = getStoredCart();
      const item = current.find((i) => String(i.id) === String(productId));
      if (item) {
        if (quantity <= 0) {
          const filtered = current.filter((i) => String(i.id) !== String(productId));
          saveStoredCart(filtered);
          return filtered;
        } else {
          item.quantity = quantity;
          saveStoredCart(current);
          return current;
        }
      }
      return current;
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/remove',
  async (productId, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/cart/${productId}`);
      dispatch(fetchCart());
      return productId;
    } catch (err) {
      const current = getStoredCart();
      const filtered = current.filter((i) => String(i.id) !== String(productId));
      saveStoredCart(filtered);
      return filtered;
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: getStoredCart(),
    status: 'idle',
    error: null,
  },
  reducers: {
    clearCartState: (state) => {
      state.items = [];
      saveStoredCart([]);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (Array.isArray(action.payload)) {
          state.items = action.payload;
        }
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          state.items = action.payload;
        }
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          state.items = action.payload;
        }
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          state.items = action.payload;
        }
      });
  },
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
