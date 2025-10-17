const net = require('net');
const fs = require('fs');
const path = require('path');

const GPSD_SERVER = "127.0.0.1";
const GPSD_PORT = 2947;
const UNIX_SOCKET_PATH = "/tmp/gps-nmea.sock";

// 清除旧 socket 文件
if (fs.existsSync(UNIX_SOCKET_PATH)) {
    try { fs.unlinkSync(UNIX_SOCKET_PATH); } catch (e) { /* ignore */ }
}

// 记录日志函数
function log(...msg) {
    console.error(...msg);
}

const clients = new Set();

// 创建 unix socket 服务（供 gpsclue 连接）
const unixServer = net.createServer((client) => {
    log(`New client connected on ${UNIX_SOCKET_PATH}`);
    clients.add(client);

    client.on('end', () => {
        log(`Client disconnected`);
        clients.delete(client);
    });

    client.on('error', (err) => {
        log(`Client error: ${err.message}`);
        clients.delete(client);
    });
});

unixServer.listen(UNIX_SOCKET_PATH, () => {
    log(`Listening on UNIX socket: ${UNIX_SOCKET_PATH}`);
});

// 连接 gpsd
const gpsd = net.createConnection(GPSD_PORT, GPSD_SERVER, () => {
    log(`Connected to gpsd at ${GPSD_SERVER}:${GPSD_PORT}`);
    const cmd = '?WATCH={"enable":true,"json":false,"nmea":true,"raw":0,"scaled":false,"timing":false,"split24":false,"pps":false}\n';
    gpsd.write(cmd);
});

// 读取并转发 NMEA 数据
gpsd.on('data', (data) => {
    const text = data.toString();
    log(`${text.trim()}`);
    for (const client of clients) {
        try {
            client.write(text);
        } catch (e) {
            log(`Error writing to client: ${e.message}`);
            clients.delete(client);
        }
    }
});

gpsd.on('error', (err) => {
    console.error(`Error connecting to gpsd: ${err.message}`);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('Shutting down...');
    for (const client of clients) client.end();
        gpsd.destroy();
    unixServer.close(() => {
        try{
            fs.unlinkSync(UNIX_SOCKET_PATH);
        } catch(e){

        }
        process.exit(0);
    });
});
