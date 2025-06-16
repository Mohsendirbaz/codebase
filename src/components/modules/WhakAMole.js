import React, { useState, useEffect, useRef } from 'react';
import '../../styles/HomePage.CSS/HCSS.css';

const WhakAMole = ({ onClose }) => {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [activeMole, setActiveMole] = useState(null);
    const [difficulty, setDifficulty] = useState('medium');
    const [highScore, setHighScore] = useState(() => {
        const saved = localStorage.getItem('whakamole_highscore');
        return saved ? parseInt(saved) : 0;
    });

    const timerRef = useRef(null);
    const moleTimerRef = useRef(null);
    const gridSize = 9; // 3x3 grid

    // Calculate mole appearance time based on difficulty
    const getMoleTime = () => {
        switch(difficulty) {
            case 'easy': return { min: 1000, max: 2000 };
            case 'hard': return { min: 500, max: 1000 };
            default: return { min: 800, max: 1500 }; // medium
        }
    };

    // Start the game
    const startGame = () => {
        setScore(0);
        setTimeLeft(30);
        setGameStarted(true);
        setGameOver(false);
        setActiveMole(null);

        // Start countdown timer
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

        // Start mole appearance
        showRandomMole();
    };

    // Show a mole in a random hole
    const showRandomMole = () => {
        const { min, max } = getMoleTime();
        const randomTime = Math.floor(Math.random() * (max - min) + min);

        // Clear any existing timer
        if (moleTimerRef.current) clearTimeout(moleTimerRef.current);

        // Pick a random hole
        let randomHole;
        do {
            randomHole = Math.floor(Math.random() * gridSize);
        } while (randomHole === activeMole);

        setActiveMole(randomHole);

        // Set timer to hide mole and show next one
        moleTimerRef.current = setTimeout(() => {
            setActiveMole(null);
            if (gameStarted && !gameOver) {
                showRandomMole();
            }
        }, randomTime);
    };

    // whak a mole
    const whakMole = (index) => {
        if (!gameStarted || gameOver) return;

        if (index === activeMole) {
            setScore(prevScore => prevScore + 1);
            setActiveMole(null);
            showRandomMole();
        }
    };

    // Clean up timers on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
        };
    }, []);

    // Render the game grid
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

    return (
        <div className="whakamole-container">
            <div className="whakamole-header">
                <h2>whak-a-Mole</h2>
                <button className="close-button" onClick={onClose}>×</button>
            </div>

            <div className="game-info">
                <div className="score">Score: {score}</div>
                <div className="time-left">Time: {timeLeft}s</div>
                <div className="high-score">High Score: {highScore}</div>
            </div>

            {!gameStarted && !gameOver && (
                <div className="game-start">
                    <div className="difficulty-select">
                        <span>Difficulty:</span>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                    <button className="start-button" onClick={startGame}>Start Game</button>
                </div>
            )}

            {gameOver && (
                <div className="game-over">
                    <h3>Game Over!</h3>
                    <p>Your score: {score}</p>
                    <button className="start-button" onClick={startGame}>Play Again</button>
                </div>
            )}

            <div className={`game-grid ${gameStarted ? 'active' : ''}`}>
                {renderGrid()}
            </div>
        </div>
    );
};

export default WhakAMole;
