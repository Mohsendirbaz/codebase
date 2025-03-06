import React from 'react';

export const Card = ({ children, className = '', ...props }) => (
  <div 
    className={`
      bg-white dark:bg-gray-800 
      shadow-lg hover:shadow-xl
      rounded-xl
      transition-all duration-300 ease-in-out
      border border-gray-100 dark:border-gray-700
      ${className}
    `} 
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '', ...props }) => (
  <div 
    className={`
      px-6 py-4
      border-b border-gray-100 dark:border-gray-700
      bg-gray-50 dark:bg-gray-900
      rounded-t-xl
      transition-colors duration-300
      ${className}
    `} 
    {...props}
  >
    {children}
  </div>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div 
    className={`
      p-6
      transition-all duration-300
      ${className}
    `} 
    {...props}
  >
    {children}
  </div>
);

export default Card;
