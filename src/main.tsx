import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerOpenVoxServiceWorker } from './core/pwa';
import { AppProvider } from './app/AppContext';
import { App } from './app/App';
import './styles/global.css';
import './proLabLoader';

registerOpenVoxServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>
);
