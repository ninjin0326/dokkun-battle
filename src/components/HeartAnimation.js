import React, { useRef, useEffect, useState } from "react";

const HeartAnimation = ({ beatCount }) => {
  const canvasRef = useRef(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (beatCount > 0) {
      playHeartAnimation();
    }
  }, [beatCount]);

  const playHeartAnimation = async () => {
    if (isAnimating) return;

    setIsAnimating(true);

    // アニメーションフレームを順番に表示
    for (let frame = 0; frame < 7; frame++) {
      setAnimationFrame(frame);
      await wait(80);
    }

    // 最初のフレームに戻る
    setAnimationFrame(0);
    setIsAnimating(false);
  };

  const wait = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  useEffect(() => {
    drawHeart();
  }, [animationFrame]);

  const drawHeart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // キャンバスをクリア
    ctx.clearRect(0, 0, width, height);

    // 背景を塗りつぶし
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, width, height);

    // ハート形状を描画
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 0.5 + (animationFrame / 6) * 0.5; // 0.5から1.0まで
    const heartSize = 80 * scale;

    drawHeartShape(ctx, centerX, centerY, heartSize, "#ff6666");
  };

  const drawHeartShape = (ctx, x, y, size, color) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 80, size / 80);

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // ハート形状の描画
    ctx.moveTo(0, 15);
    ctx.bezierCurveTo(-50, -40, -90, 10, 0, 50);
    ctx.bezierCurveTo(90, 10, 50, -40, 0, 15);
    ctx.fill();

    ctx.restore();
  };

  return (
    <canvas ref={canvasRef} width={256} height={256} className="heart-canvas" />
  );
};

export default HeartAnimation;
