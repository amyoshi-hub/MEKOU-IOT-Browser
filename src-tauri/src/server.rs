// src/server.rs
use tokio::net::UdpSocket;
use tokio::task;
use tauri::Emitter;
//use rand::Rng; // session_id のランダム生成用

use crate::server_signal;
use crate::format_handler::process_format;
use crate::AI::state::ServerInfo;

// parse_packet も同じファイルに移動したと仮定
fn parse_packet(payload: &[u8]) -> Option<([u8; 16], [u8; 8], [u8; 2], [u8; 14], Vec<u8>)> {
    if payload.len() < 40 { // 最低限のヘッダー長を確認
        return None;
    }
    let session_id = payload[0..16].try_into().ok()?;
    let chunk = payload[16..24].try_into().ok()?;
    let format = payload[24..26].try_into().ok()?;
    let data_vec = payload[26..40].try_into().ok()?;
    let data = payload[40..].to_vec();

    Some((session_id, chunk, format, data_vec, data))
}


async fn server_launch_signal(port: &str) -> Result<(), String> {
    let mut send_buf = [0u8; 1024];
    let local_port = port.parse::<u16>().map_err(|e| format!("Invalid port number: {}", e))?;

    let packet_len = server_signal::build_server_announce_packet(
        &mut send_buf,
        local_port,
        local_port,
    );

    let send_socket = tokio::net::UdpSocket::bind("0.0.0.0:0").await
        .map_err(|e| format!("Failed to create send socket for signal: {}", e))?;

    let broadcast_addr = format!("255.255.255.255:{}", local_port);
    send_socket.set_broadcast(true)
        .map_err(|e| format!("Failed to set broadcast: {}", e))?;

    send_socket.send_to(&send_buf[..packet_len], &broadcast_addr).await
        .map_err(|e| format!("Failed to send server announce signal: {}", e))?;

    println!("Server announce signal sent to {}", broadcast_addr);
    Ok(())
}

#[tauri::command]
pub async fn start_server(app_handle: tauri::AppHandle, port: String) -> Result<String, String> {
    let address = format!("0.0.0.0:{}", port);
    println!("Attempting to bind UDP server to: {}", address);

    let socket = match UdpSocket::bind(&address).await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Failed to bind socket to {}: {}", address, e);
            return Err(format!("Failed to bind socket: {}", e));
        }
    };
    println!("UDP Server successfully bound to: {}", address);

    // Frontendにイベントを送信する例 (オプション)
    app_handle.emit("server_status", format!("Server started on {}", address))
        .map_err(|e| format!("Failed to emit event: {}", e))?;


    //cloneよりもarcとか使ったほうが良いのかな？
    let port_for_signal = port.clone();
    task::spawn(async move {
        loop{
        // 受信ループの起動前に少し待つ（サーバー起動準備時間）
        tokio::time::sleep(std::time::Duration::from_secs(2)).await;

        //signal送信
        if let Err(e) = server_launch_signal(&port_for_signal).await {
            eprintln!("Failed to send server launch signal: {}", e);
        }
        }
    });

    task::spawn(async move {
        let mut buf = [0; 1024];
        loop {
            match socket.recv_from(&mut buf).await {
                Ok((len, addr)) => {
                    match parse_packet(&buf[..len]) {
                        Some((session_id, chunk, format, data_vec, data_payload)) => {
                            let received_data_display: String; // 表示用の文字列を先に定義

                            let received_data_display = process_format(
                                    format, session_id, chunk, data_vec, data_payload,
                                    addr, port.clone(), &app_handle
                                );
                            
                            if let Err(e) = app_handle.emit("udp_data_received", format!("{} from {}", received_data_display, addr)) {
                                eprintln!("Failed to emit UDP data event: {}", e);
                            }
                        }
                        None => {
                            eprintln!("Failed to parse data");
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to receive data: {}", e);
                    break;
                }
            }
        }
    });

    Ok(format!("Server started successfully on {}", address))
}
