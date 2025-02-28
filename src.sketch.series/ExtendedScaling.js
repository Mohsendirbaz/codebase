import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { ArrowPathIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import * as math from 'mathjs';

const ExtendedScaling = ({ 
  baseCosts = [], // Array of base costs to be scaled
  onScaledValuesChange, // Callback when scaled values change
  onSave, // Callback to save scaling configuration
  initialScalingGroups = [] // Pre-existing scaling groups
}) => {
  // State for managing multiple scaling groups (tabs)
  const [scalingGroups, setScalingGroups] = useState(initialScalingGroups.length > 0 
    ? initialScalingGroups 
    : [{
        id: 'default',
        name: 'Default Scaling',
        items: baseCosts.map(cost => ({
          ...cost,
          scalingFactor: 1,
          operation: 'multiply',
          enabled: true,
          notes: ''
        }))
      }]
  );

  // State for the currently selected group
  const [selectedGroup, setSelectedGroup] = useState(0);

  // Mathematical operations available for scaling
  const operations = [
    { id: 'multiply', label: 'Multiply', symbol: '×' },
    { id: 'power', label: 'Power', symbol: '^' },
    { id: 'divide', label: 'Divide', symbol: '÷' },
    { id: 'log', label: 'Logarithmic', symbol: 'ln' }
  ];

  // Calculate scaled value based on operation and factors
  const calculateScaledValue = (baseValue, operation, factor) => {
    try {
      switch (operation) {
        case 'multiply':
          return math.multiply(baseValue, factor);
        case 'power':
          return math.pow(baseValue, factor);
        case 'divide':
          return math.divide(baseValue, factor);
        case 'log':
          return math.multiply(math.log(baseValue), factor);
        default:
          return baseValue;
      }
    } catch (error) {
      console.error('Calculation error:', error);
      return 0;
    }
  };

  // Add a new scaling group
  const addScalingGroup = () => {
    const newGroup = {
      id: `group-${Date.now()}`,
      name: `Scaling Group ${scalingGroups.length + 1}`,
      items: baseCosts.map(cost => ({
        ...cost,
        scalingFactor: 1,
        operation: 'multiply',
        enabled: true,
        notes: ''
      }))
    };
    
    setScalingGroups([...scalingGroups, newGroup]);
    setSelectedGroup(scalingGroups.length);
  };

  // Remove a scaling group
  const removeScalingGroup = (index) => {
    const newGroups = scalingGroups.filter((_, idx) => idx !== index);
    setScalingGroups(newGroups);
    if (selectedGroup >= index) {
      setSelectedGroup(Math.max(0, selectedGroup - 1));
    }
  };

  // Update an item within a group
  const updateGroupItem = (groupIndex, itemIndex, updates) => {
    const newGroups = [...scalingGroups];
    const group = {...newGroups[groupIndex]};
    const items = [...group.items];
    items[itemIndex] = {...items[itemIndex], ...updates};
    
    // Calculate new scaled value if relevant properties changed
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
  };

  // Effect to notify parent of changes
  useEffect(() => {
    if (onScaledValuesChange) {
      const allScaledValues = scalingGroups.map(group => ({
        groupId: group.id,
        groupName: group.name,
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
  }, [scalingGroups]);

  return (
    <div className="w-full px-4 py-6">
      <Tab.Group selectedIndex={selectedGroup} onChange={setSelectedGroup}>
        <div className="flex items-center justify-between mb-4">
          <Tab.List className="flex space-x-2 overflow-x-auto">
            {scalingGroups.map((group, index) => (
              <Tab
                key={group.id}
                className={({ selected }) =>
                  `px-4 py-2 rounded-lg font-medium focus:outline-none ${
                    selected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`
                }
              >
                <div className="flex items-center space-x-2">
                  <span>{group.name}</span>
                  {scalingGroups.length > 1 && (
                    <TrashIcon
                      className="w-4 h-4 cursor-pointer text-gray-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeScalingGroup(index);
                      }}
                    />
                  )}
                </div>
              </Tab>
            ))}
          </Tab.List>
          
          <button
            onClick={addScalingGroup}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Scaling Group
          </button>
        </div>

        <Tab.Panels>
          {scalingGroups.map((group, groupIndex) => (
            <Tab.Panel key={group.id} className="space-y-4">
              <div className="mb-4">
                <input
                  type="text"
                  value={group.name}
                  onChange={(e) => {
                    const newGroups = [...scalingGroups];
                    newGroups[groupIndex].name = e.target.value;
                    setScalingGroups(newGroups);
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Group Name"
                />
              </div>

              {group.items.map((item, itemIndex) => (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg ${
                    item.enabled ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) =>
                        updateGroupItem(groupIndex, itemIndex, {
                          enabled: e.target.checked
                        })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {item.label}
                      </label>
                      <div className="mt-1 text-sm text-gray-500">
                        Base Value: {item.baseValue}
                      </div>
                    </div>

                    <select
                      value={item.operation}
                      onChange={(e) =>
                        updateGroupItem(groupIndex, itemIndex, {
                          operation: e.target.value
                        })
                      }
                      disabled={!item.enabled}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {operations.map(op => (
                        <option key={op.id} value={op.id}>
                          {op.label} ({op.symbol})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={item.scalingFactor}
                      onChange={(e) =>
                        updateGroupItem(groupIndex, itemIndex, {
                          scalingFactor: parseFloat(e.target.value) || 0
                        })
                      }
                      disabled={!item.enabled}
                      className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step="0.1"
                      placeholder="Factor"
                    />

                    <div className="min-w-[150px] text-right">
                      <div className="text-sm font-medium text-gray-900">
                        Scaled Value:{' '}
                        {item.enabled
                          ? calculateScaledValue(
                              item.baseValue,
                              item.operation,
                              item.scalingFactor
                            ).toFixed(2)
                          : 'Disabled'}
                      </div>
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
                    disabled={!item.enabled}
                    className="mt-2 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notes about this scaling..."
                  />
                </div>
              ))}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>

      {onSave && (
        <div className="mt-6">
          <button
            onClick={() => onSave(scalingGroups)}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save Scaling Configuration
          </button>
        </div>
      )}
    </div>
  );
};

export default ExtendedScaling;