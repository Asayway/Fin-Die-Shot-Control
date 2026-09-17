import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './i18n';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

// Global error handlers to capture unhandled browser exceptions & promise rejections safely
window.addEventListener('error', (event) => {
  console.warn('[Global Error Guard] Caught window error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.warn('[Global Error Guard] Caught unhandled rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>
);

