use rand::Rng; // rand::Rng の機能を使うために必要
use crate::client::build_udp_packet; // client モジュールの build_udp_packet 関数をインポート

pub fn build_server_announce_packet(
    buffer: &mut [u8],
    src_port: u16,
    dst_port: u16,
) -> usize { // <--- 戻り値は `usize` のままにします。パケットの長さを返すため。
    let mut rng = rand::rng();
    
    //parser
    let mut session_id: [u8; 16] = [255; 16]; // 16バイトの配列を初期化
    rng.fill(&mut session_id); // rand::Rng::fill() を使って配列をランダムなバイトで埋める

    let chunk: [u8; 8] = [255; 8];          // シグナル用なので全て0でOK
    let format_signal: [u8; 2] = [0xFF, 0xFF]; // サーバー生存シグナル
    let data_vec: [u8; 14] = [0; 14];     // シグナル用なので全て0でOK
    let data: &[u8] = b"OSAI Server Online"; // 簡潔なメッセージ (UTF-8)

    // build_udp_packet を呼び出し、返された MutableUdpPacket から長さを取得して返す
    let packet = build_udp_packet( // build_udp_packet の戻り値を受け取る
        buffer,
        src_port,
        dst_port,
        &session_id,
        &chunk,
        &format_signal,
        &data_vec,
        data
    );

    // MutableUdpPacket から実際のパケットの長さを取得する
    // pnet::packet::Packet トレイトを実装しているはずなので、`packet.packet().len()` で取得できるはずです。
    // あるいは、内部バッファの長さ + UDPヘッダ長など、構築ロジックによって変わります。
    // 通常、`MutableUdpPacket` 自体が、そのヘッダとペイロードを含んだ「有効なパケットの長さ」を知っているはずです。
    // ここでは `get_size()` や `packet().len()` のようなメソッドを仮定します。
    // pnet::packet::udp::MutableUdpPacket のドキュメントを確認してください。
    // 簡単な方法は、UDPヘッダー長(8バイト)とペイロードの合計長を計算することです。
    // build_udp_packet内で `packet.set_length((8 + payload_len) as u16);` を呼んでいるので、
    // ここではその `(8 + session_id.len() + chunk.len() + format_signal.len() + data_vec.len() + data.len())` を返せば良いです。
    
    // または、MutableUdpPacket が提供する `get_total_length()` や `packet().len()` など
    // 正確な方法は、pnetのドキュメントで `MutableUdpPacket` のメソッドを確認してください。
    // 例えば、`packet.packet().len()` や `packet.packet_size()` のようなもの。
    // もし単純に `set_length` で設定した値がそのままUDPパケットの全長になるなら、
    // 以下のように計算で返せます。
    (8 + session_id.len() + chunk.len() + format_signal.len() + data_vec.len() + data.len()) as usize
}
