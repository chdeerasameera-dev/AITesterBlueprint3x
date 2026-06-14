/** Entry point — mounts the React app into #root */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './theme/ocean.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
