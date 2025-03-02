import React from 'react';
import './TestingZone.css';
import CFAConsolidationUI from './cfa/CFAConsolidationUI';

const TestingZone = () => {
  return (
    <div className="testing-zone-container">
      <h2 className="testing-zone-header">UI Component Testing Zone</h2>
      <div className="testing-zone-content">
        <div className="component-test-area">
          <h3>Testing: CFAConsolidationUI</h3>
          <CFAConsolidationUI />
        </div>
      </div>
    </div>
  );
};

export default TestingZone;
