# WhakAMole Component

## Overview
The `WhakAMole` component is an interactive whack-a-mole game featuring difficulty levels, score tracking, and persistent high scores. It demonstrates advanced React patterns including interval management, ref usage, and local storage integration.

## Purpose
- Provide an engaging mini-game experience
- Demonstrate complex state and timer management
- Show React performance optimization techniques
- Offer stress relief and entertainment for users

## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onClose` | Function | Yes | Callback to close the game |

## State Management

### Core Game State
```javascript
const [score, setScore] = useState(0);
const [timeLeft, setTimeLeft] = useState(30);
const [gameStarted, setGameStarted] = useState(false);
const [gameOver, setGameOver] = useState(false);
const [activeMole, setActiveMole] = useState(null);
const [difficulty, setDifficulty] = useState('medium');
```

### High Score Management
```javascript
const [highScore, setHighScore] = useState(() => {
  const saved = localStorage.getItem('whakamole_highscore');
  return saved ? parseInt(saved) : 0;
});
```
Uses localStorage for persistent high score tracking.

### Timer References
```javascript
const timerRef = useRef(null);      // Game countdown timer
const moleTimerRef = useRef(null);  // Mole appearance timer
```

## Game Configuration

### Grid Layout
```javascript
const gridSize = 9; // 3x3 grid
```

### Difficulty Settings
```javascript
const getMoleTime = () => {
  switch(difficulty) {
    case 'easy': return { min: 1000, max: 2000 };
    case 'hard': return { min: 500, max: 1000 };
    default: return { min: 800, max: 1500 }; // medium
  }
};
```

## Game Mechanics

### Game Initialization
```javascript
const startGame = () => {
  setScore(0);
  setTimeLeft(30);
  setGameStarted(true);
  setGameOver(false);
  setActiveMole(null);
  
  // Start countdown timer
  // Start mole appearance
  showRandomMole();
};
```

### Mole Appearance Logic
```javascript
const showRandomMole = () => {
  const { min, max } = getMoleTime();
  const randomTime = Math.floor(Math.random() * (max - min) + min);
  
  // Pick random hole (avoid repeating same hole)
  let randomHole;
  do {
    randomHole = Math.floor(Math.random() * gridSize);
  } while (randomHole === activeMole);
  
  setActiveMole(randomHole);
  
  // Set timer for next mole
  moleTimerRef.current = setTimeout(() => {
    setActiveMole(null);
    if (gameStarted && !gameOver) {
      showRandomMole();
    }
  }, randomTime);
};
```

### Whack Detection
```javascript
const whakMole = (index) => {
  if (!gameStarted || gameOver) return;
  
  if (index === activeMole) {
    setScore(prevScore => prevScore + 1);
    setActiveMole(null);
    showRandomMole();
  }
};
```

### Timer Management
Countdown timer with automatic game end:
```javascript
timerRef.current = setInterval(() => {
  setTimeLeft(prevTime => {
    if (prevTime <= 1) {
      clearInterval(timerRef.current);
      clearInterval(moleTimerRef.current);
      setGameOver(true);
      setGameStarted(false);
      
      // Update high score if needed
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('whakamole_highscore', score.toString());
      }
      
      return 0;
    }
    return prevTime - 1;
  });
}, 1000);
```

## Component Structure

### Header
```jsx
<div className="whakamole-header">
  <h2>whak-a-Mole</h2>
  <button className="close-button" onClick={onClose}>×</button>
</div>
```

### Game Information Display
```jsx
<div className="game-info">
  <div className="score">Score: {score}</div>
  <div className="time-left">Time: {timeLeft}s</div>
  <div className="high-score">High Score: {highScore}</div>
</div>
```

### Game States

#### Pre-Game
```jsx
<div className="game-start">
  <div className="difficulty-select">
    <span>Difficulty:</span>
    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
      <option value="easy">Easy</option>
      <option value="medium">Medium</option>
      <option value="hard">Hard</option>
    </select>
  </div>
  <button className="start-button" onClick={startGame}>Start Game</button>
</div>
```

#### Game Over
```jsx
<div className="game-over">
  <h3>Game Over!</h3>
  <p>Your score: {score}</p>
  <button className="start-button" onClick={startGame}>Play Again</button>
</div>
```

### Game Grid
```jsx
<div className={`game-grid ${gameStarted ? 'active' : ''}`}>
  {renderGrid()}
</div>
```

## Grid Rendering
```javascript
const renderGrid = () => {
  const grid = [];
  for (let i = 0; i < gridSize; i++) {
    grid.push(
      <div
        key={i}
        className={`mole-hole ${activeMole === i ? 'active' : ''}`}
        onClick={() => whakMole(i)}
      >
        <div className="mole"></div>
        <div className="dirt"></div>
      </div>
    );
  }
  return grid;
};
```

## CSS Classes
- `.whakamole-container`: Main game container
- `.mole-hole`: Individual hole in the grid
- `.active`: Mole is visible in this hole
- `.mole`: The mole element
- `.dirt`: Ground/hole visual element
- `.game-grid.active`: Grid during active gameplay

## Cleanup
Proper cleanup on component unmount:
```javascript
useEffect(() => {
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
  };
}, []);
```

## Game Features
1. **Three difficulty levels**: Easy, Medium, Hard
2. **30-second gameplay**: Fixed duration rounds
3. **Score tracking**: Points for each successful hit
4. **High score persistence**: Saved in localStorage
5. **Random mole appearance**: Variable timing based on difficulty
6. **Non-repeating holes**: Moles won't appear in same hole twice in a row

## Performance Optimizations
- Uses refs for timer management (avoids re-renders)
- Efficient state updates with functional setState
- Cleanup prevents memory leaks
- Minimal re-renders during gameplay

## Usage Example
```jsx
import WhakAMole from './WhakAMole';

const GameLauncher = () => {
  const [showGame, setShowGame] = useState(false);

  return (
    <>
      <button onClick={() => setShowGame(true)}>
        Play Whak-a-Mole
      </button>
      
      {showGame && (
        <WhakAMole onClose={() => setShowGame(false)} />
      )}
    </>
  );
};
```

## Difficulty Parameters
| Difficulty | Min Time | Max Time | Description |
|------------|----------|----------|-------------|
| Easy | 1000ms | 2000ms | Slower mole appearances |
| Medium | 800ms | 1500ms | Balanced gameplay |
| Hard | 500ms | 1000ms | Fast-paced challenge |

## Future Enhancements
- Power-ups and special moles
- Multiple moles simultaneously
- Combo scoring system
- Sound effects and animations
- Leaderboard with player names
- Progressive difficulty increase
- Different mole types with varying points
- Hammer cursor animation
- Mobile touch optimization