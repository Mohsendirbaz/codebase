import React, { useState } from 'react';

export const TooltipProvider = ({ children }) => {
  return <>{children}</>;
};

export const TooltipTrigger = ({ children, asChild }) => {
  return asChild ? children : <span>{children}</span>;
};

export const TooltipContent = ({ children }) => {
  return <div className="tooltip-content">{children}</div>;
};

export const Tooltip = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="tooltip-wrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {React.Children.map(children, child => {
        if (child.type === TooltipTrigger) {
          return child;
        }
        if (child.type === TooltipContent) {
          return isVisible ? child : null;
        }
        return child;
      })}
    </div>
  );
};
