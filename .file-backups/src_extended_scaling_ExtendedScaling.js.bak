import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tab } from '@headlessui/react';
import { ArrowPathIcon, PlusIcon, TrashIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import * as math from 'mathjs';
import ScalingSummary from './ScalingSummary';
import '../components/L_1_HomePage.CSS/L_1_HomePage4.css';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';

// Tooltip component for operation explanations
const Tooltip = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);

  return (
    <div 
      className="tooltip-container"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            className="tooltip"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Draggable scaling item component
const DraggableScalingItem = ({ item, index, moveItem, ...props }) => {
  const ref = useRef(null);
  
  const [{ handlerId }, drop] = useDrop({
    accept: 'scaling-item',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      
      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'scaling-item',
    item: () => ({ id: item.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      data-handler-id={handlerId}
      {...props}
    />
  );
};

const ExtendedScaling = ({ 
  baseCosts = [],
  onScaledValuesChange,
  onSave,
  initialScalingGroups = [],
  onScalingGroupsChange
}) => {
  // State for undo/redo functionality
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [errors, setErrors] = useState({});
  const [protectedTabs, setProtectedTabs] = useState(new Set([]));
  const [sequentialOperations, setSequentialOperations] = useState([]);
  const [tabConfigs, setTabConfigs] = useState([]);
  const [frozenItems, setFrozenItems] = useState({});
  const [itemExpressions, setItemExpressions] = useState({});

  const [scalingGroups, setScalingGroups] = useState(() => {
    const initialGroups = initialScalingGroups.length > 0 
      ? initialScalingGroups 
      : [{
          id: 'default',
          name: 'Default Scaling',
          isProtected: false,
          items: baseCosts.map(cost => ({
            ...cost,
            baseValue: parseFloat(cost.value) || cost.baseValue || 0,
            scalingFactor: 1,
            operation: 'multiply',
            enabled: true,
            notes: '',
            scaledValue: parseFloat(cost.value) || cost.baseValue || 0
          }))
        }];
    
    setHistory([initialGroups]);
    setHistoryIndex(0);
    return initialGroups;
  });

  const [selectedGroup, setSelectedGroup] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Enhanced operations with descriptions
  const operations = [
    { 
      id: 'multiply', 
      label: 'Multiply', 
      symbol: '×',
      description: 'Multiplies the base value by the scaling factor'
    },
    { 
      id: 'power', 
      label: 'Power', 
      symbol: '^',
      description: 'Raises the base value to the power of the scaling factor'
    },
    { 
      id: 'divide', 
      label: 'Divide', 
      symbol: '÷',
      description: 'Divides the base value by the scaling factor'
    },
    { 
      id: 'log', 
      label: 'Logarithmic', 
      symbol: 'ln',
      description: 'Applies logarithmic scaling using the natural log'
    },
    {
      id: 'exponential',
      label: 'Exponential',
      symbol: 'eˣ',
      description: 'Applies exponential scaling'
    }
  ];

  // Enhanced error handling and validation
  const calculateScaledValue = (baseValue, operation, factor) => {
    try {
      if (baseValue === 0 && operation === 'divide') {
        throw new Error('Division by zero');
      }
      if (baseValue < 0 && operation === 'log') {
        throw new Error('Logarithm of negative number');
      }

      let result;
      switch (operation) {
        case 'multiply':
          result = math.multiply(baseValue, factor);
          break;
        case 'power':
          result = math.pow(baseValue, factor);
          break;
        case 'divide':
          result = math.divide(baseValue, factor);
          break;
        case 'log':
          result = math.multiply(math.log(baseValue), factor);
          break;
        case 'exponential':
          result = math.exp(math.multiply(math.log(baseValue), factor));
          break;
        default:
          result = baseValue;
      }

      if (!isFinite(result)) {
        throw new Error('Result is not a finite number');
      }

      return result;
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [baseValue]: error.message
      }));
      return 0;
    }
  };

  // Toggle protection for a scaling group
  const toggleProtection = useCallback((groupId) => {
    setProtectedTabs(prev => {
      const newProtected = new Set(prev);
      if (newProtected.has(groupId)) {
        newProtected.delete(groupId);
      } else {
        newProtected.add(groupId);
      }
      return newProtected;
    });
  }, []);

  // Undo/Redo functionality
  const addToHistory = useCallback((newGroups) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGroups);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setScalingGroups(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setScalingGroups(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Enhanced group management
  const addScalingGroup = useCallback(() => {
    const newGroup = {
      id: `group-${Date.now()}`,
      name: `Scaling Group ${scalingGroups.length + 1}`,
      isProtected: false,
          items: baseCosts.map(cost => ({
            ...cost,
            baseValue: cost.baseValue || 0,
            scalingFactor: 1,
            operation: 'multiply',
            enabled: true,
            notes: '',
            scaledValue: cost.baseValue || 0
          }))
    };
    
    const newGroups = [...scalingGroups, newGroup];
    setScalingGroups(newGroups);
    setSelectedGroup(scalingGroups.length);
    addToHistory(newGroups);
    if (onScalingGroupsChange) {
      onScalingGroupsChange(newGroups);
    }
  }, [scalingGroups, baseCosts, addToHistory]);

  const removeScalingGroup = useCallback((index) => {
    const groupToRemove = scalingGroups[index];
    if (protectedTabs.has(groupToRemove.id)) {
      setErrors(prev => ({
        ...prev,
        removal: `Cannot remove protected group "${groupToRemove.name}"`
      }));
      return;
    }

    const newGroups = scalingGroups.filter((_, idx) => idx !== index);
    setScalingGroups(newGroups);
    if (selectedGroup >= index) {
      setSelectedGroup(Math.max(0, selectedGroup - 1));
    }
    addToHistory(newGroups);
    if (onScalingGroupsChange) {
      onScalingGroupsChange(newGroups);
    }
  }, [scalingGroups, selectedGroup, addToHistory, protectedTabs]);

  // Drag and drop functionality
  const moveItem = useCallback((dragIndex, hoverIndex) => {
    const dragItem = scalingGroups[selectedGroup].items[dragIndex];
    const newItems = [...scalingGroups[selectedGroup].items];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, dragItem);
    
    const newGroups = [...scalingGroups];
    newGroups[selectedGroup] = {
      ...newGroups[selectedGroup],
      items: newItems
    };
    
    setScalingGroups(newGroups);
    addToHistory(newGroups);
  }, [scalingGroups, selectedGroup, addToHistory]);

  // Export/Import functionality
  const exportConfiguration = useCallback(() => {
    setIsExporting(true);
    try {
      const config = JSON.stringify({
        groups: scalingGroups,
        protectedTabs: Array.from(protectedTabs)
      }, null, 2);
      const blob = new Blob([config], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scaling-config-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        export: error.message
      }));
    } finally {
      setIsExporting(false);
    }
  }, [scalingGroups, protectedTabs]);

  // Enhanced item updates
  const updateGroupItem = useCallback((groupIndex, itemIndex, updates) => {
    const newGroups = [...scalingGroups];
    const group = {...newGroups[groupIndex]};
    const items = [...group.items];
    items[itemIndex] = {...items[itemIndex], ...updates};
    
    if ('scalingFactor' in updates || 'operation' in updates) {
      const baseValue = items[itemIndex].baseValue;
      const scaledValue = calculateScaledValue(
        baseValue,
        items[itemIndex].operation,
        items[itemIndex].scalingFactor
      );
      items[itemIndex].scaledValue = scaledValue;
    }
    
    group.items = items;
    newGroups[groupIndex] = group;
    setScalingGroups(newGroups);
    addToHistory(newGroups);
    if (onScalingGroupsChange) {
      onScalingGroupsChange(newGroups);
    }
  }, [scalingGroups, addToHistory]);

  // Initialize tabConfigs and sequentialOperations when scaling groups change
  useEffect(() => {
    const newTabConfigs = scalingGroups.map(group => ({
      id: group.id,
      label: group.name
    }));
    setTabConfigs(newTabConfigs);

    // Initialize sequential operations for each group
    const newOperations = scalingGroups.map(() => ({
      type: 'multiply',
      value: 1
    }));
    setSequentialOperations(newOperations);
  }, [scalingGroups]);

  // Effect to notify parent of changes
  useEffect(() => {
    if (onScaledValuesChange) {
      const allScaledValues = scalingGroups.map(group => ({
        groupId: group.id,
        groupName: group.name,
        isProtected: protectedTabs.has(group.id),
        items: group.items.map(item => ({
          id: item.id,
          baseValue: item.baseValue,
          scaledValue: item.enabled ? calculateScaledValue(
            item.baseValue,
            item.operation,
            item.scalingFactor
          ) : 0,
          operation: item.operation,
          scalingFactor: item.scalingFactor,
          enabled: item.enabled,
          notes: item.notes
        }))
      }));
      
      onScaledValuesChange(allScaledValues);
    }
  }, [scalingGroups, protectedTabs]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="scaling-container">
        <Tab.Group selectedIndex={selectedGroup} onChange={setSelectedGroup}>
          <div className="scaling-header">
            <Tab.List className="scaling-tab-list">
              {scalingGroups.map((group, index) => (
                <Tab
                  key={group.id}
                  className={({ selected }) =>
                    `scaling-tab ${selected ? 'scaling-tab-selected' : ''} ${protectedTabs.has(group.id) ? 'scaling-tab-protected' : ''}`
                  }
                >
                  <div className="scaling-tab-content">
                    <span>{group.name}</span>
                    <div className="scaling-tab-actions">
                      <div
                        className="scaling-tab-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProtection(group.id);
                        }}
                        title={protectedTabs.has(group.id) ? 'Protected (Click to unprotect)' : 'Unprotected (Click to protect)'}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            toggleProtection(group.id);
                          }
                        }}
                      >
                        {protectedTabs.has(group.id) ? (
                          <LockClosedIcon className="scaling-action-icon" />
                        ) : (
                          <LockOpenIcon className="scaling-action-icon" />
                        )}
                      </div>
                      {scalingGroups.length > 1 && !protectedTabs.has(group.id) && (
                        <TrashIcon
                          className="scaling-remove-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeScalingGroup(index);
                          }}
                        />
                      )}
                    </div>
                  </div>
                </Tab>
              ))}
            </Tab.List>
            
            <div className="scaling-actions">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="scaling-action-button"
                title="Undo"
              >
                <ArrowPathIcon className="scaling-action-icon rotate-180" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="scaling-action-button"
                title="Redo"
              >
                <ArrowPathIcon className="scaling-action-icon" />
              </button>
              <button
                onClick={exportConfiguration}
                disabled={isExporting}
                className="scaling-action-button"
                title="Export Configuration"
              >
                Export
              </button>
              <button
                onClick={addScalingGroup}
                className="scaling-add-button"
              >
                <PlusIcon className="scaling-add-icon" />
                Add Scaling Group
              </button>
            </div>
          </div>

          {errors.protection && (
            <div className="scaling-error-message">
              {errors.protection}
            </div>
          )}
          {errors.removal && (
            <div className="scaling-error-message">
              {errors.removal}
            </div>
          )}

          <Tab.Panels>
            {scalingGroups.map((group, groupIndex) => (
              <Tab.Panel key={group.id} className="scaling-panel">
                <div className="scaling-group-name">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => {
                      const newGroups = [...scalingGroups];
      newGroups[groupIndex].name = e.target.value;
      setScalingGroups(newGroups);
      addToHistory(newGroups);
      if (onScalingGroupsChange) {
        onScalingGroupsChange(newGroups);
      }
                    }}
                    className="scaling-name-input"
                    placeholder="Group Name"
                    disabled={protectedTabs.has(group.id)}
                  />
                </div>

                {group.items.map((item, itemIndex) => (
                  <DraggableScalingItem
                    key={item.id}
                    className={`scaling-item ${!item.enabled ? 'scaling-item-disabled' : ''}`}
                    item={item}
                    index={itemIndex}
                    moveItem={moveItem}
                  >
                    <div className="scaling-item-content">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) =>
                          updateGroupItem(groupIndex, itemIndex, {
                            enabled: e.target.checked
                          })
                        }
                        className="scaling-checkbox"
                        disabled={protectedTabs.has(group.id)}
                      />

                      <div className="scaling-item-info">
                        <label className="scaling-item-label">
                          {item.label}
                        </label>
                        <div className="scaling-base-value">
                          Base Value: {item.baseValue}
                        </div>
                      </div>

                      <Tooltip content={operations.find(op => op.id === item.operation)?.description}>
                        <select
                          value={item.operation}
                          onChange={(e) =>
                            updateGroupItem(groupIndex, itemIndex, {
                              operation: e.target.value
                            })
                          }
                          disabled={!item.enabled || protectedTabs.has(group.id)}
                          className="scaling-operation-select"
                        >
                          {operations.map(op => (
                            <option key={op.id} value={op.id}>
                              {op.label} ({op.symbol})
                            </option>
                          ))}
                        </select>
                      </Tooltip>

                      <input
                        type="number"
                        value={item.scalingFactor}
                        onChange={(e) =>
                          updateGroupItem(groupIndex, itemIndex, {
                            scalingFactor: parseFloat(e.target.value) || 0
                          })
                        }
                        disabled={!item.enabled || protectedTabs.has(group.id)}
                        className="scaling-factor-input"
                        step="0.1"
                        placeholder="Factor"
                      />

                      <div className="scaling-result">
                        <div className="scaling-result-value">
                          Scaled Value:{' '}
                          {item.enabled
                            ? calculateScaledValue(
                                item.baseValue,
                                item.operation,
                                item.scalingFactor
                              ).toFixed(2)
                            : 'Disabled'}
                        </div>
                        {errors[item.baseValue] && (
                          <div className="scaling-error">
                            {errors[item.baseValue]}
                          </div>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) =>
                        updateGroupItem(groupIndex, itemIndex, {
                          notes: e.target.value
                        })
                      }
                      disabled={!item.enabled || protectedTabs.has(group.id)}
                      className="scaling-notes-input"
                      placeholder="Notes about this scaling..."
                    />
                  </DraggableScalingItem>
                ))}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>

        {onSave && (
          <div className="scaling-footer">
            <button
              onClick={() => onSave(scalingGroups)}
              className="scaling-save-button"
            >
              Save Scaling Configuration
            </button>
          </div>
        )}

        <ScalingSummary
          items={scalingGroups[selectedGroup]?.items.map(item => ({
            id: item.id,
            label: item.label,
            originalValue: item.baseValue,
            scaledValues: { [scalingGroups[selectedGroup].id]: item.scaledValue },
            isFrozen: frozenItems[item.id],
            sequentialResult: item.enabled ? calculateScaledValue(
              item.baseValue,
              item.operation,
              item.scalingFactor
            ) : 0
          })) || []}
          tabConfigs={tabConfigs}
          sequentialOperations={sequentialOperations}
          onSequentialOperationChange={(index, operation) => {
            const newOperations = [...sequentialOperations];
            newOperations[index] = operation;
            setSequentialOperations(newOperations);
          }}
          onTabConfigsChange={setTabConfigs}
          onItemFreeze={(itemId, isFrozen) => {
            setFrozenItems(prev => ({
              ...prev,
              [itemId]: isFrozen
            }));
          }}
          onExpressionChange={(itemId, expression) => {
            setItemExpressions(prev => ({
              ...prev,
              [itemId]: expression
            }));
          }}
        />
      </div>
    </DndProvider>
  );
};

export default ExtendedScaling;