use tauri::Emitter;
use pnet::packet::MutablePacket;
use pnet::packet::udp::MutableUdpPacket;
use client::buid_udp_packet;

const END_SIG: u64 = 0xFFFFFFFFFFFFFFFF;
//const CHUNK_SIZE: usize = 1472 - 8 - 16 - 8 - 2 - 14;
const CHUNK_SIZE: u64 = 1024;

#[tauri::command]
pub async fn send_task(
    app_handle: tauri::AppHandle,
    //src_ip: String,
    //src_port: u16,
    dstIp: String,
    dstPort: u16,
    task: String,
) -> Result<String, String> {
    use std::net::Ipv4Addr;
    use pnet::transport::{transport_channel, TransportChannelType::Layer4, TransportProtocol};
    use pnet::packet::ip::IpNextHeaderProtocols;
    use tokio::task::spawn;

    let src_ip = "127.0.0.1";
    let src_port: u16 = 1234;

    let src_ip: Ipv4Addr = src_ip.parse().map_err(|e| format!("Invalid src_ip: {}", e))?;
    let dst_ip: Ipv4Addr = dstIp.parse().map_err(|e| format!("Invalid dst_ip: {}", e))?;
    let dst_port = dstPort;

    // ここで固定値や適当な値を用意
    let session_id = [0u8; 16];       // 本当はランダム等にする
    let format_signal = [0, 3];     // 適宜設定
    let data_vec = [5u8; 14];         // 適宜設定

    // filenameをcloneしてmoveに持ち込む
    let text_clone = text.clone();

    //本当はasyncのほうが良いのかもしれないが
    spawn( async move {
        let protocol = TransportProtocol::Ipv4(IpNextHeaderProtocols::Udp);
        println!("create protocol");
        let (mut tx, _) = match transport_channel(4096, Layer4(protocol)) {
            Ok((tx, rx)) => {
                (tx, rx)
            }
            Err(e) => {
                println!("thread error");
                let _ = app_handle.emit("send_file_status", format!("Failed to open transport channel: {}", e));
                return;
            }
        };

        let mut chunk_id = 0u32;
        let data_chunk = text.as_bytes().chunks(CHUNK_SIZE.try_into().unwrap());

        

        for data_chunk in data_chunk{

            if text.is_empty() {
                break;
            }    

            // chunkを8バイトの配列に格納（例としてu64をBEで）
            let chunk = (chunk_id as u64).to_be_bytes();

            // UDPペイロードサイズ計算
            let payload_len = session_id.len() + chunk.len() + format_signal.len() + data_vec.len() + data_chunk.len();
            let mut packet_buffer = vec![0u8; 8 + payload_len];  // UDPヘッダー8バイト + payload

            let mut packet = build_udp_packet(
                &mut packet_buffer,
                src_port,
                dst_port,
                &session_id,
                &chunk,
                &format_signal,
                &data_vec,
                &data_chunk,
            );

            if let Err(e) = tx.send_to(packet, std::net::IpAddr::V4(dst_ip)) {
                let _ = app_handle.emit("send_file_status", format!("Failed to send chunk {}: {}", chunk_id, e));
                return;
            }

            let _ = app_handle.emit("send_file_status", format!("Sent chunk {}", chunk_id));
            chunk_id += 1;
        }

        // 終了パケット送信（chunk=END_SIG、dataなし）
        let chunk = END_SIG.to_be_bytes();
        let mut end_packet_buffer = vec![0u8; 8 + 16 + 8 + 2 + 14];
        let mut end_packet = build_udp_packet(
            &mut end_packet_buffer,
            src_port,
            dst_port,
            &session_id,
            &chunk,
            &format_signal,
            &data_vec,
            &[],
        );
        let _ = tx.send_to(end_packet, std::net::IpAddr::V4(dst_ip));
        let _ = app_handle.emit("send_file_status", "All chunks sent".to_string());
    });

    Ok(format!("Started sending text: {}", text_clone))
}
pub fn load_tasks() -> Vec<Task> {
    if Path::new(TASK_FILE).exists() {
        match fs::read_to_string(TASK_FILE) {
            Ok(data) => serde_json::from_str(&data).unwrap_or_else(|_| {
                eprintln!("Warning: Failed to parse tasks, starting with empty list.");
                Vec::new()
            }),
            Err(e) => {
                eprintln!("Warning: Failed to read task file: {}", e);
                Vec::new()
            }
        }
    } else {
        Vec::new()
    }
}

pub fn save_tasks(tasks: &[Task]) -> Result<(), Box<dyn Error>> {
    let data = serde_json::to_string_pretty(tasks)?;
    fs::write(TASK_FILE, data)?;
    Ok(())
}

pub fn add_new_task(args: &str) -> Result<Task, Box<dyn Error>> {
    // 入力全体を最大3つの部分に分割します: [日付, 時刻(HH:MM), タスク名]
    // 注: chronoのパースのために、日付と時刻を結合して試行する
    let parts: Vec<&str> = args.split(':').collect();

    // 最低限 "YYYY-MM-DD", "HH", "MM", "NAME" が必要なので、partsの要素は4つ以上。
    // 例: "2025-11-19:08:00:起床" -> ["2025-11-19", "08", "00", "起床"]
    if parts.len() < 4 {
        return Err("Invalid argument format. Use YYYY-MM-DD:HH:MM:Task Name.".into());
    }

    let date_str = parts[0];
    let hour_str = parts[1];
    let minute_str = parts[2];

    // 4番目以降の要素を全て結合してタスク名とする (タスク名にコロンが含まれてもOKにする)
    let name_parts = &parts[3..];
    let name = name_parts.join(":").trim().to_string();

    // 日付と時刻を結合して、パースできる形にする (秒は00として補完)
    let datetime_str_to_parse = format!("{}:{}:{}:00", date_str, hour_str, minute_str);

    // YYYY-MM-DD:HH:MM:SS の形式でパースを試みる
    let format = "%Y-%m-%d:%H:%M:%S";

    match NaiveDateTime::parse_from_str(&datetime_str_to_parse, format) {
        Ok(_) => {
            // パースが成功したら、Taskを構築 (datetimeは YYYY-MM-DD:HH:MM 形式で保存)
            let full_datetime_str = format!("{}:{}:{}", date_str, hour_str, minute_str);
            Ok(Task {
                datetime: full_datetime_str,
                name,
                notified: false, // <-- 修正: 初期値として false を設定
            })
        }
        Err(_) => {
            // パース失敗時、具体的なエラーメッセージを返す
            Err("Invalid date/time format. Ensure date is YYYY-MM-DD and time is HH:MM.".into())
        }
    }
}

pub fn show_tasks(tasks: Vec<Task>) -> String {
    if tasks.is_empty() {
        return "No scheduled tasks.".to_string();
    }
    let mut output = String::from("--- Scheduled Tasks ---\n");
    for (i, task) in tasks.iter().enumerate() {
        let status = if task.notified { "[DONE]" } else { "[PENDING]" };
        output.push_str(&format!("{}. {} | {} {}\n", i + 1, task.datetime, task.name, status));
    }
    output.push_str("-----------------------");
    output
}

