# HomePage_AboutUs.css Documentation

## Overview
This CSS file creates an elegant, book-like design for an "About Us" section with classic typography, decorative elements, and responsive layouts. The styling emphasizes readability and traditional print design aesthetics while maintaining modern web standards.

## File Structure & Architecture

### 1. **Container Layout** (Lines 3-16)
The main structural foundation for the About Us page.

#### Spatial Design
- `.about-us-container` - Uses calculated widths based on spatial units
  - Max-width: 3x the spatial container width variable
  - Centered layout with auto margins
  - Generous padding using large and medium spacing variables

- `.about-us-content` - Inner content wrapper
  - Max-width: 2.25x spatial container width
  - Center-aligned text presentation
  - Medium padding for comfortable reading

### 2. **Typography System** (Lines 17-61)

#### Heading Hierarchy
- **H1 Styling** (Primary Header)
  - Font size: 2x the large font size variable
  - Uppercase text transformation
  - Letter spacing: 1.2px for elegance
  - Bottom border with primary color
  - Line height: 1.4 for readability

- **H2 Styling** (Secondary Headers)
  - Font size: 1.5x the large font size variable
  - Centered alignment
  - Normal font weight for subtlety

#### Body Text
- **Paragraph Styling**
  - Font size: 0.9x large font size
  - Line height: 2 (double spacing)
  - Max-width constraint for optimal reading length
  - Auto margins for centering

#### Drop Cap Feature
```css
.about-us-container p:first-of-type::first-letter {
  font-size: calc(var(--model-font-size-lg) * 2.5);
  font-family: 'Libre Baskerville', Georgia, serif;
  /* Classic serif font for traditional feel */
}
```

### 3. **Decorative Elements** (Lines 62-89)

#### Signature Section
- `.signature-section` - Author/signature styling
  - Italic font style
  - Reduced font size (0.8x)
  - Top margin spacing

#### Visual Divider
- `.decorative-divider` - Ornamental separator
  - Centered alignment
  - Primary color theming
  - 1.2x font size for prominence

#### TEA Space Seal
- `.about-us-seal` - SVG-based logo/seal
  - Square dimensions (0.5x spatial width)
  - Inline SVG with decorative circles
  - Text elements for "TEA Space" and "Established 2025"
  - Brown color scheme (#5c4b24)

### 4. **Tab Integration** (Lines 91-97)
Special styling for active About Us tab state.

```css
.tab-button.active[data-tab="AboutUs"] {
  background-color: var(--model-color-background-alt);
  border-bottom: 3px solid var(--model-color-border);
  color: var(--primary-color);
}
```

### 5. **Responsive Design** (Lines 98-122)

#### Mobile Breakpoint (768px)
- **Container Adjustments**
  - Reduced padding to medium spacing
  - Added margins for edge spacing
  
- **Typography Scaling**
  - H1: Reduced to 1.5x large font size
  - H2: Reduced to 1.2x large font size
  - Paragraphs: Standard large font size
  
- **Seal Resizing**
  - Dimensions reduced to 0.375x spatial width
  - Maintains aspect ratio

## Design Philosophy

### Classical Book Design
The styling mimics traditional book typography with:
- Serif fonts for drop caps
- Generous line spacing
- Centered text alignment
- Formal heading hierarchy

### Visual Hierarchy
1. Primary header with decorative underline
2. Body text with optimal reading width
3. Decorative elements for visual interest
4. Signature section for authenticity

### Color Scheme
- Primary colors from CSS variables
- Brown tones (#5c4b24) for seal/logo
- Consistent theming with app design system

## CSS Variables Used
- `--app-background` - Page background color
- `--primary-color` - Accent color for headers
- `--model-spacing-*` - Consistent spacing system
- `--model-font-size-lg` - Base font size for calculations
- `--spatial-container-width` - Layout width calculations
- `--model-color-border` - Border colors
- `--model-color-background-alt` - Alternative backgrounds

## Browser Compatibility
- Modern CSS calc() functions
- CSS custom properties support required
- SVG inline data URIs
- Media queries for responsiveness
- Flexbox layout system

## Accessibility Considerations
- High contrast text colors
- Readable font sizes (minimum 16px equivalent)
- Clear heading hierarchy
- Sufficient line spacing for readability
- Responsive text scaling