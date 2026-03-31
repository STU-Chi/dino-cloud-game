import { useState } from "react";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("menu");
  const [espConnected, setEspConnected] = useState(false);

  return (
    <div className="app">
      {screen === "menu" && (
        <div className="menu">
          <h1>Dino Runner</h1>

          <button onClick={() => setScreen("game")}>
            手機遊玩
          </button>

          <button
            onClick={() => {
              if (!espConnected) {
                alert("ESP32 未連線！");
                return;
              }
              setScreen("game");
            }}
          >
            ESP32 遊玩
          </button>

          {/* 左下角設定 */}
          <div className="settings">⚙️</div>

          {/* 右下角狀態 */}
          <div className="status">
            {espConnected ? "✅" : "❌"}
          </div>
        </div>
      )}

      {screen === "game" && (
        <div className="game">
          <h2>遊戲開始！</h2>
          <button onClick={() => setScreen("menu")}>
            返回
          </button>
        </div>
      )}
    </div>
  );
}