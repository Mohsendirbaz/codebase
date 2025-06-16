# TicTacToe.css Documentation

## Overview
The TicTacToe CSS file defines a complete game interface with neumorphic design, featuring a game board, score tracking, and responsive interactions. This stylesheet demonstrates how to create an engaging mini-game UI with modern CSS techniques.

## Architectural Structure

### 1. Game Container Design

#### Main Container `.tictactoe-container`
```css
.tictactoe-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    width: 300px;
}
```
- **Positioning**: Centered using transform technique
- **Layout**: Fixed 300px width for consistent game size
- **Elevation**: High z-index (1000) for overlay behavior
- **Visual Design**:
  - Neumorphic gradient background
  - Large border radius for soft appearance
  - Backdrop blur for modern glass effect
  - Subtle border with transparency

### 2. Header System

#### Game Header `.tictactoe-header`
- **Layout**: Flexbox with space-between
- **Purpose**: Title and close button container
- **Spacing**: Bottom margin for separation

#### Close Button Design
```css
.close-button {
    background: none;
    border: none;
    font-size: 24px;
    line-height: 1;
}
```
- Minimalist design
- Large click target
- No background distractions

### 3. Score Tracking System

#### Score Board `.score-board`
```css
.score-board {
    display: flex;
    justify-content: space-around;
    background: rgba(var(--border-color-rgb), 0.1);
    border-radius: var(--neu-border-radius-md);
    padding: var(--model-spacing-sm);
}
```
- **Layout**: Even distribution with space-around
- **Visual**: Subtle background for definition
- **Content**: Individual score items with bold text

### 4. Game State Display

#### Status Message `.status`
- Fixed height (24px) prevents layout shift
- Bold text for emphasis
- Centered messaging
- Dynamic content area

### 5. Game Board Architecture

#### Board Container `.game-board`
- Bottom margin for spacing
- Contains row structure

#### Board Rows `.board-row`
```css
.board-row {
    display: flex;
    justify-content: center;
}
```
- Flexbox for horizontal layout
- Center alignment for symmetry

### 6. Square Design System

#### Game Squares `.square`
```css
.square {
    width: 60px;
    height: 60px;
    margin: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
}
```

**Key Features:**
- **Sizing**: 60x60px for comfortable interaction
- **Spacing**: 4px margins create grid gaps
- **Layout**: Flexbox for perfect centering
- **Styling**:
  - Neumorphic gradient background
  - Small shadow for depth
  - Rounded corners for softness
  - Smooth transitions

#### Square States

1. **Hover State** (Empty squares only)
   ```css
   .square:hover:not(.x):not(.o) {
       box-shadow: var(--neu-shadow-md);
       transform: scale(1.05);
   }
   ```
   - Enhanced shadow
   - Slight scale increase
   - Only on playable squares

2. **Player Markers**
   ```css
   .square.x { color: var(--primary-color); }
   .square.o { color: var(--accent-color); }
   ```
   - Color-coded players
   - Theme-aware colors

3. **Winning Squares**
   ```css
   .square.winning {
       background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
       color: white;
       transform: scale(1.05);
   }
   ```
   - Gradient background
   - White text for contrast
   - Permanent scale effect

### 7. Reset Button Design

#### Game Reset `.reset-button`
- Neumorphic styling consistent with game
- Padding using spacing variables
- Hover effects with transform and shadow
- Bold text for emphasis

### 8. Theme Adaptations

#### Dark Theme Enhancements
```css
:root.dark-theme .tictactoe-container {
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5), 
                inset 0 1px 1px rgba(255, 255, 255, 0.1);
}
```
- Deeper shadows for dark backgrounds
- Inset highlight for depth
- Adjusted player colors for visibility

## Visual Hierarchy

```
.tictactoe-container
├── .tictactoe-header
│   ├── h2 (Game Title)
│   └── .close-button
├── .score-board
│   └── .score-item (×3: Player X, Player O, Draws)
├── .status (Current game state)
├── .game-board
│   └── .board-row (×3)
│       └── .square (×3 per row)
└── .reset-button
```

## Design System Integration

### CSS Variables Used
- **Spacing**: `--model-spacing-sm/md/lg`
- **Colors**: 
  - `--primary-color` (X player)
  - `--accent-color` (O player)
  - `--text-color` (UI text)
  - `--border-color-rgb` (backgrounds)
- **Neumorphic**: 
  - `--neu-gradient-basic`
  - `--neu-shadow-sm/md/lg`
  - `--neu-border-radius-sm/md/lg`
- **Transitions**: `0.3s ease` throughout

### Color Scheme
- **Players**: Primary (X) vs Accent (O)
- **Winning**: Gradient celebration effect
- **UI**: Theme-aware neutrals

## Interaction Design

### 1. Click Feedback
- Hover states on empty squares
- No hover on occupied squares
- Clear visual feedback

### 2. Game States
- **Empty**: Base square appearance
- **Occupied**: Player color coding
- **Winning**: Celebratory gradient

### 3. Animation Timing
- 0.3s transitions for smoothness
- Transform-based for performance
- No layout shifts

## Responsive Considerations

While the game has a fixed 300px width, it remains usable on all devices:
- Centered positioning works on any screen
- Touch-friendly 60px squares
- High contrast for outdoor visibility
- z-index ensures proper layering

## Accessibility Features

1. **Color Differentiation**: X and O use different colors
2. **Size**: Large touch targets (60px squares)
3. **Contrast**: Theme-aware color selections
4. **Status Updates**: Clear game state messaging

## Performance Optimizations

1. **Transform Animations**: Hardware accelerated
2. **Simple Shadows**: Not overly complex
3. **Efficient Selectors**: Specific class targeting
4. **Minimal Repaints**: Transform-based effects

## Theme Support

### Light Theme (Default)
- Standard colors and shadows
- Good contrast ratios

### Dark Theme
- Enhanced shadows for depth
- Adjusted player colors (info/warning)
- Inset highlights for definition

## Best Practices

1. **State Management**: Use classes (.x, .o, .winning) for game state
2. **Animation**: Keep transitions smooth but not distracting
3. **Feedback**: Immediate visual response to interactions
4. **Reset**: Clear visual indication of new game

## Game-Specific Considerations

1. **Board Layout**: 3×3 grid with consistent spacing
2. **Player Identification**: Clear color coding
3. **Win Celebration**: Visual feedback for game completion
4. **Score Persistence**: Dedicated score display area

This CSS file exemplifies how to create an engaging, polished game interface using modern CSS techniques while maintaining performance and accessibility standards.