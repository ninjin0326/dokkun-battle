import React, { forwardRef, useEffect, useRef } from "react";

const GameCanvas = forwardRef(({ gameState, preparationTime }, ref) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (ref) {
      ref.current = svgRef.current;
    }
  }, []);

  const createStars = () => {
    const stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push(
        <circle
          key={i}
          cx={Math.random() * 800}
          cy={Math.random() * 600}
          r={Math.random() * 1.5 + 0.5}
          fill="#ffffff"
          className="star"
          style={{
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      );
    }
    return stars;
  };

  const renderPreparationScreen = () => {
    if (gameState !== "preparation") return null;

    return (
      <g id="preparationScreen">
        <rect width="800" height="600" fill="rgba(0, 0, 0, 0.8)" />
        <text
          x="400"
          y="250"
          textAnchor="middle"
          fill="#ffff00"
          fontSize="48"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
        >
          準備時間
        </text>
        <text
          x="400"
          y="320"
          textAnchor="middle"
          fill="#ff6666"
          fontSize="72"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
        >
          {preparationTime}
        </text>
        <text
          x="400"
          y="380"
          textAnchor="middle"
          fill="#00ffff"
          fontSize="24"
          fontFamily="Arial, sans-serif"
        >
          心拍数を上げてください！
        </text>
      </g>
    );
  };

  const renderMenuScreen = () => {
    if (gameState !== "menu") return null;

    return (
      <g id="menuScreen">
        <rect width="800" height="600" fill="rgba(0, 0, 0, 0.8)" />
        <text
          x="400"
          y="200"
          textAnchor="middle"
          fill="#00ffff"
          fontSize="48"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
        >
          ドックンバトル
        </text>
        <text
          x="400"
          y="300"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="24"
          fontFamily="Arial, sans-serif"
        >
          Bluetooth接続してゲーム開始
        </text>
        <text
          x="400"
          y="400"
          textAnchor="middle"
          fill="#ffff00"
          fontSize="18"
          fontFamily="Arial, sans-serif"
        >
          心拍で弾を撃って敵を倒そう！
        </text>
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      id="gameCanvas"
      width="800"
      height="600"
      viewBox="0 0 800 600"
      className="game-canvas"
    >
      {/* 背景 */}
      <rect width="800" height="600" fill="#000011" />

      {/* 星背景 */}
      <g id="stars">{createStars()}</g>

      {/* ゲーム要素 */}
      <g id="player"></g>
      <g id="playerBullets"></g>
      <g id="enemies"></g>
      <g id="enemyBullets"></g>
      <g id="explosions"></g>

      {/* UI画面 */}
      {renderMenuScreen()}
      {renderPreparationScreen()}
    </svg>
  );
});

GameCanvas.displayName = "GameCanvas";

export default GameCanvas;
