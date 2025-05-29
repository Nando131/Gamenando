import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './index.css';

const App = () => {
    // ... (state dan fungsi game logic lainnya sama seperti sebelumnya) ...

    const [gamePhase, setGamePhase] = useState('initial');
    const [sequence, setSequence] = useState([]);
    const [playerSequence, setPlayerSequence] = useState([]);
    const [sequenceLength, setSequenceLength] = useState(1);
    const [score, setScore] = useState(0);
    const [readyTimer, setReadyTimer] = useState('');
    const [osuBorderVisible, setOsuBorderVisible] = useState(false);
    const [activeLight, setActiveLight] = useState(null);

    const lightPositions = [0, 1, 2, 3, 4, 5, 6, 7];

    const sequenceTimerRef = useRef(null);
    const readyTimerRef = useRef(null);

    // ... (generateSequence, startGame, startNewRound, handleLightClick, endGame functions here, no changes) ...

    const generateSequence = (length) => {
        const newSequence = [];
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * lightPositions.length);
            newSequence.push(lightPositions[randomIndex]);
        }
        return newSequence;
    };

    const startGame = () => {
        setGamePhase('ready');
        setScore(0);
        setSequenceLength(1);
        setPlayerSequence([]);
        setSequence([]);

        let timer = 3;
        setReadyTimer('Do you ready?');
        readyTimerRef.current = setInterval(() => {
            if (timer > 0) {
                setReadyTimer(String(timer));
                timer--;
            } else {
                setReadyTimer('GO!');
                clearInterval(readyTimerRef.current);
                setTimeout(() => {
                    setGamePhase('showing');
                    startNewRound(1);
                }, 500);
            }
        }, 1000);
    };

    const startNewRound = (length) => {
        const newSequence = generateSequence(length);
        setSequence(newSequence);
        setPlayerSequence([]);
        setGamePhase('showing');
        setActiveLight(null);

        let i = 0;
        sequenceTimerRef.current = setInterval(() => {
            if (i < newSequence.length) {
                setActiveLight(newSequence[i]);
                setTimeout(() => {
                    setActiveLight(null);
                }, 400);
                i++;
            } else {
                clearInterval(sequenceTimerRef.current);
                setGamePhase('playing');
                setActiveLight(null);
            }
        }, 800);
    };

    const handleLightClick = (index) => {
        if (gamePhase !== 'playing') return;

        const newPlayerSequence = [...playerSequence, index];
        setPlayerSequence(newPlayerSequence);

        if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
            setGamePhase('gameOver');
            clearInterval(sequenceTimerRef.current);
            clearInterval(readyTimerRef.current);
        } else if (newPlayerSequence.length === sequence.length) {
            setScore(score + 1);
            setSequenceLength(sequenceLength + 1);
            setTimeout(() => {
                startNewRound(sequenceLength + 1);
            }, 1000);
        }
    };

    // Efek untuk membersihkan timer saat komponen di-unmount
    useEffect(() => {
        return () => {
            if (sequenceTimerRef.current) clearInterval(sequenceTimerRef.current);
            if (readyTimerRef.current) clearInterval(readyTimerRef.current);
        };
    }, []);

    // Efek untuk mengontrol border OSU setelah animasi tombol PLAY
    useEffect(() => {
        if (gamePhase === 'ready') {
            setTimeout(() => {
                setOsuBorderVisible(true);
            }, 500);
        } else if (gamePhase === 'initial' && osuBorderVisible) {
            setOsuBorderVisible(false);
        }
    }, [gamePhase, osuBorderVisible]);


    return (
        <div className={`App ${gamePhase === 'ready' ? 'ready' : ''}`}> {/* <-- Perubahan di sini! */}
            <h1 className="game-title">Memory Sequence</h1>

            {/* Initial Screen */}
            {gamePhase === 'initial' && (
                <div className="initial-screen">
                    <button
                        className="play-button"
                        onClick={startGame}
                    >
                        PLAY
                    </button>
                </div>
            )}

            {/* Ready Phase */}
            {gamePhase === 'ready' && (
                <div className="ready-phase">
                    <p className="ready-text">{readyTimer}</p>
                </div>
            )}

            {/* Game Play Area */}
            {(gamePhase === 'showing' || gamePhase === 'playing' || gamePhase === 'gameOver') && (
                <>
                    <div className={`osu-border top ${osuBorderVisible ? 'osu-border-in' : ''}`}></div>
                    <div className="game-area">
                        <div className="game-info">
                            <p>Score: {score}</p>
                            <p>Level: {sequenceLength - 1}</p>
                        </div>
                        <div className="lights-grid">
                            {lightPositions.map((pos) => (
                                <div
                                    key={pos}
                                    className={`light-button ${activeLight === pos ? 'active' : ''} ${gamePhase === 'playing' ? 'clickable' : ''}`}
                                    onClick={() => handleLightClick(pos)}
                                >
                                    {/* Bisa ditambahkan angka atau ikon di sini */}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={`osu-border bottom ${osuBorderVisible ? 'osu-border-in' : ''}`}></div>
                </>
            )}

            {/* Game Over Screen */}
            {gamePhase === 'gameOver' && (
                <div className="game-over-screen">
                    <h2>Game Over!</h2>
                    <p>Your final score: {score}</p>
                    <button className="restart-button" onClick={startGame}>
                        Play Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default App;