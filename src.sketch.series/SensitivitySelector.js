import React, { useState } from 'react';

// Simple Dialog Component
const Dialog = ({ show, onClose, children }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const SensitivityAnalysisSelector = ({ sKey = '', onSensitivityChange = () => {} }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [sensitivityState, setSensitivityState] = useState(() => ({
    parameters: Array(52).fill().map(() => ({
      multiplePoints: Array(6).fill(''),
      symmetricalValue: '',
      selectedMode: null
    }))
  }));

  const getParameterIndex = (key) => {
    if (!key || typeof key !== 'string') return 0;
    const match = key.match(/S(\d+)/);
    if (!match) return 0;
    const num = parseInt(match[1], 10);
    return num >= 10 && num <= 61 ? num - 10 : 0;
  };

  const handleMultiplePointChange = (paramIndex, slotIndex, value) => {
    setSensitivityState(prev => {
      const newParameters = [...prev.parameters];
      const parameter = { ...newParameters[paramIndex] };
      const newMultiplePoints = [...parameter.multiplePoints];
      newMultiplePoints[slotIndex] = value;

      const numbers = newMultiplePoints
        .filter(p => p !== '')
        .map(Number)
        .filter(n => !isNaN(n));

      if (numbers.length > 1 && !numbers.every((n, i) => i === 0 || n > numbers[i - 1])) {
        alert('Values must be in ascending order');
        return prev;
      }

      parameter.multiplePoints = newMultiplePoints;
      parameter.selectedMode = 'multiple';
      parameter.symmetricalValue = '';
      newParameters[paramIndex] = parameter;

      onSensitivityChange(sKey, {
        mode: 'multiple',
        values: newMultiplePoints.filter(v => v !== '')
      });

      return { ...prev, parameters: newParameters };
    });
  };

  const handleSymmetricalChange = (value) => {
    const paramIndex = getParameterIndex(sKey);
    setSensitivityState(prev => {
      const newParameters = [...prev.parameters];
      const parameter = { ...newParameters[paramIndex] };
      
      parameter.symmetricalValue = value;
      parameter.selectedMode = 'symmetrical';
      parameter.multiplePoints = Array(6).fill('');
      newParameters[paramIndex] = parameter;

      if (!isNaN(parseFloat(value))) {
        onSensitivityChange(sKey, {
          mode: 'symmetrical',
          value: parseFloat(value)
        });
      }

      return { ...prev, parameters: newParameters };
    });
  };

  const handleModeToggle = (mode) => {
    const paramIndex = getParameterIndex(sKey);
    setSensitivityState(prev => {
      const newParameters = [...prev.parameters];
      const parameter = { ...newParameters[paramIndex] };

      if (mode === parameter.selectedMode) {
        parameter.selectedMode = null;
        parameter.symmetricalValue = '';
        parameter.multiplePoints = Array(6).fill('');
        onSensitivityChange(sKey, { mode: null, values: [] });
      } else {
        parameter.selectedMode = mode;
        if (mode === 'symmetrical') {
          parameter.multiplePoints = Array(6).fill('');
        } else {
          parameter.symmetricalValue = '';
        }
      }

      newParameters[paramIndex] = parameter;
      return { ...prev, parameters: newParameters };
    });
  };

  const handleReset = () => {
    const paramIndex = getParameterIndex(sKey);
    setSensitivityState(prev => {
      const newParameters = [...prev.parameters];
      newParameters[paramIndex] = {
        multiplePoints: Array(6).fill(''),
        symmetricalValue: '',
        selectedMode: null
      };
      return { ...prev, parameters: newParameters };
    });
    onSensitivityChange(sKey, { mode: null, values: [] });
    setShowDialog(false);
  };

  const paramIndex = getParameterIndex(sKey);
  const currentParameter = sensitivityState.parameters[paramIndex];

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
      >
        Sensitivity
      </button>

      <Dialog
        show={showDialog}
        onClose={() => setShowDialog(false)}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Sensitivity Analysis Configuration - {sKey}
            </h2>
            <button
              onClick={() => setShowDialog(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close dialog"
            >
              <svg 
                className="w-5 h-5 text-gray-500" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            User selection of single or multiple points for sensitivity analysis will be calculated by departure from the whole financial case submitted, meaning in addition to the form values as baseline, efficacy settings will also be factored in.
          </p>

          <div className="space-y-4">
            <div 
              className={`border p-3 rounded cursor-pointer transition-colors ${
                currentParameter.selectedMode === 'symmetrical' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleModeToggle('symmetrical')}
            >
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={currentParameter.selectedMode === 'symmetrical'}
                  onChange={(e) => e.stopPropagation()}
                  className="h-4 w-4 cursor-pointer"
                />
                <label className="cursor-pointer select-none">Symmetrical (±n%)</label>
              </div>
              {currentParameter.selectedMode === 'symmetrical' && (
                <input
                  type="number"
                  value={currentParameter.symmetricalValue}
                  onChange={(e) => handleSymmetricalChange(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Enter percentage"
                  className="w-full p-3 border rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
                  style={{ minWidth: '120px' }}
                />
              )}
            </div>

            <div 
              className={`border p-3 rounded cursor-pointer transition-colors ${
                currentParameter.selectedMode === 'multiple' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleModeToggle('multiple')}
            >
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={currentParameter.selectedMode === 'multiple'}
                  onChange={(e) => e.stopPropagation()}
                  className="h-4 w-4 cursor-pointer"
                />
                <label className="cursor-pointer select-none">Multiple Points (must be ascending)</label>
              </div>
              {currentParameter.selectedMode === 'multiple' && (
                <div className="grid grid-cols-3 gap-2" onClick={(e) => e.stopPropagation()}>
                  {Array(6).fill(null).map((_, index) => (
                    <input
                      key={index}
                      type="number"
                      value={currentParameter.multiplePoints[index]}
                      onChange={(e) => handleMultiplePointChange(paramIndex, index, e.target.value)}
                      placeholder={index < 3 ? `-n${index + 1}` : `+n${index - 2}`}
                      className="w-full p-3 border rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
                      style={{ minWidth: '120px' }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center border-t pt-4">
            <div className="flex gap-2">
              {currentParameter.selectedMode && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Save functionality will be added later
                  setShowDialog(false);
                }}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default SensitivityAnalysisSelector;