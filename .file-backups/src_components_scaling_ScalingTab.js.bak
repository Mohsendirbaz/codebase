import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardContent } from './Card';
import MotionScalingSummary from './MotionScalingSummary';
import mathProcessor from './MathProcessor';
import './styles/scaling.css';

const ScalingTab = ({
  TooltipComponent,
  DraggableItemComponent,
  SummaryComponent,
  AnimatePresence,
  motion,
  initialItems = [],
  initialOperations = [],
  initialTabConfigs = {
    showLogarithmic: true,
    showLinear: true,
    precision: 2,
    defaultOperation: 'multiply'
  }
}) => {
  // State management
  const [items, setItems] = useState(initialItems);
  const [sequentialOperations, setSequentialOperations] = useState(initialOperations);
  const [tabConfigs, setTabConfigs] = useState(initialTabConfigs);
  const [activeExpression, setActiveExpression] = useState('');
  const [draggedItemId, setDraggedItemId] = useState(null);
  
  // Calculate derived values based on items and operations
  const processedItems = useMemo(() => {
    return items.map(item => {
      const processedValues = mathProcessor.calculateScaledValues(
        item.baseValue,
        sequentialOperations,
        tabConfigs
      );
      
      return {
        ...item,
        processedValues,
        logarithmicValue: tabConfigs.showLogarithmic 
          ? mathProcessor.calculateLogarithmic(item.baseValue, tabConfigs.precision) 
          : null,
        linearValue: tabConfigs.showLinear 
          ? mathProcessor.calculateLinear(item.baseValue, tabConfigs.precision) 
          : null
      };
    });
  }, [items, sequentialOperations, tabConfigs]);
  
  // Handlers
  const handleDragStart = useCallback((itemId) => {
    setDraggedItemId(itemId);
  }, []);
  
  const handleDragEnd = useCallback((itemId, newPosition) => {
    setDraggedItemId(null);
    
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      const itemIndex = updatedItems.findIndex(item => item.id === itemId);
      
      if (itemIndex !== -1) {
        // Calculate new value based on drag position
        const newValue = mathProcessor.calculateValueFromPosition(
          updatedItems[itemIndex].baseValue, 
          newPosition,
          tabConfigs
        );
        
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          baseValue: newValue
        };
      }
      
      return updatedItems;
    });
  }, [tabConfigs]);
  
  const handleItemFreeze = useCallback((itemId, isFrozen) => {
    setItems(prevItems => {
      return prevItems.map(item => 
        item.id === itemId ? { ...item, frozen: isFrozen } : item
      );
    });
  }, []);
  
  const handleOperationChange = useCallback((operations) => {
    setSequentialOperations(operations);
  }, []);
  
  const handleConfigChange = useCallback((newConfigs) => {
    setTabConfigs(prev => ({ ...prev, ...newConfigs }));
  }, []);
  
  const handleExpressionChange = useCallback((expression) => {
    setActiveExpression(expression);
    
    // Parse and apply the expression if needed
    if (expression) {
      try {
        const result = mathProcessor.evaluateExpression(expression, items);
        if (result && result.updatedItems) {
          setItems(result.updatedItems);
        }
        if (result && result.updatedOperations) {
          setSequentialOperations(result.updatedOperations);
        }
      } catch (error) {
        // Expression parsing error handling
        console.error("Expression evaluation error:", error);
      }
    }
  }, [items]);
  
  const handleAddItem = useCallback(() => {
    const newItem = {
      id: `item-${Date.now()}`,
      baseValue: 1,
      name: `Item ${items.length + 1}`,
      frozen: false
    };
    
    setItems(prev => [...prev, newItem]);
  }, [items.length]);
  
  const handleRemoveItem = useCallback((itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);
  
  const handleAddOperation = useCallback(() => {
    const newOperation = {
      id: `op-${Date.now()}`,
      type: tabConfigs.defaultOperation,
      value: 1
    };
    
    setSequentialOperations(prev => [...prev, newOperation]);
  }, [tabConfigs.defaultOperation]);
  
  const handleUpdateOperation = useCallback((opId, updates) => {
    setSequentialOperations(prev => 
      prev.map(op => op.id === opId ? { ...op, ...updates } : op)
    );
  }, []);
  
  const handleRemoveOperation = useCallback((opId) => {
    setSequentialOperations(prev => prev.filter(op => op.id !== opId));
  }, []);
  
  // Motion variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    },
    dragging: {
      scale: 1.05,
      boxShadow: "0px 10px 20px rgba(0,0,0,0.2)",
      zIndex: 10
    }
  };
  
  const operationVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 400, damping: 26 }
    }
  };
  
  return (
    <div className="scaling-tab">
      <Card className="scaling-controls">
        <CardHeader>Scaling Controls</CardHeader>
        <CardContent>
          <motion.div 
            className="config-section"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <h3>Display Options</h3>
            <motion.div className="config-row" variants={itemVariants}>
              <label>
                <input
                  type="checkbox"
                  checked={tabConfigs.showLogarithmic}
                  onChange={e => handleConfigChange({ showLogarithmic: e.target.checked })}
                />
                Show Logarithmic
              </label>
              <TooltipComponent content="Display logarithmic scale values">
                <span className="info-icon">ℹ️</span>
              </TooltipComponent>
            </motion.div>
            
            <motion.div className="config-row" variants={itemVariants}>
              <label>
                <input
                  type="checkbox"
                  checked={tabConfigs.showLinear}
                  onChange={e => handleConfigChange({ showLinear: e.target.checked })}
                />
                Show Linear
              </label>
              <TooltipComponent content="Display linear scale values">
                <span className="info-icon">ℹ️</span>
              </TooltipComponent>
            </motion.div>
            
            <motion.div className="config-row" variants={itemVariants}>
              <label>
                Precision:
                <select
                  value={tabConfigs.precision}
                  onChange={e => handleConfigChange({ precision: parseInt(e.target.value, 10) })}
                >
                  {[0, 1, 2, 3, 4].map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </label>
              <TooltipComponent content="Number of decimal places to display">
                <span className="info-icon">ℹ️</span>
              </TooltipComponent>
            </motion.div>
          </motion.div>
          
          <motion.div
            className="expression-section"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <h3>Expression</h3>
            <motion.div className="expression-row" variants={itemVariants}>
              <input
                type="text"
                value={activeExpression}
                onChange={e => handleExpressionChange(e.target.value)}
                placeholder="Enter scaling expression..."
                className="expression-input"
              />
              <TooltipComponent content="Enter a mathematical expression to apply to all items">
                <span className="info-icon">ℹ️</span>
              </TooltipComponent>
            </motion.div>
          </motion.div>
          
          <motion.div
            className="items-section"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <div className="section-header">
              <h3>Items</h3>
              <button onClick={handleAddItem} className="add-button">
                Add Item
              </button>
            </div>
            
            <AnimatePresence>
              {items.map((item) => (
                <DraggableItemComponent
                  key={item.id}
                  id={item.id}
                  onDragStart={() => handleDragStart(item.id)}
                  onDragEnd={(_, info) => handleDragEnd(item.id, info.point.y)}
                  isDragging={draggedItemId === item.id}
                  variants={itemVariants}
                  dragConstraints={{ top: 0, bottom: 200 }}
                  whileDrag="dragging"
                >
                  <motion.div className="item-row" variants={itemVariants}>
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => {
                        setItems(prev => prev.map(i => 
                          i.id === item.id ? { ...i, name: e.target.value } : i
                        ));
                      }}
                      className="item-name"
                    />
                    <input
                      type="number"
                      value={item.baseValue}
                      onChange={e => {
                        setItems(prev => prev.map(i => 
                          i.id === item.id ? { ...i, baseValue: parseFloat(e.target.value) } : i
                        ));
                      }}
                      disabled={item.frozen}
                      className="item-value"
                    />
                    <label className="freeze-label">
                      <input
                        type="checkbox"
                        checked={item.frozen}
                        onChange={e => handleItemFreeze(item.id, e.target.checked)}
                      />
                      Freeze
                    </label>
                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  </motion.div>
                </DraggableItemComponent>
              ))}
            </AnimatePresence>
          </motion.div>
          
          <motion.div
            className="operations-section"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <div className="section-header">
              <h3>Operations</h3>
              <button onClick={handleAddOperation} className="add-button">
                Add Operation
              </button>
            </div>
            
            <AnimatePresence>
              {sequentialOperations.map((operation) => (
                <motion.div
                  key={operation.id}
                  className="operation-row"
                  variants={operationVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <select
                    value={operation.type}
                    onChange={e => handleUpdateOperation(operation.id, { type: e.target.value })}
                    className="operation-type"
                  >
                    <option value="multiply">Multiply</option>
                    <option value="divide">Divide</option>
                    <option value="add">Add</option>
                    <option value="subtract">Subtract</option>
                    <option value="power">Power</option>
                    <option value="root">Root</option>
                    <option value="log">Log</option>
                  </select>
                  <input
                    type="number"
                    value={operation.value}
                    onChange={e => handleUpdateOperation(
                      operation.id, 
                      { value: parseFloat(e.target.value) }
                    )}
                    className="operation-value"
                  />
                  <button 
                    onClick={() => handleRemoveOperation(operation.id)}
                    className="remove-button"
                  >
                    Remove
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </CardContent>
      </Card>
      
      <SummaryComponent
        items={processedItems}
        tabConfigs={tabConfigs}
        sequentialOperations={sequentialOperations}
        onSequentialOperationChange={handleOperationChange}
        onTabConfigsChange={handleConfigChange}
        onItemFreeze={handleItemFreeze}
        onExpressionChange={handleExpressionChange}
        AnimatePresence={AnimatePresence}
        MotionRow={motion.tr}
        MotionSpan={motion.span}
        MotionDiv={motion.div}
      />
    </div>
  );
};

export default ScalingTab;
