import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { store } from './store';
import { queryClient } from './lib/queryClient';
import { verifyToken } from './store/slices/authSlice';
import App from './App';
import './index.css';

// Performance monitoring simplificado
if (import.meta.env.DEV) {
  console.log('🚀 Aplicación con Redux + TanStack Query iniciada para máximo rendimiento!');
}

// Verificar token al inicio
store.dispatch(verifyToken());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <App />
        {/* DevTools solo en desarrollo */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>
);
