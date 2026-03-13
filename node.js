const http = require('http');
const httpProxy = require('http-proxy');
const dns = require('dns');

// Nuestra variable dinámica (empieza con la que sabemos que funciona)
let dynamicTarget = 'ws://46.224.7.62:25877'; 

// 🕵️‍♂️ LA MAGIA: Función que rastrea el servidor como si fuera Minecraft Java
function rastrearServidor() {
    // 1. Preguntamos por el registro SRV oculto de tu dominio
    dns.resolveSrv('_minecraft._tcp.mccurso.funserver.top', (err, records) => {
        if (!err && records.length > 0) {
            const puertoNuevo = records[0].port;
            const hostMisterioso = records[0].name;
            
            // 2. Traducimos el nombre a una IP numérica pura
            dns.resolve4(hostMisterioso, (err, ips) => {
                if (!err && ips.length > 0) {
                    const ipNueva = ips[0];
                    const nuevoDestino = `ws://${ipNueva}:${puertoNuevo}`;
                    
                    // Si cambió, actualizamos el túnel en tiempo real
                    if (dynamicTarget !== nuevoDestino) {
                        dynamicTarget = nuevoDestino;
                        console.log(`[RADAR] 🔄 Nueva IP/Puerto detectado: ${dynamicTarget}`);
                    }
                }
            });
        }
    });
}

// Ejecutamos el radar al encender, y luego cada 5 minutos (300000 ms)
rastrearServidor();
setInterval(rastrearServidor, 300000);

// Configuramos el Proxy base (sin target fijo)
const proxy = httpProxy.createProxyServer({
    ws: true,
    changeOrigin: true,
    xfwd: true,
    proxyTimeout: 10000,
    timeout: 10000
});

// Servidor web de camuflaje que te avisa a dónde está apuntando
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Servidor Backup Online 🟢.\nTarget actual: ${dynamicTarget}`);
});

proxy.on('error', (err) => { /* Silencio en caso de micro-cortes */ });

// El túnel dinámico
server.on('upgrade', (req, socket, head) => {
    socket.setNoDelay(true);
    // 🎯 ¡AQUÍ ESTÁ EL TRUCO! Le pasamos el target dinámico en tiempo real
    proxy.ws(req, socket, head, { target: dynamicTarget }, (err) => {
        if (err) socket.destroy();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Autopilot Proxy activo en el puerto ${PORT}`);
});
