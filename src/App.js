import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import ErrorBoundary from './components/modules/ErrorBoundary';
import { VersionStateProvider } from './contexts/VersionStateContext';

function App() {
  return (
    <ErrorBoundary>
      <VersionStateProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </Router>
      </VersionStateProvider>
    </ErrorBoundary>
  );
}

export default App;
