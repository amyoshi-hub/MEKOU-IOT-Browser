import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core"; // Tauri v2 core invokeを使用

// 💡 注意: "../App.css" のインポートはビルドエラーを避けるために削除しました。
// 💡 代わりにTailwind CSSのクラスを積極的かつ明確に使用しています。

// タスクデータの型定義 (フロントエンドでの表示用。Rust側のTask構造体と対応)
interface Task {
  datetime: string; // YYYY-MM-DD:HH:MM
  name: string;
  notified: boolean;
}

// 現在の日付と時刻をISO形式で取得し、デフォルト値として設定
const getTodayDate = () => new Date().toISOString().split('T')[0];
const getCurrentTime = () => {
    const now = new Date();
    // 時刻を HH:MM 形式で取得 (padStartでゼロ埋め)
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};


const TaskPage: React.FC = () => {
  // 状態管理
  const [dateInput, setDateInput] = useState(getTodayDate()); // 日付入力
  const [timeInput, setTimeInput] = useState(getCurrentTime()); // 時刻入力
  const [taskNameInput, setTaskNameInput] = useState(""); // タスク名入力 (純粋なテキスト)
  
  const [tasksOutput, setTasksOutput] = useState("Loading tasks...");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // --- 1. タスクのロードと表示 (Rustバックエンドの `show_tasks` を呼び出す) ---
  const loadTasks = useCallback(async () => {
    try {
      // Rustの main.rs で #[tauri::command] show_tasks が定義されていることを前提とする
      const output: string = await invoke("show_tasks");
      setTasksOutput(output);
    } catch (e) {
      console.error("Failed to load tasks:", e);
      setTasksOutput("Failed to load tasks.");
      setMessage(`Error loading tasks: ${e}`);
    }
  }, []);

  // 初期ロードと自動更新 (5秒ごとにタスクを再ロード)
  useEffect(() => {
    loadTasks();
    
    const interval = setInterval(() => {
      loadTasks();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadTasks]);

  // --- 2. 新しいタスクの追加 (Rustバックエンドの `task` コマンドを呼び出す) ---
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 入力値のバリデーション
    if (!dateInput || !timeInput || !taskNameInput.trim()) {
      setMessage("日付、時刻、およびタスク名をすべて入力してください。");
      return;
    }

    // 💡 改善点: 3つの入力値を組み合わせて CLI コマンド文字列を自動生成
    // 期待されるフォーマット: YYYY-MM-DD:HH:MM:Task Name
    const datetimeStr = `${dateInput}:${timeInput}`;
    const taskCommand = `task ${datetimeStr}:${taskNameInput.trim()}`;
    
    setLoading(true);
    setMessage(`Adding task: ${taskCommand}...`);

    try {
      // Rustの main.rs で #[tauri::command] run_cli_command が定義されていることを前提とする
      // このコマンドがローカルタスクリストにスケジュールするか、P2Pで送信するかはRust側の実装に依存
      const result: string = await invoke("run_cli_command", { command: taskCommand }); 
      
      // Rust側から返された結果メッセージを表示
      setMessage(`Task added: ${result}`);
      // 入力フィールドをクリア (日付と時刻はそのまま残しても良いが、ここではタスク名のみクリア)
      setTaskNameInput(""); 
      loadTasks(); // タスクリストを更新
    } catch (e: any) {
      console.error("Failed to add task:", e);
      // Rust側のエラー処理を適切に捕捉
      setMessage(`Error adding task: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <a href="/index.html" className="text-blue-400 hover:text-blue-200 transition-colors block mb-6 text-sm">メニューに戻る</a>
        
        <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
          Task Scheduler
        </h1>
        
        <div className="mb-10 p-5 border border-gray-700 rounded-xl bg-gray-800 shadow-2xl">
          <h2 className="text-2xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">新規タスクの追加</h2>
          <form onSubmit={handleAddTask} className="flex flex-col space-y-4">
            
            {/* 💡 改善された入力フィールド: 日付と時刻 */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <label className="flex flex-col text-sm font-medium w-full sm:w-1/3">
                    実行日付:
                    <input
                        type="date"
                        value={dateInput}
                        onChange={(e) => setDateInput(e.target.value)}
                        className="p-3 rounded-xl bg-gray-700 text-white border border-transparent focus:border-blue-400 outline-none transition-all duration-300 shadow-inner mt-1"
                        disabled={loading}
                        required
                    />
                </label>
                <label className="flex flex-col text-sm font-medium w-full sm:w-1/3">
                    実行時刻:
                    <input
                        type="time"
                        value={timeInput}
                        onChange={(e) => setTimeInput(e.target.value)}
                        className="p-3 rounded-xl bg-gray-700 text-white border border-transparent focus:border-blue-400 outline-none transition-all duration-300 shadow-inner mt-1"
                        disabled={loading}
                        required
                    />
                </label>
            </div>

            {/* 💡 改善された入力フィールド: タスク名 */}
            <label className="flex flex-col text-sm font-medium">
                タスク名 / コマンド:
                <input
                    type="text"
                    value={taskNameInput}
                    onChange={(e) => setTaskNameInput(e.target.value)}
                    placeholder="実行するコマンドまたはタスク名 (例: 部屋のライトON)"
                    className="p-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 border border-transparent focus:border-blue-400 outline-none transition-all duration-300 shadow-inner mt-1 flex-grow"
                    disabled={loading}
                    required
                />
            </label>
            
            <button 
              type="submit" 
              className="w-full px-6 py-3 rounded-xl font-bold bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 mt-4" 
              disabled={loading}
            >
              {loading ? "処理中..." : "タスクをスケジュール"}
            </button>
          </form>
        </div>
        
        <hr className="my-8 border-gray-700" />

        <h2 className="text-2xl font-semibold mb-4 text-white">スケジュール済みタスク (自動更新)</h2>
        
        {/* Rustの display_tasks 関数からの出力をそのまま表示 */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
          <pre className="p-5 text-gray-200 font-mono whitespace-pre-wrap overflow-x-auto min-h-60 max-h-[70vh]">
            {tasksOutput}
          </pre>
        </div>

        {/* メッセージ/エラー表示 */}
        {message && (
          <p className={`mt-6 p-4 rounded-xl text-sm font-medium border ${message.includes("Error") ? "bg-red-900 text-red-300 border-red-700" : "bg-green-900 text-green-300 border-green-700"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default TaskPage;
