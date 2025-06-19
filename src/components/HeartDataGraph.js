import React, { useRef, useEffect } from 'react';

const HeartDataGraph = ({ data, currentValue, threshold }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        drawGraph();
    }, [data, threshold]);

    const drawGraph = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // キャンバスをクリア
        ctx.clearRect(0, 0, width, height);

        // 背景を塗りつぶし
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, width, height);

        // グリッドを描画
        drawGrid(ctx, width, height);

        // しきい値の線を描画
        drawThresholdLine(ctx, width, height, threshold);

        // データラインを描画
        if (data.length > 1) {
            drawDataLine(ctx, width, height, data);
        }

        // 現在値を表示
        if (currentValue) {
            drawCurrentValue(ctx, width, height, currentValue);
        }
    };

    const drawGrid = (ctx, width, height) => {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;

        // 横線
        for (let y = 0; y < height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // 縦線
        for (let x = 0; x < width; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    };

    const drawThresholdLine = (ctx, width, height, threshold) => {
        if (!threshold) return;

        const y = height - ((threshold - 1500) / 1000) * height;
        
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        
        ctx.setLineDash([]);

        // しきい値の数値を表示
        ctx.fillStyle = '#ff6666';
        ctx.font = '12px Arial';
        ctx.fillText(`閾値: ${threshold}`, 5, y - 5);
    };

    const drawDataLine = (ctx, width, height, data) => {
        if (data.length < 2) return;

        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const maxDataPoints = Math.floor(width / 3);
        const displayData = data.slice(-maxDataPoints);
        
        displayData.forEach((value, index) => {
            const x = (index / (displayData.length - 1)) * width;
            const y = height - ((value - 1500) / 1000) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // データポイントを描画
        ctx.fillStyle = '#00ffff';
        displayData.forEach((value, index) => {
            const x = (index / (displayData.length - 1)) * width;
            const y = height - ((value - 1500) / 1000) * height;
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fill();
        });
    };

    const drawCurrentValue = (ctx, width, height, currentValue) => {
        const y = height - ((currentValue - 1500) / 1000) * height;
        
        // 現在値のポイント
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(width - 5, y, 4, 0, 2 * Math.PI);
        ctx.fill();

        // 現在値の数値を表示
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px Arial';
        ctx.fillText(currentValue.toString(), width - 50, y - 10);
    };

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={200}
            className="heart-data-graph"
        />
    );
};

export default HeartDataGraph; 