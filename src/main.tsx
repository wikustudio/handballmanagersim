import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
  // If an older service worker is installed in the user's browser that intercepts /api/,
  // ensure any navigation or fetch to /api/ bypasses it cleanly
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.update();
    }
  });
  registerSW({ immediate: true });
}



// Guard React DOM reconciliation against browser auto-translate (Safari/Chrome Translate)
// and third-party extensions that wrap or reparent text nodes, preventing
// NotFoundError: "The object can not be found here." / "Failed to execute 'removeChild' on 'Node'"
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child && child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.apply(this, arguments as any) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return this.appendChild(newNode);
    }
    return originalInsertBefore.apply(this, arguments as any) as T;
  };
}

const rootElem = document.getElementById('root')!;
const preboot = document.getElementById('fms-preboot-shell');
if (preboot) preboot.remove();

createRoot(rootElem).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
