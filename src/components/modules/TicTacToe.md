# TicTacToe Component

## Overview
The `TicTacToe` component is a fully functional, interactive tic-tac-toe game with score tracking, win detection, and a clean user interface. It serves as both an entertainment feature and a demonstration of React state management.

## Purpose
- Provide an interactive game within the application
- Demonstrate React hooks and state management
- Offer a mental break for users
- Showcase component interaction patterns

## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onClose` | Function | Yes | Callback to close the game |

## State Management

### Game State
```javascript
const [board, setBoard] = useState(Array(9).fill(null));
const [isXNext, setIsXNext] = useState(true);
const [winner, setWinner] = useState(null);
const [gameOver, setGameOver] = useState(false);
const [score, setScore] = useState({ x: 0, o: 0, ties: 0 });
```

- `board`: Array of 9 elements representing the game grid
- `isXNext`: Boolean tracking whose turn it is
- `winner`: Stores winning player ('X' or 'O')
- `gameOver`: Game completion status
- `score`: Persistent score tracking object

## Game Logic

### Win Detection
```javascript
const winningPatterns = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];
```

Checks all possible winning combinations after each move.

### Game Flow
1. Player clicks empty square
2. Square is marked with current player's symbol
3. Check for winner or tie
4. Update score if game ends
5. Switch to next player

### Score Management
```javascript
const updateScore = (result) => {
  if (result === 'X') {
    setScore(prev => ({ ...prev, x: prev.x + 1 }));
  } else if (result === 'O') {
    setScore(prev => ({ ...prev, o: prev.o + 1 }));
  } else {
    setScore(prev => ({ ...prev, ties: prev.ties + 1 }));
  }
};
```

## Component Structure

### Header Section
```jsx
<div className="tictactoe-header">
  <h2>Tic-Tac-Toe</h2>
  <button className="close-button" onClick={onClose}>×</button>
</div>
```

### Score Board
```jsx
<div className="score-board">
  <div className="score-item">X: {score.x}</div>
  <div className="score-item">O: {score.o}</div>
  <div className="score-item">Ties: {score.ties}</div>
</div>
```

### Game Status
Dynamic status message showing:
- Current player's turn
- Winner announcement
- Tie game notification

### Game Board
3x3 grid rendered using board rows:
```jsx
<div className="game-board">
  <div className="board-row">
    {renderSquare(0)}
    {renderSquare(1)}
    {renderSquare(2)}
  </div>
  {/* Additional rows... */}
</div>
```

## Square Rendering
```javascript
const renderSquare = (index) => {
  const isWinningSquare = winner && board[index] === winner;
  return (
    <button
      className={`square ${isWinningSquare ? 'winning' : ''} ${board[index] ? board[index].toLowerCase() : ''}`}
      onClick={() => handleClick(index)}
    >
      {board[index]}
    </button>
  );
};
```

## CSS Classes
- `.tictactoe-container`: Main container
- `.square`: Individual game squares
- `.winning`: Highlights winning squares
- `.x`, `.o`: Player-specific styling
- `.board-row`: Grid row container

## Event Handlers

### Square Click
```javascript
const handleClick = (index) => {
  if (board[index] || gameOver) return;
  
  const newBoard = [...board];
  newBoard[index] = isXNext ? 'X' : 'O';
  setBoard(newBoard);
  setIsXNext(!isXNext);
};
```

### Game Reset
```javascript
const resetGame = () => {
  setBoard(Array(9).fill(null));
  setIsXNext(true);
  setWinner(null);
  setGameOver(false);
};
```

## Game Features
1. **Turn-based play**: Alternates between X and O
2. **Win detection**: Identifies winning patterns
3. **Tie detection**: Recognizes draw games
4. **Score persistence**: Tracks wins and ties
5. **Visual feedback**: Highlights winning combination
6. **Reset functionality**: Start new game anytime

## Usage Example
```jsx
import TicTacToe from './TicTacToe';

const GameContainer = () => {
  const [showGame, setShowGame] = useState(false);

  return (
    <>
      <button onClick={() => setShowGame(true)}>
        Play Tic-Tac-Toe
      </button>
      
      {showGame && (
        <TicTacToe onClose={() => setShowGame(false)} />
      )}
    </>
  );
};
```

## Game Rules
1. Players take turns marking squares
2. First player to get 3 in a row wins
3. Game ends in tie if all squares filled
4. Score accumulates across multiple games
5. Reset button starts new game

## Accessibility Considerations
- Clear visual indicators for game state
- Button elements for keyboard navigation
- Status announcements for screen readers
- High contrast between X and O markers

## Future Enhancements
- AI opponent with difficulty levels
- Multiplayer online mode
- Game history replay
- Custom board sizes (4x4, 5x5)
- Sound effects and animations
- Tournament mode with brackets