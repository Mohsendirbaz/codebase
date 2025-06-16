import React, { useState } from 'react';

const CenteredPerspectiveDemo = () => {
  const tiles = [
    { id: '1', title: 'Quartz White', icon: '◈', color: '#4338ca' },
    { id: '2', title: 'Granite Black', icon: '◆', color: '#4338ca' },
    { id: '3', title: 'Marble Grey', icon: '◇', color: '#4338ca' },
    { id: '4', title: 'Terrazzo Mix', icon: '◯', color: '#4338ca' },
    { id: '5', title: 'Slate Blue', icon: '▢', color: '#4338ca' }
  ];
  
  const [selectedIndex, setSelectedIndex] = useState(null);
  
  // Rotation states - all tiles share exact same angle at all times
  const [rotationAngle, setRotationAngle] = useState(-60);
  
  // Handle tile selection
  const handleTileClick = (index) => {
    if (selectedIndex === index) {
      setSelectedIndex(null);
      setRotationAngle(-60); // Return to initial rotation
    } else {
      setSelectedIndex(index);
      setRotationAngle(-30); // Half rotation for all tiles
    }
  };
  
  // Calculate positions with wide spacing
  const getTilePositions = () => {
    const tileWidth = 100;
    const spacing = 80;
    const visibleWidth = tileWidth + spacing;
    const totalWidth = tiles.length * visibleWidth;
    
    return tiles.map((_, index) => {
      const x = (index * visibleWidth) - (totalWidth / 2) + (visibleWidth / 2);
      return { x };
    });
  };
  
  const positions = getTilePositions();
  
  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative h-80 w-full">
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ 
            perspective: '1200px',
            perspectiveOrigin: '50% 50%' // Ensure centered perspective
          }}
        >
          {tiles.map((tile, index) => {
            const position = positions[index];
            const isSelected = selectedIndex === index;
            
            // All tiles have IDENTICAL angle at all times
            let zDepth = isSelected ? 50 : -30;
            let scale = isSelected ? 1.25 : 1;
            let opacity = isSelected ? 1 : 0.8;
            
            // When not selected but another tile is
            if (!isSelected && selectedIndex !== null) {
              zDepth = -50;
              opacity = 0.6;
              scale = 0.9;
            }
            
            return (
              <div
                key={tile.id}
                style={{
                  position: 'absolute',
                  width: '100px',
                  height: '140px',
                  left: '50%',
                  top: '50%',
                  marginLeft: position.x,
                  marginTop: '-70px',
                  background: `linear-gradient(135deg, ${tile.color}, rgba(30, 64, 175, 0.9))`,
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: isSelected 
                    ? '0 0 35px 10px rgba(59, 130, 246, 0.6)'
                    : '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                  transformOrigin: 'center center', // Center the transform origin
                  transform: `translate3d(0, 0, ${zDepth}px) rotateY(${rotationAngle}deg) scale(${scale})`,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  zIndex: isSelected ? 30 : 10,
                  opacity,
                  transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                  cursor: 'pointer'
                }}
                onClick={() => handleTileClick(index)}
              >
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '8px'
                }}>
                  {tile.icon}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  {tile.title}
                </div>
                
                {/* Edge highlight effect */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '12px',
                  pointerEvents: 'none',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.3), inset 1px 0 1px rgba(255, 255, 255, 0.3)'
                }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CenteredPerspectiveDemo;
