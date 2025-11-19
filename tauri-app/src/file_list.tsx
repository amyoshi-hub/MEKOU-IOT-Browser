//これは多分ダミーやどこからも呼ばれていない　share.tsxがこの役割を持っている

import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

type ServerInfo = {
  ip: string;
  port: number;
};

const FileDownloaderPage: React.FC = () => {
  const [fileList, setFileList] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("Click the button to load files.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ファイルリストを取得
  const loadFiles = async (server?: ServerInfo) => {
    setStatusMessage("Loading files...");
    setErrorMessage(null);
    try {
      let files: string[] = [];
      if (server) {
        const url = `http://${server.ip}:${server.port}/share/files.json`;
        const res = await fetch(url);
        files = await res.json();
      } else {
        files = await invoke("get_file_list");
      }
      setFileList(files);
      setStatusMessage("Files loaded successfully.");
    } catch (error) {
      console.error("Failed to load files:", error);
      setErrorMessage("Failed to load files from the directory.");
      setStatusMessage("Loading files failed.");
    }
  };

  // ファイルを読み取り、ダウンロードリンクを作成
  const downloadFile = async (filePath: string, server?: ServerInfo) => {
    setStatusMessage(`Downloading ${filePath}...`);
    try {
      let blob: Blob;

      if (server) {
        const url = `http://${server.ip}:${server.port}/share/${filePath}`;
        const res = await fetch(url);
        blob = await res.blob(); // ここが重要
      } else {
        const fileContent: string = await invoke("read_file_content", { filePath });
        blob = new Blob([fileContent], { type: "text/plain" }); // 必要に応じてMIME変更
      }

      // Blobをダウンロードリンクに変換してクリック
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filePath.split("/").pop() || "downloaded_file";
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage(`${filePath} downloaded successfully.`);
    } catch (error) {
      console.error("Failed to download file:", error);
      setErrorMessage(`Failed to download ${filePath}.`);
    }
  };

  return (
    <div>
      <h3>Files</h3>
      <button className="aqua" onClick={() => loadFiles()}>Load Local Files</button>
      <ul>
        {fileList.map((file, idx) => (
          <li key={idx}>
            {file}
            <button className="aqua" onClick={() => downloadFile(file)}>Download</button>
          </li>
        ))}
      </ul>
      <p>{statusMessage}</p>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
    </div>
  );
};

export default FileDownloaderPage;

