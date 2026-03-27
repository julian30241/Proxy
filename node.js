const http = require('http');
const httpProxy = require('http-proxy');
const dns = require('dns');

let dynamicTarget = 'ws://190.215.136.165:25565'; // Target de emergencia
let radarStatus = "Iniciando escaneo..."; // Nuevo: Monitor de estado

// 🕵️‍♂️ EL RADAR MEJORADO CON DIAGNÓSTICO
function rastrearServidor() {
    dns.resolveSrv('190.215.136.165:25565', (err, records) => {
        if (err) {
            radarStatus = `❌ Error buscando SRV (El server de Funserver podría estar apagado o el DNS no ha actualizado): ${err.code}`;
            return;
        }
        
        if (records.length > 0) {
            const puertoNuevo = records[0].port;
            const hostMisterioso = records[0].name;
            
            dns.resolve4(hostMisterioso, (err, ips) => {
                if (err) {
                    radarStatus = `❌ Error traduciendo la IP de Funserver: ${err.code}`;
                    return;
                }
                
                if (ips.length > 0) {
                    const ipNueva = ips[0];
                    const nuevoDestino = `ws://${ipNueva}:${puertoNuevo}`;
                    radarStatus = `✅ Radar OK. Conexión establecida con Funserver.`;
                    
                    if (dynamicTarget !== nuevoDestino) {
                        dynamicTarget = nuevoDestino;
                        console.log(`[RADAR] 🔄 Target actualizado a: ${dynamicTarget}`);
                    }
                }
            });
        } else {
            radarStatus = "⚠️ No se encontraron registros de Minecraft en ese dominio.";
        }
    });
}

// Ejecutamos el radar rápido al inicio, y luego cada 1 minuto (60000 ms) para que reaccione más rápido
rastrearServidor();
setInterval(rastrearServidor, 60000);

const proxy = httpProxy.createProxyServer({
    ws: true,
    changeOrigin: true,
    xfwd: true,
    proxyTimeout: 10000,
    timeout: 10000
});

// 📊 TU NUEVO PANEL DE CONTROL WEB
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.write(`=== 🛡️ PANEL DE CONTROL SYSADMIN ===\n\n`);
    res.write(`Estado del Radar: ${radarStatus}\n`);
    res.write(`Target Actual:    ${dynamicTarget}\n`);
    res.end();
});

proxy.on('error', (err) => { /* Silencio anti-crasheo */ });

server.on('upgrade', (req, socket, head) => {
    socket.setNoDelay(true);
    proxy.ws(req, socket, head, { target: dynamicTarget }, (err) => {
        if (err) socket.destroy();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Autopilot V2 activo en el puerto ${PORT}`);
});
