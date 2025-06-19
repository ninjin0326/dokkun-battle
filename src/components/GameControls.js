import React from "react";

const GameControls = ({
  gameState,
  isBluetoothConnected,
  onStartGame,
  onPauseGame,
  onRestartGame,
}) => {
  const getStartButtonText = () => {
    if (!isBluetoothConnected) {
      return "Bluetooth接続後にゲーム開始";
    }
    if (gameState === "menu") {
      return "ゲーム開始";
    }
    if (gameState === "playing") {
      return "ポーズ";
    }
    if (gameState === "paused") {
      return "再開";
    }
    return "ゲーム開始";
  };

  const handleMainButtonClick = () => {
    if (!isBluetoothConnected) return;

    if (gameState === "menu") {
      onStartGame();
    } else if (gameState === "playing" || gameState === "paused") {
      onPauseGame();
    }
  };

  return (
    <div className="game-controls">
      <div className="instructions">
        <p>操作方法:</p>
        <p>← → : 左右移動</p>
        <p>心拍で弾発射</p>
        <p>P : ポーズ</p>
        <p>C : 当たり判定表示切り替え（デバッグ用）</p>
        <p>Enter : ゲームオーバー時リスタート</p>
        <p style={{ color: "#ffff00", fontWeight: "bold" }}>
          ※ゲーム開始前に10秒間の心拍数上げタイムがあります
        </p>
      </div>

      <button
        id="startButton"
        onClick={handleMainButtonClick}
        disabled={!isBluetoothConnected}
        style={{
          opacity: isBluetoothConnected ? 1 : 0.5,
          cursor: isBluetoothConnected ? "pointer" : "not-allowed",
        }}
      >
        {getStartButtonText()}
      </button>

      {(gameState === "gameOver" || gameState === "win") && (
        <button className="restart-button" onClick={onRestartGame}>
          もう一度プレイ
        </button>
      )}
    </div>
  );
};

export default GameControls;
