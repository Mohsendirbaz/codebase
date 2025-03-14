// This is an example of an inactive file
// Notice the [I]_ prefix in the filename

import React from 'react';

function InactiveComponent() {
  return (
    <div>
      <h1>This is an inactive component</h1>
      <p>It's not imported from the entry point (index.js) or any active file</p>
    </div>
  );
}

export default InactiveComponent;
