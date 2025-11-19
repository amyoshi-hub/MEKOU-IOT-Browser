use pnet::packet::ip::IpNextHeaderProtocols;
use pnet::transport::TransportProtocol;

pub struct NetConfig {
    pub ip: String,
    pub port: u16,
    pub protocol: TransportProtocol,
}

pub struct UdpArc {
    pub session_id: [u8; 16],
    pub chunk: [u8; 8],
    pub format: [u8; 2],
    pub data_vec: [u8; 14],
    pub data: Vec<u8>,
}

