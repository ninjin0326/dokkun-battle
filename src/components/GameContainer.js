import React, { useState, useEffect, useRef } from "react";
import HeartDataGraph from "./HeartDataGraph";
import GameCanvas from "./GameCanvas";
import HeartAnimation from "./HeartAnimation";
import BluetoothManager from "./BluetoothManager";
import GameControls from "./GameControls";
import SpaceInvadersGame from "../utils/SpaceInvadersGame";

const GameContainer = () => {
  const [gameState, setGameState] = useState("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [heartData, setHeartData] = useState([]);
  const [currentValue, setCurrentValue] = useState(0);
  const [beatCount, setBeatCount] = useState(0);
  const [threshold, setThreshold] = useState(1800);
  const [preparationTime, setPreparationTime] = useState(10);
  const [gameTime, setGameTime] = useState(0);

  const gameRef = useRef(null);
  const gameCanvasRef = useRef(null);
  const bluetoothRef = useRef(null);

  useEffect(() => {
    if (gameCanvasRef.current && !gameRef.current) {
      gameRef.current = new SpaceInvadersGame({
        canvasRef: gameCanvasRef,
        onStateChange: handleGameStateChange,
        onScoreChange: setScore,
        onLivesChange: setLives,
        onGameTimeChange: setGameTime,
        onBeatDetected: handleBeatDetected,
        threshold: threshold,
      });

      // キャンバスを設定してプレイヤーを作成
      gameRef.current.setCanvas(gameCanvasRef.current);
      gameRef.current.createPlayerSVG();
    }
  }, [gameCanvasRef.current]);

  const handleGameStateChange = (newState) => {
    setGameState(newState);
  };

  const handleBeatDetected = () => {
    setBeatCount((prev) => prev + 1);
    if (gameRef.current) {
      gameRef.current.onHeartBeat();
    }
  };

  const handleHeartDataUpdate = (data) => {
    setCurrentValue(data);
    setHeartData((prev) => {
      const newData = [...prev, data];
      return newData.length > 100 ? newData.slice(-100) : newData;
    });

    if (gameRef.current) {
      gameRef.current.updateHeartData(data);
    }
  };

  const handleBluetoothConnect = () => {
    setIsBluetoothConnected(true);
  };

  const handleBluetoothDisconnect = () => {
    setIsBluetoothConnected(false);
  };

  const handleThresholdChange = (newThreshold) => {
    setThreshold(newThreshold);
    if (gameRef.current) {
      gameRef.current.setThreshold(newThreshold);
    }
  };

  const startGame = () => {
    if (gameRef.current && isBluetoothConnected) {
      gameRef.current.startGame();
    }
  };

  const pauseGame = () => {
    if (gameRef.current) {
      gameRef.current.togglePause();
    }
  };

  const restartGame = () => {
    if (gameRef.current) {
      gameRef.current.restartGame();
    }
    setBeatCount(0);
    setGameTime(0);
  };

  const renderLives = () => {
    const hearts = [];
    for (let i = 0; i < lives; i++) {
      hearts.push(
        <svg
          key={i}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          style={{ marginLeft: "5px" }}
        >
          <path
            d="M10 17l-1.5-1.4C3.8 11.4 1 8.1 1 4.5 1 2 3 0 5.5 0S10 2 10 4.5c0 0 0 0 10-4.5S19 0 19 2c2.5 0 4.5 2 4.5 4.5 0 3.6-2.8 6.9-7.5 11.1L10 17z"
            fill="#ff6666"
          />
        </svg>
      );
    }
    return hearts;
  };

  return (
    <div className="game-container">
      <div className="game-info">
        <div className="score">
          タイム: <span>{gameTime}秒</span>
        </div>
        <div className="lives">
          ライフ <span>{renderLives()}</span>
        </div>
      </div>

      <div className="game-main">
        <div className="left-panel">
          <h3>心拍データ</h3>
          <HeartDataGraph
            data={heartData}
            currentValue={currentValue}
            threshold={threshold}
          />
          <div className="current-value">
            現在値: <span className="value-text">{currentValue || "--"}</span>
          </div>
        </div>

        <div className="center-panel">
          <GameCanvas
            ref={gameCanvasRef}
            gameState={gameState}
            preparationTime={preparationTime}
          />
        </div>

        <div className="right-panel">
          <h3>ドックン</h3>
          <HeartAnimation beatCount={beatCount} />
          <div className="beat-counter">
            ドックン回数: <span className="beat-count">{beatCount}</span>
          </div>
        </div>
      </div>

      <BluetoothManager
        ref={bluetoothRef}
        onConnect={handleBluetoothConnect}
        onDisconnect={handleBluetoothDisconnect}
        onDataReceived={handleHeartDataUpdate}
        threshold={threshold}
        onThresholdChange={handleThresholdChange}
      />

      <GameControls
        gameState={gameState}
        isBluetoothConnected={isBluetoothConnected}
        onStartGame={startGame}
        onPauseGame={pauseGame}
        onRestartGame={restartGame}
      />

      {gameState === "gameOver" && (
        <div className="game-over">
          <h2>ゲームオーバー</h2>
          <p>タイム: {gameTime}秒</p>
          <p>ドックン回数: {beatCount}回</p>
          <button className="restart-button" onClick={restartGame}>
            もう一度プレイ
          </button>
        </div>
      )}

      {gameState === "win" && (
        <div className="game-over win">
          <h2>クリア！</h2>
          <p>タイム: {gameTime}秒</p>
          <p>ドックン回数: {beatCount}回</p>
          <button className="restart-button" onClick={restartGame}>
            もう一度プレイ
          </button>
        </div>
      )}
    </div>
  );
};

export default GameContainer;
