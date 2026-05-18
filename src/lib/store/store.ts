import { configureStore } from '@reduxjs/toolkit';
import appsReducer from './appsSlice';
import authReducer from './authSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      apps: appsReducer,
      auth: authReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

