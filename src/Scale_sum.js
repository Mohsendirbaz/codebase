import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './Card_set';
import { motion, AnimatePresence } from 'framer-motion';

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

  useEffect(() => {
    // Trigger animation when values change
    setLastUpdated(Date.now());
  }, [items, sequentialOperations]);

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
      if (!item) return;

      const values = {
        original: item.originalValue || 0,
        ...item.scaledValues
      };

      // Enhanced expression validation
      if (expression && !expression.match(/^[0-9+\-*/().^e\s]+$/)) {
        throw new Error('Invalid expression');
      }

      onSequentialOperationChange(items.length - 1, {
        type: 'expression',
        value: expression
      });
      
      if (onExpressionChange) {
        onExpressionChange(itemId, expression);
      }
    } catch (error) {
      console.error('Expression evaluation failed:', error);
    }
  };

  /**
   * Handle operation type change
   * @param {number} index - Operation index
   * @param {string} operation - New operation type
   */
  const handleOperationChange = (index, operation) => {
    let newConfigs = [...tabConfigs];
    let newOperations = [...sequentialOperations];

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
   * Get column style based on parenthesis grouping
   * @param {number} index - Column index
   * @returns {Object} Style object
   */
  const getColumnStyle = (index) => {
    const groups = getParenthesisGroups();
    const isInParenthesis = groups.some(
      group => index > group.openIndex && index <= group.closeIndex
    );

    return {
      backgroundColor: isInParenthesis ? 'rgba(59, 130, 246, 0.05)' : undefined,
      position: 'relative',
      transition: 'all 0.3s ease'
    };
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
        <h3 className="text-lg font-medium">Scaling Summary</h3>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Item</th>
                <th className="text-center py-2 px-4 w-16">Free</th>
                <th className="text-right py-2 px-4">Original</th>
                {tabConfigs.map((tab, index) => (
                  <React.Fragment key={tab.id}>
                    <th className="text-right py-2 px-4" style={getColumnStyle(index)}>
                      {tab.label || `Scale ${tab.id}`}
                    </th>
                    <th className="text-center py-2 px-2 w-20">
                      <select
                        value={sequentialOperations[index]?.type || 'multiply'}
                        onChange={(e) => handleOperationChange(index, e.target.value)}
                        className="operation-select"
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
                <th className="text-right py-2 px-4">Expression</th>
                <th className="text-right py-2 px-4 bg-gray-50">Result</th>
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
                    className={`border-b ${item.isFrozen ? 'bg-gray-50' : ''}`}
                  >
                    <td className="py-2 px-4">{item.label}</td>
                    <td className="text-center py-2 px-4">
                      <input
                        type="checkbox"
                        checked={frozenItems[item.id] || false}
                        onChange={() => handleFreezeToggle(item.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="text-right py-2 px-4">
                      <motion.span
                        key={`${item.id}-original-${lastUpdated}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mathematical-result"
                      >
                        {item.originalValue.toFixed(2)}
                      </motion.span>
                    </td>
                    {tabConfigs.map((tab, index) => (
                      <React.Fragment key={tab.id}>
                        <td className="text-right py-2 px-4" style={getColumnStyle(index)}>
                          <motion.span
                            key={`${item.id}-${tab.id}-${lastUpdated}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mathematical-result"
                          >
                            {(item.scaledValues[tab.id] || item.originalValue).toFixed(2)}
                          </motion.span>
                          {item.isFrozen && (
                            <span className="text-xs text-blue-500 ml-1">*</span>
                          )}
                        </td>
                        <td className="text-center py-2 px-2 text-gray-500">
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="operation-symbol"
                          >
                            {getOperationSymbol(sequentialOperations[index]?.type || 'multiply')}
                          </motion.span>
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        className="w-full px-2 py-1 border rounded mathematical-input"
                        placeholder="Enter formula"
                        value={itemExpressions[item.id] || ''}
                        onChange={(e) => handleExpressionChange(item.id, e.target.value)}
                      />
                    </td>
                    <td className="text-right py-2 px-4 bg-gray-50 font-medium">
                      {item.calculationError ? (
                        <motion.div
                          className="text-red-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <span>{item.sequentialResult.toFixed(2)}</span>
                          <motion.span
                            className="text-xs block"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {item.suggestion}
                          </motion.span>
                        </motion.div>
                      ) : (
                        <motion.span
                          key={`${item.id}-result-${lastUpdated}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mathematical-result"
                        >
                          {item.sequentialResult.toFixed(2)}
                        </motion.span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          * Indicates a free item that maintains its original value in scaling operations
        </div>
      </CardContent>
    </Card>
  );
};

export default ScalingSummary;
