import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../../hooks/ui/card';
import {
  SummaryItem,
  TabConfig,
  SequentialOperation,
  getDisplaySymbol,
  MathProcessor,
  ScalingOperation
} from '../../utils/math-processor';

interface ScalingSummaryProps {
  items: SummaryItem[];
  tabConfigs: Array<TabConfig>;
  sequentialOperations: SequentialOperation[];
  onSequentialOperationChange: (index: number, operation: SequentialOperation) => void;
  onTabConfigsChange: (newConfigs: Array<TabConfig>) => void;
  onItemFreeze?: (itemId: string, isFrozen: boolean) => void;
  onExpressionChange?: (itemId: string, expression: string) => void;
}

const AVAILABLE_OPERATIONS = [
  'multiply', 'divide', 'add', 'subtract', 'pass',
  'openParen', 'closeParen'
];

const getOperationSymbol = (operation: string) => {
  switch (operation) {
    case 'multiply': return '×';
    case 'divide': return '÷';
    case 'add': return '+';
    case 'subtract': return '-';
    case 'pass': return '→';
    case 'openParen': return '(';
    case 'closeParen': return ')';
    default: return '×';
  }
};

interface ParenthesisGroup {
  openIndex: number;
  closeIndex: number;
}

interface ItemExpression {
  expression: string;
  latex: string;
}

const ScalingSummary: React.FC<ScalingSummaryProps> = ({
  items,
  tabConfigs,
  sequentialOperations,
  onSequentialOperationChange,
  onTabConfigsChange,
  onItemFreeze,
  onExpressionChange
}) => {
  const [mathProcessor] = useState(() => new MathProcessor());
  const [itemExpressions, setItemExpressions] = useState<Record<string, string>>({});
  const [frozenItems, setFrozenItems] = useState<Record<string, boolean>>({});
  const [scalingConfig] = useState({ factor: 1 });

  // Combine standard table operations with mathematical expressions
  const handleExpressionChange = (itemId: string, expression: string) => {
    setItemExpressions(prev => ({
      ...prev,
      [itemId]: expression
    }));
    
    // Try to evaluate the expression using current values
    try {
      const values = {
        original: items.find(i => i.id === itemId)?.originalValue || 0,
        ...items.find(i => i.id === itemId)?.scaledValues
      };
      const result = mathProcessor.evaluateExpression(expression, values);
      
      if (!result.error) {
        onSequentialOperationChange(items.length - 1, {
          type: 'expression',
          value: expression
        });
        onExpressionChange?.(itemId, expression);
      }
    } catch (error) {
      console.error('Expression evaluation failed:', error);
    }
  };

  // Update the comparison operators to use type property
  const canCloseParenthesis = (index: number): boolean => {
    const prevOps = sequentialOperations.slice(0, index);
    const openCount = prevOps.filter(op => op.type === 'openParen').length;
    const closeCount = prevOps.filter(op => op.type === 'closeParen').length;
    return openCount > closeCount;
  };

  const handleOperationChange = (index: number, operation: string) => {
    let newConfigs = [...tabConfigs];
    let newOperations = [...sequentialOperations];

    if (operation === 'openParen') {
      newConfigs.splice(index, 0, {
        id: `paren_open_${Date.now()}`,
        label: '(',
        isParenthesis: true
      } as TabConfig);
      newOperations.splice(index, 0, { type: 'multiply', value: 1 });
      onTabConfigsChange(newConfigs);
    } else if (operation === 'closeParen') {
      // Find matching open parenthesis
      let openParenCount = 0;
      for (let i = index - 1; i >= 0; i--) {
        if (newConfigs[i].label === '(') openParenCount++;
        if (newConfigs[i].label === ')') openParenCount--;
      }

      if (openParenCount > 0) {
        // Insert closing parenthesis column
        newConfigs.splice(index + 1, 0, {
          id: `paren_close_${Date.now()}`,
          label: ')',
          isParenthesis: true
        });
        newOperations.splice(index, 0, { type: operation as ScalingOperation, value: 1 });
        onTabConfigsChange(newConfigs);
      }
    }
    
    onSequentialOperationChange(index, {
      type: operation as ScalingOperation,
      value: scalingConfig.factor
    });
  };

  // Update forEach comparison
  const getParenthesisGroups = (): ParenthesisGroup[] => {
    const groups: ParenthesisGroup[] = [];
    const stack: number[] = [];

    sequentialOperations.forEach((op, index) => {
      if (op.type === 'openParen') {
        stack.push(index);
      } else if (op.type === 'closeParen' && stack.length > 0) {
        const openIndex = stack.pop()!;
        groups.push({ openIndex, closeIndex: index });
      }
    });

    return groups;
  };

  const getColumnStyle = (index: number) => {
    const groups = getParenthesisGroups();
    const isInParenthesis = groups.some(
      group => index > group.openIndex && index <= group.closeIndex
    );

    return {
      backgroundColor: isInParenthesis ? 'rgba(59, 130, 246, 0.05)' : undefined,
      position: 'relative' as const
    };
  };

  const getAvailableOperations = (index: number) => {
    // If we can't close a parenthesis, filter it out from options
    if (!canCloseParenthesis(index)) {
      return AVAILABLE_OPERATIONS.filter(op => op !== 'closeParen');
    }
    return AVAILABLE_OPERATIONS;
  };

  const handleFreezeToggle = (itemId: string) => {
    setFrozenItems(prev => {
      const newState = { ...prev, [itemId]: !prev[itemId] };
      onItemFreeze?.(itemId, newState[itemId]);
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
                    <th className="text-right py-2 px-4">
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
                            {getDisplaySymbol(op)}
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
              {items.map(item => (
                <tr key={item.id} 
                    className={`border-b ${item.isFrozen ? 'bg-gray-50' : ''}`}>
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
                    {item.originalValue.toFixed(2)}
                  </td>
                  {tabConfigs.map((tab, index) => (
                    <React.Fragment key={tab.id}>
                      <td className="text-right py-2 px-4">
                        {(item.scaledValues[tab.id] || item.originalValue).toFixed(2)}
                        {item.isFrozen && (
                          <span className="text-xs text-blue-500 ml-1">*</span>
                        )}
                      </td>
                      <td className="text-center py-2 px-2 text-gray-500">
                        {getDisplaySymbol(sequentialOperations[index]?.type || 'multiply')}
                      </td>
                    </React.Fragment>
                  ))}
                  <td className="py-2 px-4">
                    <input
                      type="text"
                      className="w-full px-2 py-1 border rounded"
                      placeholder="Enter formula"
                      value={itemExpressions[item.id] || ''}
                      onChange={(e) => handleExpressionChange(item.id, e.target.value)}
                    />
                  </td>
                  <td className="text-right py-2 px-4 bg-gray-50 font-medium">
                    {item.calculationError ? (
                      <div className="text-red-500">
                        <span>{item.sequentialResult.toFixed(2)}</span>
                        <span className="text-xs block">{item.suggestion}</span>
                      </div>
                    ) : (
                      item.sequentialResult.toFixed(2)
                    )}
                  </td>
                </tr>
              ))}
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
