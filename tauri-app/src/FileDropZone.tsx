import React, { useEffect, useState } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview'; 

interface DragDropPayload {
  type: 'over' | 'drop' | 'cancel' | 'enter' | 'leave';
  position?: { x: number; y: number };
  paths?: string[];
}

interface FileDropZoneProps {
  filePath: string | null;
  errorMessage: string | null;
  onFileDrop: (paths: string[]) => void;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ filePath, errorMessage, onFileDrop }) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const setupDragDropListener = async () => {
      // getCurrentWebview().onDragDropEvent の引数の型を明示的に指定
      const unlisten = await getCurrentWebview().onDragDropEvent((event: { payload: DragDropPayload }) => {
        const payload = event.payload;

        if (payload.type === 'over') {
          setIsHovered(true);
          console.log('File Hovered (via onDragDropEvent)', payload.position);
        } else if (payload.type === 'drop') {
          setIsHovered(false);
          console.log('File Dropped (via onDragDropEvent)', payload.paths);
          if (payload.paths) {
            onFileDrop(payload.paths);
          }
        } else if (payload.type === 'cancel') { 
          setIsHovered(false);
          console.log('File Drop Cancelled (via onDragDropEvent)');
        }
      });
      return unlisten;
    };

    let cleanupFunction: (() => void) | undefined;
    setupDragDropListener().then((unlistenFn) => {
      cleanupFunction = unlistenFn;
    });

    // クリーンアップ
    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [onFileDrop]);

  return (
    <div
      className={`aqua border-2 border-dashed px-10 py-4 text-center w-full transition-colors ${
        isHovered ? 'border-gray-500 bg-gray-100' : 'border-gray-300'
      }`}
    >
      <div className='aqua min-h-24 flex flex-col justify-center items-center'>
        {filePath ? (
          <p style={{color: "black"}}>{filePath}</p>
        ) : (
          <p style={{color: "black"}}>File Drop Here</p>
        )}
        {errorMessage && (
          <p style={{color: "black"}} className="text-red-500 text-center pt-2">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};

export default FileDropZone;
