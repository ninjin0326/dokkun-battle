import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
} from "react";

const BluetoothManager = forwardRef(
  (
    { onConnect, onDisconnect, onDataReceived, threshold, onThresholdChange },
    ref
  ) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [showThresholdControl, setShowThresholdControl] = useState(false);

    const deviceRef = useRef(null);
    const characteristicRef = useRef(null);
    const dataArrayRef = useRef([]);
    const prevFilteredRef = useRef(0);
    const lastBeatTimeRef = useRef(0);
    const aboveThresholdRef = useRef(false);

    // 接続するBluetooth機器の情報
    const DEVICE_NAME = "ESP32";
    const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
    const CHARACTERISTIC_UUID = "abcdefab-1234-1234-1234-abcdefabcdef";
    const ALPHA = 0.4;

    useImperativeHandle(ref, () => ({
      connectToBluetooth,
      disconnectBluetooth,
      sendToESP,
      sendStart,
      sendStop,
    }));

    const connectToBluetooth = async () => {
      if (!navigator.bluetooth) {
        alert("このブラウザはWeb Bluetooth APIをサポートしていません。");
        return;
      }

      try {
        setIsConnecting(true);

        // デバイスを検索
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ name: DEVICE_NAME }],
          optionalServices: [SERVICE_UUID],
        });

        deviceRef.current = device;

        // 切断イベントリスナーを追加
        device.addEventListener("gattserverdisconnected", handleDisconnected);

        // GATTサーバーに接続
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        const characteristic = await service.getCharacteristic(
          CHARACTERISTIC_UUID
        );

        characteristicRef.current = characteristic;

        // 通知を開始
        await characteristic.startNotifications();
        characteristic.addEventListener(
          "characteristicvaluechanged",
          handleNotify
        );

        setIsConnected(true);
        setShowThresholdControl(true);
        setIsConnecting(false);

        if (onConnect) {
          onConnect();
        }

        console.log("Bluetooth接続成功");
      } catch (error) {
        console.error("Bluetooth接続エラー:", error);
        setIsConnecting(false);
        alert("Bluetooth接続に失敗しました: " + error.message);
      }
    };

    const disconnectBluetooth = () => {
      if (deviceRef.current && deviceRef.current.gatt.connected) {
        deviceRef.current.gatt.disconnect();
      }
      handleDisconnected();
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setShowThresholdControl(false);
      deviceRef.current = null;
      characteristicRef.current = null;

      if (onDisconnect) {
        onDisconnect();
      }

      console.log("Bluetooth接続が切断されました");
    };

    const handleNotify = (event) => {
      const value = event.target.value;
      const data = new Uint8Array(value.buffer);

      // データを文字列として読み取り
      const decoder = new TextDecoder();
      const stringData = decoder.decode(data);

      try {
        const numericValue = parseInt(stringData.trim());
        if (!isNaN(numericValue)) {
          addData(numericValue);
          detectBeat(numericValue);

          if (onDataReceived) {
            onDataReceived(numericValue);
          }
        }
      } catch (error) {
        console.error("データ解析エラー:", error);
      }
    };

    const addData = (data) => {
      dataArrayRef.current.push(data);
      if (dataArrayRef.current.length > 100) {
        dataArrayRef.current.shift();
      }
    };

    const detectBeat = (value) => {
      const filtered = lowPassFilter(value);
      const now = Date.now();

      if (filtered > threshold && !aboveThresholdRef.current) {
        aboveThresholdRef.current = true;

        // 前回の心拍から一定時間経過している場合のみカウント
        if (now - lastBeatTimeRef.current > 300) {
          lastBeatTimeRef.current = now;
          // 心拍検出時の処理はGameContainerで行う
        }
      } else if (filtered <= threshold) {
        aboveThresholdRef.current = false;
      }
    };

    const lowPassFilter = (currentValue) => {
      const filtered =
        ALPHA * currentValue + (1 - ALPHA) * prevFilteredRef.current;
      prevFilteredRef.current = filtered;
      return filtered;
    };

    const sendToESP = async (text) => {
      if (!characteristicRef.current) return;

      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        await characteristicRef.current.writeValue(data);
      } catch (error) {
        console.error("データ送信エラー:", error);
      }
    };

    const sendStart = async () => {
      await sendToESP("START");
    };

    const sendStop = async () => {
      await sendToESP("STOP");
    };

    const handleThresholdChange = (event) => {
      const newThreshold = parseInt(event.target.value);
      if (onThresholdChange) {
        onThresholdChange(newThreshold);
      }
    };

    return (
      <div className="bluetooth-controls">
        <button
          className="connect-bluetooth-button"
          onClick={isConnected ? disconnectBluetooth : connectToBluetooth}
          disabled={isConnecting}
        >
          {isConnecting
            ? "接続中..."
            : isConnected
            ? "Bluetooth切断"
            : "Bluetooth接続"}
        </button>

        {showThresholdControl && (
          <div className="threshold-control">
            <label htmlFor="thresholdSlider">心拍しきい値: </label>
            <input
              type="range"
              id="thresholdSlider"
              className="threshold-slider"
              min="1600"
              max="2000"
              value={threshold}
              step="1"
              onChange={handleThresholdChange}
            />
            <span className="threshold-value">{threshold}</span>
          </div>
        )}
      </div>
    );
  }
);

BluetoothManager.displayName = "BluetoothManager";

export default BluetoothManager;
