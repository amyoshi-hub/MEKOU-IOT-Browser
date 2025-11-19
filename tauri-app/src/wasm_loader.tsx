// src/WasmLoaderPage.tsx (Renamed or concept changed to WorldAdderPage.tsx in practice)
import React, { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core'; // For invoke to Rust commands
import FileDropZone from './FileDropZone';
import { useNavigate } from 'react-router-dom'; // Assuming you use react-router-dom for navigation

const WasmLoaderPage: React.FC = () => {
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('（zip or folder）Drag here');
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // エラーメッセージ用

    const navigate = useNavigate(); // For navigation after success

    const handleFileDropped = useCallback(async (paths: string[]) => {
        if (paths.length === 0) {
            setErrorMessage('file was not droped');
            setCurrentFilePath(null);
            return;
        }

        const droppedFilePath = paths[0]; // ドロップされた最初のファイルパスを取得
        setCurrentFilePath(droppedFilePath);
        setStatusMessage('File Loading..');
        setErrorMessage(null); // エラーをリセット

        // ファイル名からワールド名を仮決定
        // WindowsとUnix-likeパスの両方に対応
        const fileName = droppedFilePath.split(/[\\/]/).pop();
        let defaultWorldName = fileName ? fileName.split('.')[0] : 'Unnamed_World';

        // ユーザーにワールド名を入力してもらう
        const worldName = prompt('Input This World Name:', defaultWorldName) || defaultWorldName;

        try {
            // Rustコマンド 'process_and_add_world' を呼び出す
            // 引数名が Rust 側の関数と一致していることを確認
            const entryPointPath: string = await invoke("process_and_add_world", {
                sourcePath: droppedFilePath, // 正しい変数名に修正
                worldName: worldName,
            });

            setStatusMessage(`'${worldName}' was added success！entry point: ${entryPointPath}`);
            console.log('World added successfully. Entry point:', entryPointPath);

            // 成功後、ワールドリストページなどへ自動遷移するのも良いでしょう
            // 例: setTimeout(() => navigate('/worlds'), 2000); // 2秒後に/worldsへ
            alert(`'${worldName}' was added success!\n Back to manu, and execute by World List`);
            navigate('/'); // メニューに戻るか、ワールドリストページに遷移

        } catch (error) {
            console.error("World added was success:", error);
            setErrorMessage(`World added was failed`);
            setStatusMessage('failed to process');
        }
    }, [navigate]); // navigateを依存配列に追加

    return (
        <div
            style={{
                minHeight: '300px',
                width: '80%',
                margin: '0 auto',
                backgroundColor: "green", // 背景色
                padding: '20px',
                boxSizing: 'border-box'
            }}
        >
            <a href="/">Back to Menu</a> {/* トップページへのリンク */}
            <h2 style={{ color: "black" }}>Registration New World</h2>

            <FileDropZone
                filePath={currentFilePath}
                errorMessage={errorMessage} // エラーメッセージを渡す
                onFileDrop={handleFileDropped}
            />

            <p style={{ marginTop: '20px', color: 'black' }}>{statusMessage}</p>
            {errorMessage && (
                <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {errorMessage}</p>
            )}

            {currentFilePath && (
                <p style={{ marginTop: '10px', color: 'black' }}>Droped file: {currentFilePath}</p>
            )}
        </div>
    );
};

export default WasmLoaderPage;
