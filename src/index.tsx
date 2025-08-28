import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // Removing StrictMode to prevent duplicate API calls in development
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);