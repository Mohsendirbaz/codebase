import React, { useState, useEffect } from 'react';
import '../../styles/HomePage.CSS/HCSS.css';

const TicTacToe = ({ onClose }) => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [winner, setWinner] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState({ x: 0, o: 0, ties: 0 });

    // Check for winner
    useEffect(() => {
        const winningPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];

        for (const pattern of winningPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                setWinner(board[a]);
                setGameOver(true);
                updateScore(board[a]);
                return;
            }
        }

        // Check for tie
        if (!board.includes(null) && !winner) {
            setGameOver(true);
            updateScore('tie');
        }
    }, [board, winner]);

    const updateScore = (result) => {
        if (result === 'X') {
            setScore(prev => ({ ...prev, x: prev.x + 1 }));
        } else if (result === 'O') {
            setScore(prev => ({ ...prev, o: prev.o + 1 }));
        } else {
            setScore(prev => ({ ...prev, ties: prev.ties + 1 }));
        }
    };

    const handleClick = (index) => {
        if (board[index] || gameOver) return;

        const newBoard = [...board];
        newBoard[index] = isXNext ? 'X' : 'O';
        setBoard(newBoard);
        setIsXNext(!isXNext);
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setIsXNext(true);
        setWinner(null);
        setGameOver(false);
    };

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

    return (
        <div className="tictactoe-container">
            <div className="tictactoe-header">
                <h2>Tic-Tac-Toe</h2>
                <button className="close-button" onClick={onClose}>×</button>
            </div>

            <div className="score-board">
                <div className="score-item">X: {score.x}</div>
                <div className="score-item">O: {score.o}</div>
                <div className="score-item">Ties: {score.ties}</div>
            </div>

            <div className="status">
                {winner ? `Winner: ${winner}` : gameOver ? 'Game ended in a tie!' : `Next player: ${isXNext ? 'X' : 'O'}`}
            </div>

            <div className="game-board">
                <div className="board-row">
                    {renderSquare(0)}
                    {renderSquare(1)}
                    {renderSquare(2)}
                </div>
                <div className="board-row">
                    {renderSquare(3)}
                    {renderSquare(4)}
                    {renderSquare(5)}
                </div>
                <div className="board-row">
                    {renderSquare(6)}
                    {renderSquare(7)}
                    {renderSquare(8)}
                </div>
            </div>

            <button className="reset-button" onClick={resetGame}>New Game</button>
        </div>
    );
};

export default TicTacToe;
