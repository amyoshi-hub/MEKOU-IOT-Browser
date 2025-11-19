import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLocation }  from "react-router-dom";

type ServerInfo = {
	ip: string;
	port: string;
}

const Share: React.FC = () => {
  // Stateでfilesを管理
  const [files, setFiles] = useState<string[]>([]);
  const location = useLocation();
  const { ip, port } = location.state as ServerInfo;
  const urlBase = `http://${ip}:${port}`;

  const openNewWindow = async () => {
    try {
      const serverUrl: string = await invoke("http_server");
      console.log("Server started at:", serverUrl);
      await invoke("open_url_window", { url: urlBase });
    } catch (e) {
      console.error("Failed to open new window:", e);
    }
  };

  const loadFileList = async () => {
    try {
      console.log("json parse");
      const fetchedFiles: string[] = await invoke("fetch_file_list", { url: `${urlBase}/share/files.json` });
      console.log("取得したファイルリスト:", fetchedFiles);
      setFiles(fetchedFiles); // Stateにセット
    } catch (error) {
      console.error("取得失敗", error);
    }
  };

  //生のままだとデータがテキストで入るのでbase64に変える
  const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
  };

  const getMimeType = (fileName: string): string => {
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".gif")) return "image/gif";
  if (fileName.endsWith(".txt")) return "text/plain";
  if (fileName.endsWith(".html")) return "text/html";
  if (fileName.endsWith(".json")) return "application/json";
  if (fileName.endsWith(".pdf")) return "application/pdf";
  if (fileName.endsWith(".zip")) return "application/zip";
  return "application/octet-stream"; // デフォルト（バイナリ）
  };

  const requestFile = async (fileName: string) => {
  try {
    console.log(`Requesting file: ${fileName}`);
    const base64Data: string = await invoke("request_file", { fileName, ip });
    const fileContent = base64ToUint8Array(base64Data);

    const blob = new Blob([fileContent], { type: getMimeType(fileName) });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = encodeURIComponent(fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
    	URL.revokeObjectURL(url);
	console.log('blob url revoke');
    }, 1000);

    console.log(`File ${fileName} downloaded successfully.`);
  } catch (error) {
    console.error(`Failed to download file: ${fileName}`, error);
  }
  };
  
  return (
    <div>
      <a href="index.html">Back to Menu</a>

      <h1>HTTP File Server</h1>
      <button className="aqua" onClick={openNewWindow}>Start Server and Open</button>
      <button className="aqua" onClick={loadFileList}>Load File List</button>
      <div>
        {files.map((file) => (
          <button key={file} onClick={() => requestFile(file)}>
            {file}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Share;

