import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../../hooks/ui/card';
import { ScalingOperation } from '../../utils/math-processor';

interface ScalingControlProps {
  id: string;
  label: string;
  originalValue: number;
  scaledValue: number;
  onScaleItem: (id: string, operation: ScalingOperation, factor: number) => void;
  onResetItem: (id: string) => void;
}

const ScalingControl: React.FC<ScalingControlProps> = ({
  id,
  label,
  originalValue,
  scaledValue,
  onScaleItem,
  onResetItem
}) => {
  const [operation, setOperation] = useState<ScalingOperation>('multiply');
  const [factor, setFactor] = useState<number>(1);
  const [error, setError] = useState<string>('');

  const handleApply = () => {
    setError('');
    
    if (operation === 'divide' && factor === 0) {
      setError('Division by zero is not allowed');
      return;
    }
    
    if (operation === 'log' && (factor <= 0 || originalValue <= 0)) {
      setError('Invalid logarithm input');
      return;
    }
    
    onScaleItem(id, operation, factor);
  };

  const handleReset = () => {
    setOperation('multiply');
    setFactor(1);
    onResetItem(id);
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <h4 className="text-sm font-medium">{label}</h4>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value as ScalingOperation)}
            className="scaling-select"
          >
            <option value="multiply">Multiply</option>
            <option value="divide">Divide</option>
            <option value="power">Power</option>
            <option value="add">Add</option>
            <option value="subtract">Subtract</option>
            <option value="log">Log</option>
            <option value="pass">Pass</option>
          </select>
          <input
            type="number"
            value={factor}
            onChange={(e) => setFactor(Number(e.target.value))}
            className="scaling-factor"
            step="0.1"
          />
        </div>
        <div className="flex justify-between text-sm">
          <span>Original: {originalValue.toFixed(2)}</span>
          <span>Scaled: {scaledValue.toFixed(2)}</span>
        </div>
        {error && (
          <div className="error-message mt-2">
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <button onClick={handleReset} className="reset-button">
          Reset
        </button>
        <button onClick={handleApply} className="apply-button">
          Apply
        </button>
      </CardFooter>
    </Card>
  );
};

export default ScalingControl;
