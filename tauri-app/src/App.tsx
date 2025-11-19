import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const App: React.FC = () => {
  const [url, setUrl] = useState("");
  const [useIframe, setUseIframe] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      switchMode();
      window.location.href = url;
    }
  };

  const switchMode = () => {
    const newMode = !useIframe;
    setUseIframe(newMode);
  };

  const loadP2PPage = () => {
	  navigate("/p2p");
  };

  const loadTaskPage = () => {
	  navigate("/task"); 
  };

  const loadWorldPage = () => {
	  navigate("/world_page");
  };

return (
<div>
  <div className="flex space-x-2">
  <br />
  <span className="shine-text">OSAI</span>
  <br />
  <br></br>
    <input
      type="text"
      value={url}
      onChange={handleInputChange}
      onKeyDown={handleInputKeyDown}
      placeholder="INPUT URL"
      style={{marginLeft: "2vw"}}
      className="aqua-input"
    />
    <button className="aqua" style={{marginLeft: "1vw"}} onClick={loadP2PPage}>P2P</button>
    <button className="aqua" style={{marginLeft: "1vw"}} onClick={loadWorldPage}>WORLD_SELECT</button>
    <button className="aqua" onClick={loadTaskPage}>Task</button>

  <button
  onClick={() => setMenuOpen(!menuOpen)}
  style={{marginLeft: "87vw"}}
  className="hamburger"
  >
   ☰
  </button>

  {menuOpen && (
    <div style={{marginLeft: "85vw"}}>
      <ul className="space-y-2">
        <button className="aqua" onClick={loadWorldPage}>WORLD_SELECT</button>
	<br></br><br></br>
        <button className="aqua" onClick={loadP2PPage}>P2P</button>
	<br></br><br></br>
        <button className="aqua" onClick={() => alert("セキュリティ設定 未実装")}>SECURITY</button>
	<br></br><br></br>
        <button className="aqua" onClick={() => alert("セキュリティ設定 未実装")}>SETING</button>
	<br></br><br></br>
      </ul>
    </div>
  )}
  </div>

</div>
);
}
export default App;
