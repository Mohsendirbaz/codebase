import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent } from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import './L_1_HomePage4.css';

/**
 * @typedef {Object} SummaryItem
 * @property {string} id - Unique identifier
 * @property {string} label - Display label
 * @property {number} originalValue - Initial value
 * @property {Object.<string, number>} scaledValues - Map of scaled values by tab ID
 * @property {boolean} isFrozen - Whether item is frozen
 * @property {number} sequentialResult - Result after sequential operations
 * @property {boolean} [calculationError] - Whether there was an error in calculation
 * @property {string} [suggestion] - Suggestion for fixing calculation error
 */

/**
 * @typedef {Object} TabConfig
 * @property {string} id - Unique identifier
 * @property {string} label - Display label
 * @property {boolean} [isParenthesis] - Whether this tab represents a parenthesis
 */

/**
 * @typedef {Object} SequentialOperation
 * @property {('multiply'|'divide'|'add'|'subtract'|'pass'|'openParen'|'closeParen'|'expression'|'power'|'log'|'exponential')} type
 * @property {number|string} value
 */

/**
 * @typedef {Object} ParenthesisGroup
 * @property {number} openIndex
 * @property {number} closeIndex
 */

/**
 * Get display symbol for mathematical operation
 * @param {string} operation - Operation type
 * @returns {string} Display symbol
 */
const getOperationSymbol = (operation) => {
  const symbols = {
    multiply: '×',
    divide: '÷',
    add: '+',
    subtract: '-',
    pass: '→',
    openParen: '(',
    closeParen: ')',
    power: '^',
    log: 'ln',
    exponential: 'eˣ'
  };
  return symbols[operation] || '×';
};

const AVAILABLE_OPERATIONS = [
  'multiply', 'divide', 'add', 'subtract', 'pass',
  'openParen', 'closeParen', 'power', 'log', 'exponential'
];

/**
 * @param {Object} props
 * @param {SummaryItem[]} props.items
 * @param {TabConfig[]} props.tabConfigs
 * @param {SequentialOperation[]} props.sequentialOperations
 * @param {function(number, SequentialOperation): void} props.onSequentialOperationChange
 * @param {function(TabConfig[]): void} props.onTabConfigsChange
 * @param {function(string, boolean): void} [props.onItemFreeze]
 * @param {function(string, string): void} [props.onExpressionChange]
 */
