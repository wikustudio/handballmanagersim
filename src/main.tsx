import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

const fallbackBefore = document.getElementById('app-loading-fallback');
if (fallbackBefore) {
  fallbackBefore.style.display = 'none';
  fallbackBefore.remove();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
);

requestAnimationFrame(() => {
  const fallbackAfter = document.getElementById('app-loading-fallback');
  if (fallbackAfter) {
    fallbackAfter.style.display = 'none';
    fallbackAfter.remove();
  }
});
