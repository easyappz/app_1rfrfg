import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

const routes = ["/auth", "/dialogs", "/search", "/chat/:id", "/settings"];
if (typeof window !== 'undefined' && typeof window.handleRoutes === 'function') {
  try {
    window.handleRoutes(routes);
  } catch (e) {
    // no-op
  }
}

reportWebVitals();
