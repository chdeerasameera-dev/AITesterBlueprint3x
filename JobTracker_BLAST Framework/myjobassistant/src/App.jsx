/**
 * App.jsx — Root component: Router + JobContext + ThemeContext Provider.
 * Sets up SPA routing for 3 pages: Dashboard, Add Job, Job List.
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { JobProvider } from './context/JobContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import AddJob from './pages/AddJob';
import Jobs from './pages/Jobs';

/** Root application — Router + Theme + Context providers */
const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <JobProvider>
        <Navbar />
        <Routes>
          <Route path="/"     element={<Dashboard />} />
          <Route path="/add"  element={<AddJob />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="*"     element={<Navigate to="/" replace />} />
        </Routes>
      </JobProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
