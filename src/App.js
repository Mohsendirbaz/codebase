import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import ErrorBoundary from './utils/ErrorBoundary';
import '../src/components/process_economics/styles/LibrarySystem.css'
import '../src/components/find_factual_precedence/styles/FactualPrecedence.css'
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
