/**
 * Overscroll Solution
 * 
 * This script provides cross-browser support for preventing scroll chaining
 * (the behavior where scrolling in one element continues to the parent when
 * reaching the boundary). Works in all browsers including Safari on iOS < 16.
 */

/**
 * Apply overscroll solution to specified elements
 * @param {string} selector - CSS selector for elements to apply the solution to
 */
export function applyOverscrollPolyfill(selector = '.navigation-breadcrumb') {
  // Apply to all browsers regardless of support for overscroll-behavior
  const elements = document.querySelectorAll(selector);
  
  elements.forEach(element => {
    // Store original touch event handlers
    const originalTouchStart = element.ontouchstart;
    const originalTouchMove = element.ontouchmove;
    
    // Prevent scroll chaining by stopping touchmove events when at scroll boundaries
    element.addEventListener('touchstart', function(e) {
      // Call original handler if it exists
      if (typeof originalTouchStart === 'function') {
        originalTouchStart.call(this, e);
      }
      
      // Store initial scroll position and touch position
      this._scrollTop = this.scrollTop;
      this._scrollLeft = this.scrollLeft;
      this._touchStartX = e.touches[0].clientX;
      this._touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    element.addEventListener('touchmove', function(e) {
      // Call original handler if it exists
      if (typeof originalTouchMove === 'function') {
        originalTouchMove.call(this, e);
      }
      
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = this._touchStartX - touchX;
      const deltaY = this._touchStartY - touchY;
      
      // Determine scroll direction
      const isScrollingUp = deltaY < 0;
      const isScrollingDown = deltaY > 0;
      const isScrollingLeft = deltaX < 0;
      const isScrollingRight = deltaX > 0;
      
      // Check if at scroll boundaries
      const isAtTop = this.scrollTop <= 0;
      const isAtBottom = this.scrollTop + this.clientHeight >= this.scrollHeight;
      const isAtLeft = this.scrollLeft <= 0;
      const isAtRight = this.scrollLeft + this.clientWidth >= this.scrollWidth;
      
      // Prevent scroll chaining when at boundaries
      if ((isAtTop && isScrollingUp) || 
          (isAtBottom && isScrollingDown) || 
          (isAtLeft && isScrollingLeft) || 
          (isAtRight && isScrollingRight)) {
        e.preventDefault();
      }
    }, { passive: false }); // passive: false is required to use preventDefault
    
    // Also handle wheel events for desktop browsers
    element.addEventListener('wheel', function(e) {
      const { deltaY, deltaX } = e;
      
      // Determine scroll direction
      const isScrollingUp = deltaY < 0;
      const isScrollingDown = deltaY > 0;
      const isScrollingLeft = deltaX < 0;
      const isScrollingRight = deltaX > 0;
      
      // Check if at scroll boundaries
      const isAtTop = this.scrollTop <= 0;
      const isAtBottom = this.scrollTop + this.clientHeight >= this.scrollHeight;
      const isAtLeft = this.scrollLeft <= 0;
      const isAtRight = this.scrollLeft + this.clientWidth >= this.scrollWidth;
      
      // Prevent scroll chaining when at boundaries
      if ((isAtTop && isScrollingUp) || 
          (isAtBottom && isScrollingDown) || 
          (isAtLeft && isScrollingLeft) || 
          (isAtRight && isScrollingRight)) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Add a class to indicate the solution is applied
    element.classList.add('overscroll-polyfill-applied');
  });
  
  console.log('Overscroll solution applied to', elements.length, 'elements');
}

// Auto-initialize when the DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyOverscrollPolyfill());
  } else {
    applyOverscrollPolyfill();
  }
}
