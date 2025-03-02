import React, { useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import './styles/scaling.css';

/**
 * MotionDraggableItem component
 * Provides drag-and-drop functionality with fluid animations
 * 
 * @param {string} id - Unique identifier for the item
 * @param {function} onDragStart - Callback when dragging begins
 * @param {function} onDragEnd - Callback when dragging ends
 * @param {boolean} isDragging - Whether the item is currently being dragged
 * @param {object} variants - Motion variants for animations
 * @param {object} dragConstraints - Constraints for dragging (top, right, bottom, left)
 * @param {string} whileDrag - Variant to apply while dragging
 * @param {children} children - Child elements to render within the draggable item
 * @param {object} props - Additional props to pass to the motion.div
 */
const MotionDraggableItem = ({
  id,
  onDragStart,
  onDragEnd,
  isDragging,
  variants,
  dragConstraints,
  whileDrag = "dragging",
  className = '',
  children,
  ...props
}) => {
  // Reference to the draggable element
  const itemRef = useRef(null);
  
  // Set up drag controls for programmatic dragging
  const dragControls = useDragControls();
  
  // Handler to start dragging from a specific point
  const startDrag = (event) => {
    dragControls.start(event);
    if (onDragStart) onDragStart(id, event);
  };
  
  // Handler for drag end events
  const handleDragEnd = (event, info) => {
    if (onDragEnd) onDragEnd(id, info, event);
  };

  return (
    <motion.div
      ref={itemRef}
      className={`draggable-item ${isDragging ? 'dragging' : ''} ${className}`}
      drag="y"
      dragControls={dragControls}
      dragConstraints={dragConstraints}
      onDragStart={onDragStart ? () => onDragStart(id) : undefined}
      onDragEnd={handleDragEnd}
      dragElastic={0.3}
      dragMomentum={true}
      variants={variants}
      whileDrag={whileDrag}
      layout
      {...props}
    >
      <div 
        className="drag-handle"
        onPointerDown={startDrag}
      >
        <span className="drag-indicator">⋮⋮</span>
      </div>
      <div className="draggable-content">
        {children}
      </div>
    </motion.div>
  );
};

export default MotionDraggableItem;
