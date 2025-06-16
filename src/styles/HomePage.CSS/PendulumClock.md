# PendulumClock.css Documentation

## Overview
PendulumClock.css creates a sophisticated, animated grandfather clock component with realistic pendulum physics. The stylesheet implements a complete clock face with moving hands and a swinging pendulum, featuring three size variations and rich visual details that simulate a traditional wooden clock aesthetic.

## Architecture Overview

### Component Hierarchy
```
.clock-overlay (Fixed positioning wrapper)
└── .clock-container (Main clock body)
    ├── .clock-face (Circular clock display)
    │   ├── .clock-number (1-12 positions)
    │   ├── .hour-hand
    │   ├── .minute-hand
    │   ├── .second-hand
    │   └── .clock-center (Central pivot)
    └── .pendulum-container
        └── .pendulum-rod
            └── .pendulum-bob
```

### Size System
Three predefined sizes with proportional scaling:
- **Small**: 200x300px container
- **Medium**: 300x450px container (default)
- **Large**: 400x600px container

## Core Components

### 1. Main Clock Container
```css
.clock-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #874c3a;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    padding: 30px;
    border: 10px solid #5e2b1a;
    overflow: visible;
    z-index: 50;
}
```
- **Design**: Wood-like brown color scheme (#874c3a)
- **Structure**: Vertical flex layout for face and pendulum
- **Visual Effects**: Deep shadow for dimensionality
- **Border**: Dark wood-tone border (#5e2b1a)

### 2. Clock Face Design
```css
.clock-face {
    position: relative;
    background: #f9f4e8;
    border-radius: 50%;
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1),
                0 0 0 10px #874c3a,
                0 0 0 12px #ac826f;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
}
```
- **Appearance**: Cream-colored face (#f9f4e8)
- **Borders**: Double-ring border effect
- **Shadow**: Inset shadow for depth
- **Shape**: Perfect circle with centered content

### 3. Clock Hands System

#### Hand Base Styles
```css
.hour-hand, .minute-hand, .second-hand {
    position: absolute;
    transform-origin: bottom center;
    bottom: 50%;
    left: 50%;
    border-radius: 10px;
    z-index: 5;
}
```
- **Positioning**: Centered with bottom transform origin
- **Rotation**: Bottom-center pivot for accurate time display
- **Styling**: Rounded edges for elegance

#### Hand Specifications
1. **Hour Hand**
   - Width: 8px (5px small, 10px large)
   - Height: 70px (40px small, 100px large)
   - Color: #333 (dark gray)

2. **Minute Hand**
   - Width: 5px (3px small, 6px large)
   - Height: 100px (60px small, 140px large)
   - Color: #555 (medium gray)

3. **Second Hand**
   - Width: 2px (1px small, 3px large)
   - Height: 120px (70px small, 160px large)
   - Color: #e74c3c (red accent)

### 4. Clock Numbers
```css
.clock-number {
    position: absolute;
    font-size: 20px;
    color: #333;
    font-weight: 700;
    text-align: center;
    transform: translate(-50%, -50%);
}
```
- **Typography**: Bold 700 weight for readability
- **Positioning**: Absolute with centered transform
- **Scaling**: 14px (small), 20px (medium), 24px (large)

### 5. Pendulum Mechanism

#### Container Structure
```css
.pendulum-container {
    position: relative;
    height: 250px;
    width: 100%;
    display: flex;
    justify-content: center;
    overflow: hidden;
}
```
- **Layout**: Centered flex container
- **Overflow**: Hidden to contain swing motion
- **Heights**: 150px (small), 250px (medium), 350px (large)

#### Pendulum Components
```css
.pendulum-rod {
    position: absolute;
    top: 0;
    width: 4px;
    height: 200px;
    background: #333;
    transform-origin: top center;
    display: flex;
    justify-content: center;
}

.pendulum-bob {
    position: absolute;
    bottom: -25px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #b69066, #5e2b1a);
    border-radius: 50%;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
```
- **Rod**: Dark thin line with top-center pivot
- **Bob**: Gradient sphere with realistic shadow
- **Scaling**: Proportional to container size

### 6. Animation System

#### Pendulum Swing Animation
```css
.pendulum-animate {
    animation: swing 2s ease-in-out infinite;
}

@keyframes swing {
    0% { transform: rotate(20deg); }
    50% { transform: rotate(-20deg); }
    100% { transform: rotate(20deg); }
}
```
- **Motion**: ±20 degree swing arc
- **Timing**: 2-second period with ease-in-out
- **Physics**: Simulates natural pendulum motion

### 7. Visual Enhancements

#### Clock Face Decoration
```css
.clock-face::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    height: 90%;
    border-radius: 50%;
    background: radial-gradient(circle, transparent 60%, rgba(0, 0, 0, 0.05) 100%);
}
```
- **Effect**: Subtle vignette for depth
- **Technique**: Radial gradient overlay
- **Purpose**: Enhances realism

### 8. UI Controls

#### Toggle Button
```css
.clock-toggle-button {
    position: fixed;
    top: 20px;
    left: 20px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--neu-border-radius-md);
    padding: 8px 16px;
    font-weight: bold;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: var(--neu-shadow-md);
    transition: all 0.3s ease;
}
```
- **Position**: Fixed top-left placement
- **Styling**: Uses CSS variables for theming
- **Interaction**: Hover lift effect
- **Purpose**: Show/hide clock overlay

#### Clock Overlay
```css
.clock-overlay {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
}
```
- **Positioning**: Centered viewport overlay
- **Effect**: Backdrop blur for focus
- **Z-index**: Maximum layer priority

## Design System

### Color Palette
1. **Wood Tones**
   - Primary: #874c3a (medium brown)
   - Dark: #5e2b1a (dark brown)
   - Light: #ac826f (light brown accent)
   - Gradient: #b69066 (golden brown)

2. **Clock Face**
   - Background: #f9f4e8 (antique white)
   - Numbers/Hands: #333, #555 (grays)
   - Second Hand: #e74c3c (red accent)

### Shadow System
1. **Container**: `0 20px 60px rgba(0, 0, 0, 0.3)`
2. **Clock Face**: Multiple shadows for depth
3. **Pendulum Bob**: `0 5px 15px rgba(0, 0, 0, 0.3)`

## Responsive Scaling

### Size Classes Impact
Each size class proportionally scales:
- Container dimensions
- Clock face diameter
- Hand lengths and widths
- Number font sizes
- Pendulum dimensions

### Scaling Ratios
- Small: ~50% of large
- Medium: ~75% of large
- Large: 100% (base size)

## Animation Performance

### Optimization Strategies
1. **Transform-only animations**: Hardware accelerated
2. **Fixed timing**: No dynamic calculations
3. **Simple keyframes**: Minimal animation complexity
4. **Single animation**: Only pendulum moves continuously

### Browser Considerations
- **Transform-origin**: Well-supported property
- **CSS Animations**: Universal modern support
- **Backdrop-filter**: May need fallback for older browsers

## Usage Guidelines

### Implementation
```html
<div class="clock-overlay">
    <div class="clock-container medium">
        <div class="clock-face">
            <div class="clock-number" style="top: 10%; left: 50%;">12</div>
            <!-- More numbers... -->
            <div class="hour-hand"></div>
            <div class="minute-hand"></div>
            <div class="second-hand"></div>
            <div class="clock-center"></div>
        </div>
        <div class="pendulum-container">
            <div class="pendulum-rod pendulum-animate">
                <div class="pendulum-bob"></div>
            </div>
        </div>
    </div>
</div>
```

### JavaScript Integration
```javascript
// Update clock hands based on time
function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    hourHand.style.transform = `translateX(-50%) rotate(${hours * 30 + minutes * 0.5}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${minutes * 6}deg)`;
    secondHand.style.transform = `translateX(-50%) rotate(${seconds * 6}deg)`;
}
```

## Accessibility Considerations

### Visual Accessibility
1. High contrast between hands and face
2. Large, bold numbers for readability
3. Clear color differentiation
4. Sufficient size options

### Motion Accessibility
1. Smooth, predictable pendulum motion
2. Option to disable animations
3. No rapid movements
4. Toggle control for hiding

## Best Practices

### Performance
1. Use CSS transforms for hand rotation
2. Limit repaints by batching updates
3. Consider requestAnimationFrame for smooth motion
4. Optimize for 60fps animations

### Implementation
1. Position numbers programmatically for accuracy
2. Update hands with JavaScript for real time
3. Add ARIA labels for screen readers
4. Test across different screen sizes

### Maintenance
1. Use CSS variables for easy theming
2. Keep animations in separate classes
3. Document magic numbers (angles, positions)
4. Test on various devices and browsers

## Potential Enhancements

### Suggested Features
1. Chiming sound effects
2. Day/date display
3. Multiple timezone support
4. Customizable wood textures
5. Speed controls for pendulum
6. Digital time display option
7. Theme variations (metal, modern, etc.)