import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Polyfill requestIdleCallback / cancelIdleCallback for Safari & iOS WebKit
if (typeof window !== 'undefined') {
  const win = window as any;
  if (typeof win.requestIdleCallback !== 'function') {
    win.requestIdleCallback = (cb: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void) => {
      const start = Date.now();
      return window.setTimeout(() => {
        cb({
          didTimeout: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
        });
      }, 1);
    };
  }
  if (typeof win.cancelIdleCallback !== 'function') {
    win.cancelIdleCallback = (id: number) => {
      window.clearTimeout(id);
    };
  }
}

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
