import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { App, AppState, Deployment } from '../types';
import { codePushService } from '../../services/api';
import { DeploymentHistoryItem } from '../../services/api/interfaces';

// ==================== Async Thunks ====================

/**
 * Fetch deployment history from the CodePush API
 */
export const fetchDeploymentHistory = createAsyncThunk<
  DeploymentHistoryItem[],
  { appName: string; deploymentName: string },
  { rejectValue: string }
>(
  'apps/fetchDeploymentHistory',
  async ({ appName, deploymentName }, { rejectWithValue }) => {
    try {
      const response = await codePushService.getDeploymentHistory({
        appName,
        deploymentName,
      });
      return response.data;
    } catch (error) {
      const apiError = error as { message?: string };
      return rejectWithValue(
        apiError.message || 'Failed to fetch deployment history'
      );
    }
  }
);

// ==================== Slice ====================

interface ExtendedAppState extends AppState {
  deploymentHistory: DeploymentHistoryItem[];
  loaders: {
    fetchingHistory: boolean;
  };
  errors: {
    historyError: string | null;
  };
}

const initialState: ExtendedAppState = {
  apps: [],
  selectedApp: null,
  selectedDeployment: null,
  loading: false,
  error: null,
  deploymentHistory: [],
  loaders: {
    fetchingHistory: false,
  },
  errors: {
    historyError: null,
  },
};

const appsSlice = createSlice({
  name: 'apps',
  initialState,
  reducers: {
    setApps: (state, action: PayloadAction<App[]>) => {
      state.apps = action.payload;
      state.loading = false;
      state.error = null;
    },
    setSelectedApp: (state, action: PayloadAction<App | null>) => {
      state.selectedApp = action.payload;
    },
    setSelectedDeployment: (state, action: PayloadAction<Deployment | null>) => {
      state.selectedDeployment = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearDeploymentHistory: (state) => {
      state.deploymentHistory = [];
      state.errors.historyError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Deployment History
    builder
      .addCase(fetchDeploymentHistory.pending, (state) => {
        state.loaders.fetchingHistory = true;
        state.errors.historyError = null;
      })
      .addCase(fetchDeploymentHistory.fulfilled, (state, action) => {
        state.loaders.fetchingHistory = false;
        state.deploymentHistory = action.payload;
        state.errors.historyError = null;
      })
      .addCase(fetchDeploymentHistory.rejected, (state, action) => {
        state.loaders.fetchingHistory = false;
        state.errors.historyError = action.payload || 'Failed to fetch history';
      });
  },
});

export const {
  setApps,
  setSelectedApp,
  setSelectedDeployment,
  setLoading,
  setError,
  clearDeploymentHistory,
} = appsSlice.actions;

// Selectors
export const selectApps = (state: { apps: ExtendedAppState }) => state.apps.apps;
export const selectSelectedApp = (state: { apps: ExtendedAppState }) =>
  state.apps.selectedApp;
export const selectSelectedDeployment = (state: { apps: ExtendedAppState }) =>
  state.apps.selectedDeployment;
export const selectDeploymentHistory = (state: { apps: ExtendedAppState }) =>
  state.apps.deploymentHistory;
export const selectHistoryLoading = (state: { apps: ExtendedAppState }) =>
  state.apps.loaders.fetchingHistory;
export const selectHistoryError = (state: { apps: ExtendedAppState }) =>
  state.apps.errors.historyError;

export default appsSlice.reducer;
