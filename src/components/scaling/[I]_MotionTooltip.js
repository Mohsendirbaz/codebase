import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/scaling.css';

/**
 * MotionTooltip component
 * Provides animated tooltips for showing additional information with flair
 * 
 * @param {ReactNode} children - The element that triggers the tooltip
 * @param {string|ReactNode} content - Content to display in the tooltip
 * @param {string} position - Position of tooltip (top, right, bottom, left)
 * @param {number} delay - Delay before showing tooltip in milliseconds
 * @param {object} variants - Custom animation variants
 * @param {object} props - Additional props
 */
const MotionTooltip = ({
  children,
  content,
  position = 'top',
  delay = 300,
  variants,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  // Default animation variants
  const defaultVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0,
      x: position === 'left' ? 10 : position === 'right' ? -10 : 0
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    }
  };

  // Combine default variants with custom variants
  const tooltipVariants = variants || defaultVariants;

  // Show tooltip after delay
  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  // Hide tooltip and clear timeout
  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  return (
    <div 
      className={`tooltip-container ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      {...props}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="tooltip"
            data-position={position}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={tooltipVariants}
          >
            {typeof content === 'string' ? (
              content
            ) : (
              <div className="tooltip-content">
                {content}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MotionTooltip;
