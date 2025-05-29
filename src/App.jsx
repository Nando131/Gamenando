import React, { useState, useEffect, useRef, useCallback } from 'react'; // Tambah useCallback
import './App.css';
import './index.css'; // Pastikan ini ada jika Anda memiliki gaya dasar di sana

const App = () => {
    // --- States Game ---
    const [gamePhase, setGamePhase] = useState('initial'); // 'initial', 'ready', 'showing', 'playing', 'gameOver', 'paused'
    const [sequence, setSequence] = useState([]);
    const [playerSequence, setPlayerSequence] = useState([]);
    const [sequenceLength, setSequenceLength] = useState(1);
    const [score, setScore] = useState(0);
    const [readyTimer, setReadyTimer] = useState('');
    const [osuBorderVisible, setOsuBorderVisible] = useState(false);
    const [activeLight, setActiveLight] = useState(null);
    const [pressedLight, setPressedLight] = useState(null); 
    const [highScore, setHighScore] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [lastSequenceIndex, setLastSequenceIndex] = useState(0);

    const lightPositions = [0, 1, 2, 3, 4, 5, 6, 7];

    // --- Refs untuk Timer ---
    const readyTimerRef = useRef(null);
    const showingIntervalRef = useRef(null); // Ref baru untuk interval saat showing sequence
    // sequenceTimerRef dihapus karena showingIntervalRef sudah cukup mengelola timing sequence

    // --- Fungsi Bantuan ---
    const clearAllTimers = () => {
        clearInterval(readyTimerRef.current);
        clearInterval(showingIntervalRef.current);
    };

    const generateSequence = useCallback((length) => {
        const newSequence = [];
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * lightPositions.length);
            newSequence.push(lightPositions[randomIndex]);
        }
        return newSequence;
    }, [lightPositions]); // lightPositions adalah dependensi

    const updateHighScore = useCallback((currentScore) => {
        if (currentScore > highScore) {
            setHighScore(currentScore);
            localStorage.setItem('memorySequenceHighScore', currentScore.toString());
        }
    }, [highScore]);

    // --- Game Logic ---
    const startGame = useCallback(() => {
        clearAllTimers(); // Pastikan semua timer bersih
        setGamePhase('ready');
        setScore(0);
        setSequenceLength(1);
        setPlayerSequence([]);
        setSequence([]);
        setPressedLight(null);
        setIsPaused(false);
        setLastSequenceIndex(0);

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
                    startNewRound(1); // Mulai ronde baru
                }, 500);
            }
        }, 1000);
    }, []); // Dependensi kosong karena state diatur di dalam

    const startNewRound = useCallback((length, startIndex = 0) => {
        const currentSequence = startIndex === 0 ? generateSequence(length) : sequence;
        setSequence(currentSequence);
        setPlayerSequence([]);
        setGamePhase('showing');
        setActiveLight(null);
        setPressedLight(null);
        setLastSequenceIndex(startIndex);

        let i = startIndex;
        clearAllTimers(); // Clear old interval before setting new one
        showingIntervalRef.current = setInterval(() => {
            if (i < currentSequence.length) {
                setActiveLight(currentSequence[i]);
                setTimeout(() => setActiveLight(null), 400);
                i++;
                setLastSequenceIndex(i);
            } else {
                clearAllTimers();
                setGamePhase('playing');
                setActiveLight(null);
            }
        }, 800);
    }, [generateSequence, sequence, setSequence, setPlayerSequence, setGamePhase, setActiveLight, setPressedLight, setLastSequenceIndex]);

    const handleLightClick = useCallback((index) => {
        if (gamePhase !== 'playing') return;

        setPressedLight(index);
        setTimeout(() => setPressedLight(null), 150);

        const newPlayerSequence = [...playerSequence, index];
        setPlayerSequence(newPlayerSequence);

        if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
            setGamePhase('gameOver');
            clearAllTimers();
            updateHighScore(score);
        } else if (newPlayerSequence.length === sequence.length) {
            setScore(prevScore => prevScore + 1);
            setSequenceLength(prevLength => prevLength + 1);
            setTimeout(() => {
                startNewRound(sequenceLength + 1);
            }, 1000);
        }
    }, [gamePhase, playerSequence, sequence, score, sequenceLength, startNewRound, updateHighScore]);

    // --- Pause/Menu Handlers ---
    const togglePause = useCallback(() => {
        if (gamePhase === 'showing' || gamePhase === 'playing') {
            setIsPaused(true);
            setGamePhase('paused');
            clearAllTimers();
            setActiveLight(null);
        }
    }, [gamePhase, setActiveLight, setIsPaused, setGamePhase]);

    const resumeGame = useCallback(() => {
        setIsPaused(false);
        if (gamePhase === 'paused') {
            if (sequence.length > 0 && lastSequenceIndex <= sequence.length) {
                startNewRound(sequenceLength, lastSequenceIndex);
            } else {
                setGamePhase('playing');
            }
        }
    }, [gamePhase, sequence, lastSequenceIndex, sequenceLength, startNewRound, setIsPaused, setGamePhase]);

    const goToHome = useCallback(() => {
        setGamePhase('initial');
        setIsPaused(false);
        setReadyTimer('');
        clearAllTimers();
    }, [setIsPaused, setGamePhase, setReadyTimer]);

    const playAgain = useCallback(() => {
        startGame();
    }, [startGame]);

    // --- Effects ---
    // Muat high score saat komponen pertama kali di-mount
    useEffect(() => {
        const storedHighScore = localStorage.getItem('memorySequenceHighScore');
        if (storedHighScore) {
            setHighScore(parseInt(storedHighScore, 10));
        }
        return () => clearAllTimers(); // Bersihkan timer saat unmount
    }, []);

    // Kontrol border OSU
    useEffect(() => {
        if (gamePhase === 'ready') {
            setTimeout(() => setOsuBorderVisible(true), 500);
        } else if (gamePhase === 'initial' && osuBorderVisible) {
            setOsuBorderVisible(false);
        }
    }, [gamePhase, osuBorderVisible]);

    // --- Render Component ---
    return (
        <div className={`App ${gamePhase === 'ready' ? 'ready' : ''}`}>
            <h1 className="game-title">Memory Sequence</h1>

            {/* High Score Display hanya di initial screen */}
            {gamePhase === 'initial' && (
                <div className="high-score-display">High Score: {highScore}</div>
            )}
            
            {/* Initial Screen */}
            {gamePhase === 'initial' && (
                <div className="initial-screen">
                    <button className="play-button" onClick={startGame}>PLAY</button>
                </div>
            )}

            {/* Ready Phase */}
            {gamePhase === 'ready' && (
                <div className="ready-phase"><p className="ready-text">{readyTimer}</p></div>
            )}

            {/* Game Play Area */}
            {(gamePhase === 'showing' || gamePhase === 'playing' || gamePhase === 'gameOver' || gamePhase === 'paused') && (
                <>
                    <div className={`osu-border top ${osuBorderVisible ? 'osu-border-in' : ''}`}></div>
                    <div className="game-area">
                        {/* Tombol Pause hanya di phase showing atau playing */}
                        {(gamePhase === 'showing' || gamePhase === 'playing') && (
                            <button className="pause-button" onClick={togglePause}>
                                <i className="fas fa-pause"></i>
                            </button>
                        )}
                        <div className="game-info">
                            <p>Score: {score}</p>
                            <p>Level: {sequenceLength - 1}</p>
                        </div>
                        <div className="lights-grid">
                            {lightPositions.map(pos => (
                                <div
                                    key={pos}
                                    className={`light-button ${activeLight === pos ? 'active' : ''} ${gamePhase === 'playing' ? 'clickable' : ''} ${pressedLight === pos ? 'player-pressed' : ''}`}
                                    onClick={() => handleLightClick(pos)}
                                >
                                    {pos + 1}
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
                    {score === highScore && score > 0 && (
                        <p className="new-high-score">NEW HIGH SCORE!</p>
                    )}
                    <div className="game-over-buttons">
                        <button className="restart-button" onClick={playAgain}>Play Again</button>
                        <button className="home-button" onClick={goToHome}>Home</button>
                    </div>
                </div>
            )}

            {/* Pause Overlay */}
            {gamePhase === 'paused' && (
                <div className="pause-overlay">
                    <div className="pause-menu">
                        <h2>Paused</h2>
                        <button className="resume-button" onClick={resumeGame}>Resume</button>
                        <button className="home-button" onClick={goToHome}>Home</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;