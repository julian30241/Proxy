const http = require('http');
const httpProxy = require('http-proxy');

// 1. Configuramos el túnel apuntando a tu Magma Node
const proxy = httpProxy.createProxyServer({
    target: 'ws://91.98.80.233:25877',
    ws: true,
    changeOrigin: true,
    xfwd: true,          // Fundamental en Render para pasar firewalls
    proxyTimeout: 10000, // 10 segundos máximo si alguien tiene mal internet
    timeout: 10000
});

// 2. Servidor web de camuflaje (lo que ve Render para saber que estás online)
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server Backup Online 🟢 (Render Network)');
});

// 3. Sistema anti-crasheo (Silencioso para ahorrar CPU)
proxy.on('error', (err, req, res) => {
    if (res && res.writeHead) {
        res.writeHead(500);
        res.end('Error de conexión');
    }
});

// 4. El acelerador de Minecraft (Cero Latencia en el Handshake)
server.on('upgrade', (req, socket, head) => {
    socket.setNoDelay(true); 
    proxy.ws(req, socket, head, (err) => {
        if (err) socket.destroy(); // Corta de raíz si falla, sin colgar el server
    });
});

// 5. El Detector de Puertos Dinámicos de Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Proxy de Render activo y escuchando en el puerto ${PORT}`);
});
