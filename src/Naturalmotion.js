import React, { useState, useEffect } from 'react';
import './styles/HomePage.CSS/Consolidated.css';
const SpatialTransformComponent = () => {
  const [interactionState, setInteractionState] = useState({
    isActive: false,
    offsetY: 0,
    rotationAngle: 0,
    scale: 1,
  });

  useEffect(() => {
    const createDynamicStyles = () => {
      const styleElement = document.createElement('style');
      styleElement.textContent = `


        .spatial-element {
          transition: all 0.5s cubic-bezier(0.42, 0, 0.28, 0.99);
        }
      `;
      document.head.appendChild(styleElement);
      return () => document.head.removeChild(styleElement);
    };

    const cleanupStyles = createDynamicStyles();
    return cleanupStyles;
  }, []);

  const handleInteractionStart = () => {
    setInteractionState({
      isActive: true,
      offsetY: 0,
      rotationAngle: 60,
      scale: 1,
    });
  };

  const handleInteractionEnd = () => {
    setInteractionState({
      isActive: false,
      offsetY: 0,
      rotationAngle: 0,
      scale: 1,
    });
  };

  return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center p-8">
        <div
            className="spatial-container w-96 h-64 relative"
            onMouseEnter={handleInteractionStart}
            onMouseLeave={handleInteractionEnd}
        >
          <div
              className="spatial-element absolute inset-0 rounded-xl"
              style={{
                transform: `translate3d(0, ${interactionState.offsetY}px, 0) rotateY(${-interactionState.rotationAngle}deg) scale(${interactionState.scale})`,
                background:
                    'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                opacity: interactionState.isActive ? 0.8 : 1,
              }}
          >
            <div className="flex items-center justify-center h-full text-white text-2xl font-bold">
              Spatial Dynamics
            </div>
          </div>
        </div>
      </div>
  );
};

export default SpatialTransformComponent;
