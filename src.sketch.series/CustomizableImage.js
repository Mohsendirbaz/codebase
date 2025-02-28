import React from 'react';

const CustomizableImage = ({ src, alt, width, height, style }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt;
    link.click();
  };

  const handleOpenInNewWindow = () => {
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
      <html>
        <head>
          <title>${alt}</title>
        </head>
        <body style="display: flex; align-items: center; justify-content: center; margin: 0;">
          <img src="${src}" alt="${alt}" style="max-width: 100%; max-height: 100%;" />
        </body>
      </html>
    `);
  };

  return (
    <div style={{ ...style, position: 'relative' }}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        style={{ cursor: 'pointer' }}
        onClick={handleOpenInNewWindow}
      />
      <button
        onClick={handleDownload}
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '5px 10px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Download
      </button>
    </div>
  );
};

export default CustomizableImage;
