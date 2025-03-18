import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import ErrorBoundary from './utils/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </Router>
    </ErrorBoundary>
  );
}

export default App;
