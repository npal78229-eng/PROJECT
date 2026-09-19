import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cart');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ product_id, quantity = 1 }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/cart', { product_id, quantity });
      dispatch(fetchCart());
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add to cart');
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
      return rejectWithValue(err.response?.data?.message || 'Failed to remove from cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    clearCartState: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