const ScalingSummary = ({
  items,
  tabConfigs,
  sequentialOperations,
  onSequentialOperationChange,
  onTabConfigsChange,
  onItemFreeze,
  onExpressionChange
}) => {
  const [itemExpressions, setItemExpressions] = useState({});
  const [frozenItems, setFrozenItems] = useState({});
  const [scalingConfig] = useState({ factor: 1 });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [intermediateResults, setIntermediateResults] = useState({});

  // Immediately update base values when items change
  useEffect(() => {
    const newResults = {};
    items.forEach(item => {
      // Store initial values from process costs
      newResults[item.id] = {
        baseValue: item.originalValue,
        currentValue: item.originalValue,
        steps: []
      };
    });
    setIntermediateResults(newResults);
    setLastUpdated(Date.now());
  }, [items]);

  // Calculate intermediate results based on operations
  const MAX_SAFE_VALUE = 1e10;
  const MIN_SAFE_VALUE = -1e10;

  const validateOperation = (operation, value, operand) => {
    switch(operation) {
      case 'add':
        if (value + operand > MAX_SAFE_VALUE) {
          throw new Error('Result exceeds maximum allowed value');
        }
        if (value + operand < MIN_SAFE_VALUE) {
          throw new Error('Result below minimum allowed value');
        }
        break;
      case 'subtract':
        if (value - operand < MIN_SAFE_VALUE) {
          throw new Error('Operation results in value below minimum');
        }
        break;
      case 'multiply':
        if (Math.abs(value * operand) > MAX_SAFE_VALUE) {
          throw new Error('Product exceeds maximum allowed value');
        }
        break;
      case 'divide':
        if (Math.abs(operand) < 1e-4) {
          throw new Error('Cannot divide by zero or very small values (< 0.0001)');
        }
        break;
      case 'power':
        if (value < 0 && !Number.isInteger(operand)) {
          throw new Error('Invalid negative base with fractional exponent');
        }
        if (Math.abs(Math.pow(value, operand)) > MAX_SAFE_VALUE) {
          throw new Error('Power operation result too large');
        }
        break;
      case 'log':
        if (value <= 0) {
          throw new Error('Cannot compute logarithm of zero or negative number');
        }
        break;
      case 'exponential':
        if (Math.abs(Math.exp(value * operand)) > MAX_SAFE_VALUE) {
          throw new Error('Exponential result exceeds maximum allowed value');
        }
        break;
    }
  };

  const calculateIntermediateResults = useCallback((itemId, operations) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return null;

    let currentValue = item.originalValue;
    const steps = [];

    operations.forEach((op, index) => {
      const prevValue = currentValue;
      const tabValue = item.scaledValues[tabConfigs[index]?.id] || item.originalValue;

      try {
        validateOperation(op.type, currentValue, tabValue);

        switch(op.type) {
          case 'multiply':
            currentValue *= tabValue;
            break;
          case 'divide':
            currentValue /= tabValue;
            break;
          case 'add':
            currentValue += tabValue;
            break;
          case 'subtract':
            currentValue -= tabValue;
            break;
          case 'power':
            currentValue = Math.pow(currentValue, tabValue);
            break;
          case 'log':
            currentValue = Math.log(currentValue);
            break;
          case 'exponential':
            currentValue = Math.exp(currentValue * tabValue);
            break;
        }

        steps.push({
          operation: op.type,
          prevValue,
          opValue: tabValue,
          result: currentValue,
          error: null
        });
      } catch (error) {
        steps.push({
          operation: op.type,
          prevValue,
          opValue: tabValue,
          result: prevValue,
          error: error.message
        });
        throw error;
      }
    });

    return { currentValue, steps };
  }, [items, tabConfigs]);

  // Update results when operations change
  useEffect(() => {
    const newResults = { ...intermediateResults };
    
    items.forEach(item => {
      try {
        const result = calculateIntermediateResults(item.id, sequentialOperations);
        if (result) {
          newResults[item.id] = {
            ...newResults[item.id],
            currentValue: result.currentValue,
            steps: result.steps
          };
        }
      } catch (error) {
        console.error(`Calculation error for ${item.label}:`, error);
        newResults[item.id] = {
          ...newResults[item.id],
          error: error.message
        };
      }
    });

    setIntermediateResults(newResults);
    setLastUpdated(Date.now());
  }, [items, sequentialOperations, calculateIntermediateResults]);

  /**
   * Check if parenthesis can be closed at given index
   * @param {number} index - Current operation index
   * @returns {boolean}
   */
  const canCloseParenthesis = (index) => {
    const prevOps = sequentialOperations.slice(0, index);
    const openCount = prevOps.filter(op => op.type === 'openParen').length;
    const closeCount = prevOps.filter(op => op.type === 'closeParen').length;
    return openCount > closeCount;
  };

  /**
   * Check if column is within parentheses
   * @param {number} index - Column index
   * @returns {boolean}
   */
  const isInParenthesis = (index) => {
    const groups = getParenthesisGroups();
    return groups.some(
      group => index > group.openIndex && index <= group.closeIndex
    );
  };

  /**
   * Handle expression change for an item
   * @param {string} itemId - Item identifier
   * @param {string} expression - New expression
   */
  const handleExpressionChange = (itemId, expression) => {
    setItemExpressions(prev => ({
      ...prev,
      [itemId]: expression
    }));
    
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      const values = {
        original: item.originalValue || 0,
        ...item.scaledValues
      };

      if (!expression) {
        return; // Empty expression is allowed
      }

      // Validate expression format
      if (!expression.match(/^[0-9+\-*/().^e\s]+$/)) {
        throw new Error('Expression contains invalid characters');
      }

      // Check for balanced parentheses
      const openCount = (expression.match(/\(/g) || []).length;
      const closeCount = (expression.match(/\)/g) || []).length;
      if (openCount !== closeCount) {
        throw new Error('Missing opening or closing parenthesis');
      }

      // Check for invalid operator sequences
      if (expression.match(/[+\-*/^]{2,}/)) {
        throw new Error('Invalid sequence of operators');
      }

      // Validate each number in the expression
      const numbers = expression.match(/\d+\.?\d*/g) || [];
      numbers.forEach(num => {
        const value = parseFloat(num);
        if (!Number.isFinite(value)) {
          throw new Error('Invalid numeric value');
        }
        if (Math.abs(value) > MAX_SAFE_VALUE) {
          throw new Error('Numeric value exceeds allowed range');
        }
      });

      onSequentialOperationChange(items.length - 1, {
        type: 'expression',
        value: expression
      });
      
      if (onExpressionChange) {
        onExpressionChange(itemId, expression);
      }
    } catch (error) {
      console.error('Expression validation failed:', error.message);
      const newResults = { ...intermediateResults };
      if (newResults[itemId]) {
        newResults[itemId].error = error.message;
        setIntermediateResults(newResults);
      }
    }
  };

  /**
   * Handle operation type change
   * @param {number} index - Operation index
   * @param {string} operation - New operation type
   */
  const handleOperationChange = (index, operation) => {
    try {
      let newConfigs = [...tabConfigs];
      let newOperations = [...sequentialOperations];

      // Validate operation before applying
      items.forEach(item => {
        const currentValue = intermediateResults[item.id]?.currentValue;
        if (typeof currentValue === 'number') {
          const tabValue = item.scaledValues[tabConfigs[index]?.id] || item.originalValue;
          
          switch(operation) {
            case 'divide':
              if (Math.abs(tabValue) < 1e-10) {
                throw new Error('Division by near-zero value');
              }
              break;
            case 'log':
              if (currentValue <= 0) {
                throw new Error('Log of non-positive number');
              }
              break;
            case 'power':
              if (!Number.isFinite(Math.pow(currentValue, tabValue))) {
                throw new Error('Power operation result too large');
              }
              break;
          }
        }
      });

      if (operation === 'openParen') {
        newConfigs.splice(index, 0, {
          id: `paren_open_${Date.now()}`,
          label: '(',
          isParenthesis: true
        });
        newOperations.splice(index, 0, { type: 'multiply', value: 1 });
        onTabConfigsChange(newConfigs);
      } else if (operation === 'closeParen' && canCloseParenthesis(index)) {
        newConfigs.splice(index + 1, 0, {
          id: `paren_close_${Date.now()}`,
          label: ')',
          isParenthesis: true
        });
        newOperations.splice(index, 0, { type: operation, value: 1 });
        onTabConfigsChange(newConfigs);
      }
      
      onSequentialOperationChange(index, {
        type: operation,
        value: scalingConfig.factor
      });
    } catch (error) {
      console.error('Operation validation failed:', error);
      // Update UI to show error
      const affectedItems = items.filter(item => 
        intermediateResults[item.id]?.error === error.message
      );
      affectedItems.forEach(item => {
        intermediateResults[item.id].error = error.message;
      });
      setLastUpdated(Date.now());
    }
  };

  /**
   * Get all parenthesis groups
   * @returns {ParenthesisGroup[]}
   */
  const getParenthesisGroups = () => {
    const groups = [];
    const stack = [];

    sequentialOperations.forEach((op, index) => {
      if (op.type === 'openParen') {
        stack.push(index);
      } else if (op.type === 'closeParen' && stack.length > 0) {
        const openIndex = stack.pop();
        groups.push({ openIndex, closeIndex: index });
      }
    });

    return groups;
  };

  /**
   * Get available operations for current index
   * @param {number} index - Current index
   * @returns {string[]} Available operations
   */
  const getAvailableOperations = (index) => {
    return canCloseParenthesis(index) 
      ? AVAILABLE_OPERATIONS 
      : AVAILABLE_OPERATIONS.filter(op => op !== 'closeParen');
  };

  /**
   * Toggle freeze state for an item
   * @param {string} itemId - Item identifier
   */
  const handleFreezeToggle = (itemId) => {
    setFrozenItems(prev => {
      const newState = { ...prev, [itemId]: !prev[itemId] };
      if (onItemFreeze) {
        onItemFreeze(itemId, newState[itemId]);
      }
      return newState;
    });
  };

  return (
    <Card className="scaling-summary">
      <CardHeader>
        <h3 className="scaling-summary-title">Scaling Summary</h3>
      </CardHeader>
      <CardContent>
        <div className="scaling-summary-container">
          <table className="scaling-summary-table">
            <thead>
              <tr className="scaling-summary-header">
                <th className="scaling-summary-cell">Item</th>
                <th className="scaling-summary-cell scaling-summary-cell-center">Free</th>
                <th className="scaling-summary-cell scaling-summary-cell-right">Original</th>
                {tabConfigs.map((tab, index) => (
                  <React.Fragment key={tab.id}>
                    <th className={`scaling-summary-cell scaling-summary-cell-right ${isInParenthesis(index) ? 'scaling-summary-parenthesis' : ''}`}>
                      {tab.label || `Scale ${tab.id}`}
                    </th>
                    <th className="scaling-summary-cell scaling-summary-cell-center">
                      <select
                        value={sequentialOperations[index]?.type || 'multiply'}
                        onChange={(e) => handleOperationChange(index, e.target.value)}
                        className="scaling-summary-operation-select"
                      >
                        {getAvailableOperations(index).map(op => (
                          <option key={op} value={op}>
                            {getOperationSymbol(op)}
                          </option>
                        ))}
                      </select>
                    </th>
                  </React.Fragment>
                ))}
                <th className="scaling-summary-cell scaling-summary-cell-right">Expression</th>
                <th className="scaling-summary-cell scaling-summary-cell-right scaling-summary-result">Result</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {items.map(item => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`scaling-summary-row ${item.isFrozen ? 'scaling-summary-row-frozen' : ''}`}
                  >
                    <td className="scaling-summary-cell">{item.label}</td>
                    <td className="scaling-summary-cell scaling-summary-cell-center">
                      <input
                        type="checkbox"
                        checked={frozenItems[item.id] || false}
                        onChange={() => handleFreezeToggle(item.id)}
                        className="scaling-summary-cell-checkbox"
                      />
                    </td>
                    <td className="scaling-summary-cell scaling-summary-cell-right">
                      <motion.span
                        key={`${item.id}-original-${lastUpdated}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {item.originalValue.toFixed(2)}
                      </motion.span>
                    </td>
                    {tabConfigs.map((tab, index) => (
                      <React.Fragment key={tab.id}>
                        <td className={`scaling-summary-cell scaling-summary-cell-right ${isInParenthesis(index) ? 'scaling-summary-parenthesis' : ''}`}>
                          <motion.span
                            key={`${item.id}-${tab.id}-${lastUpdated}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {(item.scaledValues[tab.id] || item.originalValue).toFixed(2)}
                          </motion.span>
                          {item.isFrozen && (
                            <span className="scaling-summary-cell-frozen-indicator">*</span>
                          )}
                        </td>
                        <td className="scaling-summary-cell scaling-summary-cell-center">
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="scaling-summary-operator"
                          >
                            {getOperationSymbol(sequentialOperations[index]?.type || 'multiply')}
                          </motion.span>
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="scaling-summary-cell">
                      <input
                        type="text"
                        className="scaling-summary-expression-input"
                        placeholder="Enter formula"
                        value={itemExpressions[item.id] || ''}
                        onChange={(e) => handleExpressionChange(item.id, e.target.value)}
                      />
                    </td>
                    <td className="scaling-summary-cell scaling-summary-cell-right scaling-summary-result">
                      <div className="scaling-summary-result-container">
                        {intermediateResults[item.id]?.error ? (
                          <motion.div
                            className="scaling-summary-error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <span>
                              {intermediateResults[item.id].currentValue?.toFixed(2) || '---'}
                            </span>
                            <motion.span
                              className="scaling-summary-error-message"
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              {intermediateResults[item.id].error}
                            </motion.span>
                          </motion.div>
                        ) : (
                          <>
                            <motion.span
                              key={`${item.id}-result-${lastUpdated}`}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                            >
                              {intermediateResults[item.id]?.currentValue?.toFixed(2) || item.sequentialResult.toFixed(2)}
                            </motion.span>
                            {intermediateResults[item.id]?.steps?.length > 0 && (
                              <motion.div
                                className="scaling-summary-steps"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                              >
                                {intermediateResults[item.id].steps.map((step, idx) => (
                                  <div key={idx} className="scaling-summary-step">
                                    <span>{step.prevValue.toFixed(2)}</span>
                                    <span className={step.error ? 'scaling-summary-operator-error' : 'scaling-summary-operator'}>
                                      {getOperationSymbol(step.operation)}
                                    </span>
                                    <span>{step.opValue.toFixed(2)}</span>
                                    <span>=</span>
                                    <span>{step.result.toFixed(2)}</span>
                                    {step.error && (
                                      <span className="scaling-summary-error">(!)</span>
                                    )}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div className="scaling-summary-footer">
          <div className="scaling-summary-footer-item">* Indicates a free item that maintains its original value in scaling operations</div>
          <div className="scaling-summary-footer-item">Base values are inherited from process costs</div>
          <div className="scaling-summary-footer-item">Click on a row to show calculation steps</div>
          <div className="scaling-summary-footer-item">Hover over error indicators (!) for detailed messages</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScalingSummary;
