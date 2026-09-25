import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const WALLET_STORAGE_KEY = 'amazon_clone_wallet_state';

function loadLocalWallet() {
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    balance: 250.0,
    transactions: [
      {
        id: 'txn_init_1',
        type: 'credit',
        amount: 200.0,
        description: 'Amazon Pay Welcome Bonus Balance',
        method: 'Promotional Credit',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'txn_init_2',
        type: 'credit',
        amount: 50.0,
        description: 'Prime Cashback Reward — Electronics Order',
        method: 'Cashback',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
  };
}

function saveLocalWallet(state) {
  try {
    localStorage.setItem(
      WALLET_STORAGE_KEY,
      JSON.stringify({ balance: state.balance, transactions: state.transactions })
    );
  } catch (e) {}
}

export const fetchWallet = createAsyncThunk('wallet/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/wallet');
    return data;
  } catch (err) {
    return loadLocalWallet();
  }
});

export const addWalletFunds = createAsyncThunk(
  'wallet/addFunds',
  async ({ amount, method }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/wallet/add-funds', { amount, method });
      return data;
    } catch (err) {
      // Local fallback if user is guest or offline
      const current = loadLocalWallet();
      const numAmount = parseFloat(amount);
      const newBalance = parseFloat((current.balance + numAmount).toFixed(2));
      const txn = {
        id: 'txn_' + Date.now(),
        type: 'credit',
        amount: numAmount,
        description: `Wallet Top-Up via ${method}`,
        method,
        created_at: new Date().toISOString(),
      };
      current.transactions.unshift(txn);
      current.balance = newBalance;
      saveLocalWallet(current);
      return {
        balance: newBalance,
        transactions: current.transactions,
        message: `Successfully added $${numAmount.toFixed(2)} to your Amazon Pay Wallet`,
      };
    }
  }
);

export const redeemGiftCode = createAsyncThunk('wallet/redeem', async (code, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/wallet/redeem', { code });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid gift card code');
  }
});

const initial = loadLocalWallet();

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    balance: initial.balance,
    transactions: initial.transactions,
    loading: false,
  },
  reducers: {
    setWalletBalance: (state, action) => {
      state.balance = parseFloat(action.payload);
      saveLocalWallet(state);
    },
    deductLocalWallet: (state, action) => {
      const { amount, description } = action.payload;
      const num = parseFloat(amount);
      state.balance = Math.max(0, parseFloat((state.balance - num).toFixed(2)));
      state.transactions.unshift({
        id: 'txn_' + Date.now(),
        type: 'debit',
        amount: num,
        description: description || 'Amazon Clone Order Payment',
        method: 'Amazon Pay Wallet',
        created_at: new Date().toISOString(),
      });
      saveLocalWallet(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.fulfilled, (state, action) => {
        if (action.payload?.balance !== undefined) {
          state.balance = action.payload.balance;
        }
        if (Array.isArray(action.payload?.transactions)) {
          state.transactions = action.payload.transactions;
        }
        saveLocalWallet(state);
      })
      .addCase(addWalletFunds.fulfilled, (state, action) => {
        state.balance = action.payload.balance;
        state.transactions = action.payload.transactions;
        saveLocalWallet(state);
      })
      .addCase(redeemGiftCode.fulfilled, (state, action) => {
        state.balance = action.payload.balance;
        state.transactions = action.payload.transactions;
        saveLocalWallet(state);
      });
  },
});

export const { setWalletBalance, deductLocalWallet } = walletSlice.actions;
export default walletSlice.reducer;
