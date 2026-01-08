const wppconnect = require('@wppconnect-team/wppconnect');
const http = require('http');


const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Turibot: Online y escuchando.');
});

server.listen(PORT, () => {
    console.log(`✅ [SERVER] Escuchando en el puerto ${PORT}`);
    // Solo cuando el servidor HTTP esté listo, iniciamos el bot
    iniciarBot();
});

// =================================================================
// 2. CONFIGURACIÓN DEL BOT
// =================================================================

// 🚨 TU NÚMERO (Asegúrate que sea el formato correcto o la alerta fallará)
const OWNER_NUMBER = '549261XXXXXXX@c.us'; 
const WEB_URL = 'https://wanderlust.turisuite.com'; 

const CATEGORIES = [
    { id: 'rutas-del-vino', label: '🍷 Rutas del Vino', description: 'Degustaciones premium.' },
    { id: 'potrerillos', label: '🏔️ Potrerillos', description: 'Dique y montaña.' },
    { id: 'experiencias-autor', label: '🌟 Experiencias', description: 'Actividades exclusivas.' },
    { id: 'programas', label: '📋 Programas', description: 'Paquetes completos.' }
];

const chatState = {};

// =================================================================
// 3. INICIO DE WPPCONNECT (CON PROTECCIÓN DE MEMORIA)
// =================================================================

function iniciarBot() {
    console.log('🔄 [BOT] Iniciando WPPConnect...');

    wppconnect.create({
        session: 'turibot-demo', 
        
        // Configuración crítica para que no se cierre solo
        autoClose: 0, 
        logQR: false, 
        
        // Evitamos descargar actualizaciones de Chrome que rompen Docker
        browserArgs: [
             '--no-sandbox',
             '--disable-setuid-sandbox',
             '--disable-dev-shm-usage',
             '--disable-accelerated-2d-canvas',
             '--no-first-run',
             '--no-zygote',
             '--single-process', 
             '--disable-gpu'
        ],

        catchQR: (base64Qr, asciiQR) => {
            console.log('\n================== QR CODE ==================\n');
            console.log(asciiQR); 
            console.log('\n=============================================\n');
        },
        
        puppeteerOptions: {
            headless: true, // OBLIGATORIO en Railway
            userDataDir: './tokens/turibot-demo', // Forzamos ruta de sesión
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', 
                '--disable-gpu'
            ]
        }
    })
    .then((client) => start(client))
    .catch((error) => {
        console.error('🔥 [FATAL] Error al crear cliente:', error);
        // No hacemos process.exit() para que el servidor HTTP siga vivo y Railway no reinicie en bucle
    });
}

async function start(client) {
  console.log('🚀 [BOT] Turibot LISTO y conectado.');

  client.onMessage(async (message) => {
    try {
        if (message.from === 'status@broadcast') return;
        
        // Filtros de seguridad básicos
        if (message.isGroupMsg) return;
        if (!message.body || typeof message.body !== 'string') return;

        console.log(`📩 Mensaje de ${message.from}: ${message.body}`);

        const user = message.from;
        const text = message.body.toLowerCase().trim();

        // 🟢 PING DE VIDA
        if (text === '!ping') {
            await client.sendText(user, '🏓 Pong! El bot está estable.');
            return;
        }

        // --- TU LÓGICA DE NEGOCIO AQUÍ ---
        // (He resumido la lógica para que el código sea más limpio, 
        //  pega aquí tus IFs de menú, categorías, etc. si los necesitas)
        
        if (!chatState[user]) chatState[user] = { mode: 'bot', step: 'MAIN_MENU' };
        
        if (chatState[user].mode === 'human') return;

        // EJEMPLO BÁSICO DE RESPUESTA
        if (text.includes('hola') || text === 'menu') {
            await client.sendText(user, '👋 Hola, soy Turibot. Escribe: \n1. Excursiones\n2. Info');
        }

    } catch (e) {
        console.error('⚠️ Error procesando mensaje:', e);
    }
  });
}


process.on('uncaughtException', (err) => {
    console.error('💣 [CRASH EVITADO] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💣 [CRASH EVITADO] Unhandled Rejection:', reason);
});