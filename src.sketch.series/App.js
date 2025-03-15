import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import L_1_HomePage from './L_1_HomePage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<L_1_HomePage />} />
      </Routes>
    </Router>
  );
};

export default App;
