import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import "./style/aqua.scss";

import GraphVisualization from "./p2p/host_nodes";

//from ip use read local ip
const P2P = () => {
  const [port, setPort] = useState("1234");
  const [dstIp, setToIp] = useState("127.0.0.1");
  const [dstPort, setToPort] = useState("12345");
  const [text, setSendText] = useState("text");
  const [viewText, setViewText] = useState("bulletin board");
  const [serverList, setServerList] = useState<string[]>([]);

  const [useUdpProtocol, setUseUdpProtocol] = useState(true);
  
  const navigate = useNavigate();

  //TODO:サーバーは0.0.0.0で固定で起動しているのでipは渡さなくて良い
  const startServer = async () => {
    try {
      let result: string;
      if (useUdpProtocol){
      	console.log(`Starting server at ${port}`);
      	result = await invoke<string>("start_server", { port });
      }else{
      	console.log(`Starting websocket server at ${port}`);
	result = await invoke<string>("start_websocket_server", {port});
      }
      setViewText(result || "Server started successfully.");
    } catch (error) {
      console.error("Server start error:", error);
      setViewText(`Server start failed: ${error}`);
    }
  };
  
  //応急処置でintervalをfrontからやっている
  setInterval(() => {
  (async () => {
    try {
      console.log(`Sending data from ${port} to ${dstIp}:${dstPort}`);
      console.log(typeof dstIp, typeof parseInt(port), typeof dstIp, typeof parseInt(dstPort));

      const result = await invoke<string>("send_text", {
        dstIp,
        dstPort: parseInt(dstPort),
        text,
      });
      setViewText(result || "Text sent successfully.");
    } catch (error) {
      console.error("Text send error:", error);
      setViewText(`Text send failed: ${error}`);
    }
  })();
}, 5000);

 
  const loadText = async () => {
    try {
      const text = await invoke<string>("rust_code");
      setViewText(text);
      console.log("Message from Rust:", text);
    } catch (error) {
      console.error("Error loading text from Rust:", error);
    }
  };

  const move_share = async (server: string) => {
 	try {
		//portがバグっているので強制的に12345を使ってもらう　８８８８とか？
		//const port = parseInt(portStr || "12345");
		const [ip] = server.split(":");
		const move_port = "1234";

		navigate("/share", {
			state: {ip, port: move_port},	
		});	
	}catch(error){
		console.log(`move_error${error}`);
	} 
  };

  const addServer = (addr: string, port: string) => {
    setServerList((prev) => {
    	const idx = prev.findIndex(entry => entry.split(":")[0] === addr);
	if(idx !== -1){
		const newList = [...prev];
		newList[idx] = `${addr}:${port}`;
		return newList;
	}else{		  
		return  [...prev, `${addr}:${port}`];
	}
    });
  };
    useEffect(() => {
    const unlisten = listen("add_server", (event: { payload: {addr: string; port: string}}) => {
      const { addr, port } = event.payload as { addr: string; port: string };
      console.log(`新しいサーバー: ${addr}:${port}`);
      addServer(addr, port);
    });

    invoke("request_server_list");
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <div style={{maxHeight: "100vh", overflowY: "auto", padding: "20px"}}>
      <a href="index.html">Back to Menu</a>
      <label style={{fontSize: "35px", display: "flex", marginTop: "2vh"}}>
      use_UDP<input 
      type="checkbox" 
      checked={useUdpProtocol}
      onChange={(e) => setUseUdpProtocol(e.target.checked)}
      style={{transform: "Scale(1)", marginLeft: "1vw"}}
      className="aqua frutiger-text"
      />
      </label>
      <h2 style={{marginTop: "5vh"}}>Setup as Server</h2>
      <div>
        <label>
          Port:
          <input className="aqua-input" value={port} onChange={(e) => setPort(e.target.value)} placeholder="1234" />
        </label>
      </div>
      <br></br>
      <button className="aqua" style={{marginLeft: "2vw"}}onClick={startServer}>Start Server</button>
      
      <br></br><br></br>
      <h2>Server List</h2>
	<div
  	style={{
    	width: "40%",
    	height: "400px",
    	overflow: "hedden",
    	border: "1px solid #ccc",
    	background: "#f9f9f9"
  	}}
	className="aqua"
	>
      	
        {serverList.length === 0 ? (
          <p>No servers available</p>
        ) : (
          <GraphVisualization nodeCount={serverList.length}
      		onNodeClick={(index: number) => {
			const server = serverList[index];	
			move_share(server);
		}} 
	 />
        )}
      </div>

      <h2>Discovered Servers</h2>
	<ul>
  	{serverList.map((server, index) => {
    	const [ip, port] = server.split(":");
    	return (
      		<li key={index}>
        	IP: {ip}, Port: {port}
      		</li>
    	);
  	})}
	</ul>
      

      <br></br><br></br>
      <h2>P2P Channel</h2>
      <div>
        <button className="aqua" onClick={loadText}>Load Bulletin Board(not impl)</button>
        <p>{viewText}</p>
      </div>

      <br></br>
      <h2>Client</h2>
      <h2 style={{marginLeft: "40vw"}}>Send Text Content:</h2>
      <div>
        <label>
          To IP:
          <input className="aqua-input" value={dstIp} onChange={(e) => setToIp(e.target.value)} placeholder="127.0.0.1" />
        </label>
        <label>
          To Port:
          <input className="aqua-input" value={dstPort} onChange={(e) => setToPort(e.target.value)} placeholder="1234" />
        </label>
        <label>
          <input className="aqua-input" style={{marginLeft: "5vw"}}value={text} onChange={(e) => setSendText(e.target.value)} placeholder="hello" />
        </label>
      </div>
      <br></br><br></br><br></br><br></br>
    </div>
  );
};

export default P2P;

