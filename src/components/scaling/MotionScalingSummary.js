import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/scaling.css';

/**
 * MotionScalingSummary component
 * Enhances the core ScalingSummary component with motion-based transitions
 * 
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of items to display in the summary
 * @param {Object} props.tabConfigs - Configuration options for the summary display
 * @param {Array} props.sequentialOperations - List of operations to apply to items
 * @param {Function} props.onSequentialOperationChange - Callback when operations change
 * @param {Function} props.onTabConfigsChange - Callback when tab configs change
 * @param {Function} props.onItemFreeze - Callback when an item is frozen/unfrozen
 * @param {Function} props.onExpressionChange - Callback when expression changes
 * @param {Object} props.frozenItems - Map of frozen item states
 */
const MotionScalingSummary = ({
  items = [],
  tabConfigs = {},
  sequentialOperations = [],
  onSequentialOperationChange,
  onTabConfigsChange,
  onItemFreeze,
  onExpressionChange,
  frozenItems = {},
  className = ''
}) => {
  // Define animation variants for different elements
  const variants = {
    row: {
      initial: { opacity: 0, y: 20 },
      animate: { 
        opacity: 1, 
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 20
        }
      },
      exit: { 
        opacity: 0, 
        y: -20,
        transition: { duration: 0.2 }
      }
    },
    cell: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { 
        opacity: 1, 
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 500,
          damping: 25
        }
      },
      exit: { 
        opacity: 0, 
        scale: 0.8,
        transition: { duration: 0.15 }
      }
    }
  };

  return (
    <div className={`scaling-summary ${className}`}>
      <AnimatePresence>
        <table className="summary-table">
          <thead>
            <motion.tr
              initial="initial"
              animate="animate"
              exit="exit"
              variants={variants.row}
            >
              <th>Item</th>
              <th>Base Value</th>
              <th>Operations</th>
              <th>Final Value</th>
              <th>Actions</th>
            </motion.tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {items.map((item) => (
                <motion.tr
                  key={item.id}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={variants.row}
                  layout
                >
                  <td>
                    <motion.span variants={variants.cell}>
                      {item.name}
                    </motion.span>
                  </td>
                  <td>
                    <motion.span variants={variants.cell}>
                      {item.baseValue.toFixed(tabConfigs.precision || 2)}
                    </motion.span>
                  </td>
                  <td>
                    <motion.div 
                      className="operations-list"
                      variants={variants.cell}
                    >
                      {sequentialOperations.map((op, index) => (
                        <span key={op.id} className="operation">
                          {index > 0 && ' → '}
                          {op.type} ({op.value})
                        </span>
                      ))}
                    </motion.div>
                  </td>
                  <td>
                    <motion.span 
                      variants={variants.cell}
                      className={`value-change ${item.changed ? 'highlight' : ''}`}
                    >
                      {item.scaledValue?.toFixed(tabConfigs.precision || 2)}
                    </motion.span>
                  </td>
                  <td>
                    <motion.div 
                      className="actions"
                      variants={variants.cell}
                    >
                      <label className="freeze-control">
                        <input
                          type="checkbox"
                          checked={frozenItems[item.id] || false}
                          onChange={(e) => onItemFreeze?.(item.id, e.target.checked)}
                        />
                        Freeze
                      </label>
                    </motion.div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </AnimatePresence>
    </div>
  );
};

export default MotionScalingSummary;
