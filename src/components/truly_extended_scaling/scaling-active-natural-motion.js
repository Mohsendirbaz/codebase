/**
 * Natural Motion Visualization - Self-Sufficient Version
 * This file is completely standalone and requires no external dependencies.
 * Simply include it in your HTML with a script tag to add the visualization.
 * 
 * Usage: <script src="standalone.js"></script>
 */

(function() {
  // ===== CONFIGURABLE MOTION PARAMETERS =====
  // These parameters control the visual effects and can be adjusted for experimentation
  
  // Base Item Parameters
  const ITEM_WIDTH = 100;               // Width of each item in pixels
  const ITEM_HEIGHT = 140;              // Height of each item in pixels
  const ITEM_SPACING = 20;              // Space between items in pixels
  const ITEM_BORDER_RADIUS = 12;        // Border radius of items in pixels
  
  // Motion Effect Parameters
  const ROTATION_ANGLE = 60;            // Rotation angle for non-focused items (degrees)
  const HOVER_SCALE = 1.2;              // Scale factor for hovered items
  const SELECTED_SCALE = 1.2;           // Scale factor for selected items
  const NON_SELECTED_SCALE = 0.9;       // Scale factor for items when another is selected
  const Z_TRANSLATION_ACTIVE = 100;     // Z-axis translation for active items (pixels)
  const PERSPECTIVE = 1200;             // 3D perspective value (pixels)
  
  // Animation Parameters
  const TRANSITION_DURATION = 0.5;      // Duration of transitions (seconds)
  const TRANSITION_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';  // Easing function
  
  // Shadow & Visual Effects
  const ACTIVE_SHADOW = '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 15px 5px rgba(59, 130, 246, 0.3)';
  const DEFAULT_SHADOW = '0 4px 10px rgba(0, 0, 0, 0.2)';
  const NON_SELECTED_OPACITY = 0.6;     // Opacity for non-selected items when one is selected
  
  // Z-Index Parameters
  const BASE_Z_INDEX = 10;              // Base z-index for all items
  const ACTIVE_Z_INDEX = 100;           // Z-index for active (hovered/selected) item
  
  // Container Parameters
  const CONTAINER_WIDTH = '100%';       // Width of the container
  const CONTAINER_MAX_WIDTH = '800px';  // Maximum width of the container
  const CONTAINER_PADDING = '20px';     // Padding around the container
  const CONTAINER_MARGIN = '20px auto'; // Margin around the container
  
  // ===== VISUALIZATION STATE =====
  let hoveredIndex = null;
  let selectedIndex = null;

  // Sample items
  const items = [
    { id: 1, title: 'Scaling Group 1', icon: '◈', color: '#4338ca' },
    { id: 2, title: 'Scaling Group 2', icon: '◆', color: '#4338ca' },
    { id: 3, title: 'Scaling Group 3', icon: '◇', color: '#4338ca' },
    { id: 4, title: 'Scaling Group 4', icon: '◯', color: '#4338ca' },
    { id: 5, title: 'Scaling Group 5', icon: '▢', color: '#4338ca' }
  ];

  // ===== UTILITY FUNCTIONS =====
  
  // Calculate horizontal positions for items
  function getPositions() {
    const visibleWidth = ITEM_WIDTH - ITEM_SPACING;
    const startX = -((items.length * visibleWidth) / 2) + ITEM_WIDTH / 2;
    
    return items.map((_, index) => {
      const x = startX + index * visibleWidth;
      return { x, y: 0 };
    });
  }

  // Get item transform and style based on interaction state
  function getItemStyle(position, index) {
    const activeIndex = hoveredIndex !== null ? hoveredIndex : selectedIndex;
    const isActive = index === activeIndex;
    const isAnyActive = activeIndex !== null;
    
    // Base position
    let translateX = position.x;
    let translateY = position.y;
    
    // Default z-translation (for consistent left-to-right overlap)
    let z = (items.length - index) * 2;
    
    // Rotation and scale
    let rotateZ = 0;
    let scale = 1;
    
    // Apply transformations when any item is active
    if (isAnyActive) {
      if (isActive) {
        // Active item gets extreme z-translation to ensure it's fully in front
        z = Z_TRANSLATION_ACTIVE;
        scale = hoveredIndex !== null ? HOVER_SCALE : SELECTED_SCALE;
      } else {
        // Non-active items rotate
        rotateZ = ROTATION_ANGLE;
        
        if (selectedIndex !== null) {
          scale = NON_SELECTED_SCALE;
        }
      }
    }
    
    return {
      transform: `translate3d(${translateX}px, ${translateY}px, ${z}px) rotateZ(${rotateZ}deg) scale(${scale})`,
      opacity: (selectedIndex !== null && !isActive) ? NON_SELECTED_OPACITY : 1,
      boxShadow: isActive ? ACTIVE_SHADOW : DEFAULT_SHADOW,
      zIndex: isActive ? ACTIVE_Z_INDEX : BASE_Z_INDEX + (items.length - index)
    };
  }

  // Apply styles to an element
  function applyStyles(element, styles) {
    Object.keys(styles).forEach(property => {
      element.style[property] = styles[property];
    });
  }

  // Create an item element
  function createItemElement(item, position, index) {
    const itemElement = document.createElement('div');
    
    // Basic styles
    applyStyles(itemElement, {
      position: 'absolute',
      width: `${ITEM_WIDTH}px`,
      height: `${ITEM_HEIGHT}px`,
      borderRadius: `${ITEM_BORDER_RADIUS}px`,
      background: `linear-gradient(135deg, ${item.color}, rgba(30, 64, 175, 0.9))`,
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transformStyle: 'preserve-3d',
      transformOrigin: 'center center',
      transition: `transform ${TRANSITION_DURATION}s ${TRANSITION_EASING}, 
                   opacity ${TRANSITION_DURATION}s ease, 
                   box-shadow ${TRANSITION_DURATION}s ease`,
      cursor: 'pointer'
    });
    
    // Apply dynamic styles based on state
    applyStyles(itemElement, getItemStyle(position, index));
    
    // Create icon
    const iconElement = document.createElement('div');
    applyStyles(iconElement, {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '8px'
    });
    iconElement.textContent = item.icon;
    
    // Create title
    const titleElement = document.createElement('div');
    applyStyles(titleElement, {
      fontSize: '0.875rem',
      textAlign: 'center',
      padding: '0 0.5rem'
    });
    titleElement.textContent = item.title;
    
    // Add edge highlight
    const highlightElement = document.createElement('div');
    applyStyles(highlightElement, {
      position: 'absolute',
      inset: '0',
      borderRadius: '12px',
      pointerEvents: 'none',
      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.3), inset 1px 0 1px rgba(255, 255, 255, 0.3)'
    });
    
    // Add event listeners
    itemElement.addEventListener('mouseenter', () => {
      hoveredIndex = index;
      updateAllItems();
    });
    
    itemElement.addEventListener('mouseleave', () => {
      hoveredIndex = null;
      updateAllItems();
    });
    
    itemElement.addEventListener('click', () => {
      selectedIndex = selectedIndex === index ? null : index;
      updateAllItems();
    });
    
    // Append children
    itemElement.appendChild(iconElement);
    itemElement.appendChild(titleElement);
    itemElement.appendChild(highlightElement);
    
    return itemElement;
  }

  // Update styles for all items
  function updateAllItems() {
    const itemElements = document.querySelectorAll('.natural-motion-item');
    const positions = getPositions();
    
    itemElements.forEach((element, index) => {
      applyStyles(element, getItemStyle(positions[index], index));
    });
  }

  // Create and initialize the visualization
  function createVisualization() {
    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.id = 'natural-motion-container';
    applyStyles(mainContainer, {
      width: CONTAINER_WIDTH,
      maxWidth: CONTAINER_MAX_WIDTH,
      padding: CONTAINER_PADDING,
      margin: CONTAINER_MARGIN,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    });
    
    // Create title
    const titleElement = document.createElement('h2');
    titleElement.textContent = 'Natural Motion Visualization';
    applyStyles(titleElement, {
      textAlign: 'center',
      margin: '0 0 20px 0',
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#1e3a8a'
    });
    
    // Create visualization area
    const visualizationArea = document.createElement('div');
    applyStyles(visualizationArea, {
      position: 'relative',
      width: '100%',
      height: '256px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '32px',
      perspective: `${PERSPECTIVE}px`
    });
    
    // Add items
    const positions = getPositions();
    items.forEach((item, index) => {
      const itemElement = createItemElement(item, positions[index], index);
      itemElement.classList.add('natural-motion-item');
      visualizationArea.appendChild(itemElement);
    });
    
    // Create instructions
    const instructionsBox = document.createElement('div');
    applyStyles(instructionsBox, {
      textAlign: 'center',
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      maxWidth: '600px',
      margin: '0 auto'
    });
    
    const instructionsTitle = document.createElement('h3');
    instructionsTitle.textContent = 'Self-Sufficient Natural Motion';
    applyStyles(instructionsTitle, {
      fontSize: '1.125rem',
      fontWeight: '600',
      marginBottom: '8px',
      marginTop: '0'
    });
    
    const instructionsText1 = document.createElement('p');
    instructionsText1.textContent = `Hover over an item to see it come completely to the front with natural ${ROTATION_ANGLE}-degree rotation for other items.`;
    applyStyles(instructionsText1, {
      marginBottom: '8px'
    });
    
    const instructionsText2 = document.createElement('p');
    instructionsText2.textContent = 'This is a completely self-sufficient JavaScript implementation that adds itself to the page.';
    applyStyles(instructionsText2, {
      fontSize: '0.875rem',
      color: '#4b5563',
      marginBottom: '0'
    });
    
    // Append elements to container
    instructionsBox.appendChild(instructionsTitle);
    instructionsBox.appendChild(instructionsText1);
    instructionsBox.appendChild(instructionsText2);
    
    mainContainer.appendChild(titleElement);
    mainContainer.appendChild(visualizationArea);
    mainContainer.appendChild(instructionsBox);
    
    // Add the container to the document body
    document.body.appendChild(mainContainer);
  }

  // Initialize when DOM is loaded
  function initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createVisualization);
    } else {
      createVisualization();
    }
  }
  
  // Self-initialize
  initialize();
})();
