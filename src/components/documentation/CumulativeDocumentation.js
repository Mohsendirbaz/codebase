/**
 * @file CumulativeDocumentation.js
 * @description Documentation component explaining cumulative calculations in the scaling system
 * @module components/documentation
 * @requires react
 */
import React from 'react';
import '../../styles/HomePage.CSS/HCSS.css';

/**
 * CumulativeDocumentation Component
 * Displays documentation explaining how cumulative calculations work in the scaling system
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to call when the documentation is closed
 * @returns {React.ReactElement} CumulativeDocumentation component
 */
const CumulativeDocumentation = ({ onClose }) => (
    <div className="scaling-documentation">
        <h4>Understanding Cumulative Calculations</h4>
        <p>In this scaling system, each tab (after the Default Scaling) builds upon the results of previous tabs:</p>

        <ol>
            <li><strong>Default Scaling</strong> - Uses original base values from your cost data</li>
            <li><strong>Subsequent Tabs</strong> - Each uses the results from the previous tab as its base values</li>
        </ol>

        <p>When you add, remove, or modify tabs, all subsequent tabs automatically update to maintain the mathematical flow.</p>

        <div className="scaling-documentation-example">
            <div className="example-flow">
                <div className="example-tab">
                    <div>Default Tab</div>
                    <div className="example-value">Base: 100</div>
                    <div className="example-op">× 2</div>
                    <div className="example-result">Result: 200</div>
                </div>
                <div className="example-arrow">→</div>
                <div className="example-tab">
                    <div>Second Tab</div>
                    <div className="example-value">Base: 200</div>
                    <div className="example-op">+ 50</div>
                    <div className="example-result">Result: 250</div>
                </div>
                <div className="example-arrow">→</div>
                <div className="example-tab">
                    <div>Third Tab</div>
                    <div className="example-value">Base: 250</div>
                    <div className="example-op">× 1.2</div>
                    <div className="example-result">Result: 300</div>
                </div>
            </div>
        </div>

        <button className="scaling-documentation-button" onClick={onClose}>
            Got it
        </button>
    </div>
);

export default CumulativeDocumentation;