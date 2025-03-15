import React, { useState } from 'react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "./ui/tooltip";
import { 
  BuildingIcon,
  InfoIcon, 
  MinusIcon,
  PlusIcon,
  ChevronDownIcon
} from 'lucide-react';

const TooltipWithMore = ({ initialContent, extendedContent }) => {
  const [showMore, setShowMore] = useState(false);
  
  return (
    <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg max-w-xs">
      <p className="text-sm mb-2">{initialContent}</p>
      {!showMore && (
        <button
          onClick={() => setShowMore(true)}
          className="text-xs text-blue-300 hover:text-blue-200 underline mt-1 flex items-center gap-1"
        >
          Need more information?
          <ChevronDownIcon className="w-3 h-3" />
        </button>
      )}
      {showMore && (
        <div className="border-t border-gray-600 pt-2 mt-2 text-sm">
          {extendedContent}
        </div>
      )}
    </div>
  );
};

const FormHeader = ({ 
  value = '',
  label = '',
  remarks = '',
  step = '',
  parameterKey = '',
  onValueChange,
  onRemarksChange,
  onEfficacyPeriodClick,
  onSubmitParameter,
  onIncrement,
  onDecrement,
  onStepChange,
  onSensitivityClick,
  onFactualPrecedenceClick
}) => {
  const headerStyle = {
    backgroundColor: '#eef2ff',
    borderLeft: '6px solid #6366f1',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    position: 'relative'
  };

  return (
    <TooltipProvider>
      <div className="form-item-container" style={headerStyle}>
        <div className="main-input-section">
          <div className="label-container">
            <BuildingIcon className="input-icon text-indigo-600" />
            <div className="label-text">
              <span className="font-semibold text-indigo-900">{label}</span>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="w-4 h-4 text-indigo-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <TooltipWithMore
                    initialContent="Configure this parameter for your financial analysis"
                    extendedContent={
                      <div className="space-y-2">
                        <p>This parameter affects:</p>
                        <ul className="list-disc pl-4">
                          <li>Overall cost calculations</li>
                          <li>Financial viability metrics</li>
                          <li>Sensitivity analysis scenarios</li>
                        </ul>
                      </div>
                    }
                  />
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="input-controls-section">
            <div className="value-container">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <button onClick={onDecrement} className="control-button1">
                      <MinusIcon className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => onValueChange(e.target.value)}
                      className="value-input"
                    />
                    <button onClick={onIncrement} className="control-button2">
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <TooltipWithMore
                    initialContent="Adjust the parameter value"
                    extendedContent="Use the +/- buttons or directly enter a value. Changes will affect your financial calculations."
                  />
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="step-container">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={step}
                      onChange={(e) => onStepChange(e.target.value)}
                      placeholder="Step Value"
                      className="step-input"
                    />
                    <span className="s-label font-medium text-indigo-900">{parameterKey}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <TooltipWithMore
                    initialContent="Set increment/decrement step size"
                    extendedContent="This value determines how much the parameter changes when using the +/- buttons."
                  />
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="remarks-container">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => onRemarksChange(e.target.value)}
                      placeholder="Add remarks"
                      className="remarks-input remarks-important"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <TooltipWithMore
                    initialContent="Add notes for this parameter"
                    extendedContent="Remarks will be displayed in reports and help document your configuration decisions."
                  />
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="action-buttons">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onEfficacyPeriodClick}
                    className="action-button primary"
                  >
                    Specify Efficacy Period
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <TooltipWithMore
                    initialContent="Set when this parameter takes effect"
                    extendedContent="Define specific timeframes and conditions for parameter activation within your analysis."
                  />
                </TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onSensitivityClick}
                  className="action-button primary"
                >
                  Sensitivity
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <TooltipWithMore
                  initialContent="Configure sensitivity analysis"
                  extendedContent="Analyze how changes in this parameter affect your overall financial outcomes."
                />
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onFactualPrecedenceClick}
                  className="action-button factual"
                >
                  Find Factual Precedence
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <TooltipWithMore
                  initialContent="Search historical configurations"
                  extendedContent="Find and analyze similar parameter settings from previous analyses."
                />
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default FormHeader;