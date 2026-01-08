const wppconnect = require('@wppconnect-team/wppconnect');
const http = require('http');

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Turibot esta vivo!');
});
server.listen(PORT, () => {
    console.log(`👻 Servidor Fantasma en puerto ${PORT}`);
});


const OWNER_NUMBER = '5492615997309@c.us'; 
const WEB_URL = 'https://wanderlust.turisuite.com'; 

const CATEGORIES = [
    { id: 'rutas-del-vino', label: '🍷 Rutas del Vino', description: 'Degustaciones premium.' },
    { id: 'potrerillos', label: '🏔️ Potrerillos', description: 'Dique y montaña.' },
    { id: 'experiencias-autor', label: '🌟 Experiencias', description: 'Actividades exclusivas.' },
    { id: 'programas', label: '📋 Programas', description: 'Paquetes completos.' }
];

const chatState = {};

wppconnect.create({
    session: 'turibot-demo', 
    autoClose: 0, 
    logQR: false, 
    catchQR: (base64Qr, asciiQR) => {
        console.log('\n================== QR CODE ==================\n');
        console.log(asciiQR); 
        console.log('\n=============================================\n');
    },
    puppeteerOptions: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Vital para Railway
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
})
.then((client) => start(client))
.catch((error) => console.log('Error fatal al iniciar:', error));

async function start(client) {
  console.log('🚀 Turibot vDebug listo. Sistema de logs activado.');


  client.onMessage(async (message) => {
    try {
        // --- LOGS ESPÍA ---
        if (message.from === 'status@broadcast') return; // Ignorar estados silenciosamente
        
        console.log('------------------------------------------------');
        console.log(`📩 MENSAJE ENTRANTE`);
        console.log(`👤 De: ${message.from}`);
        console.log(`📝 Texto: ${message.body}`);
        console.log('------------------------------------------------');

        // 1. Filtros básicos
        if (message.isGroupMsg) return;
        
        if (!message.body || typeof message.body !== 'string') return;

        const user = message.from;
        const text = message.body.toLowerCase().trim();

        // 🟢 COMANDO DE PRUEBA RÁPIDA (Escribe "!ping" para ver si responde)
        if (text === '!ping') {
            await client.sendText(user, '🏓 Pong! Estoy vivo en Railway.');
            return;
        }

        // Inicializar estado si no existe
        if (!chatState[user]) {
            chatState[user] = { mode: 'bot', step: 'MAIN_MENU' };
        }

        // Reactivación
        if (text === 'bot on') {
            chatState[user].mode = 'bot';
            chatState[user].step = 'MAIN_MENU';
            await client.sendText(user, '🤖 *Turibot reactivado.*');
            return;
        }

        // Si está en modo humano, ignorar
        if (chatState[user].mode === 'human') return;

        // COMANDO VOLVER (Funciona siempre)
        if (['volver', 'menu', 'inicio', '0'].includes(text)) {
            chatState[user].step = 'MAIN_MENU';
            await client.sendText(user, `🔙 *Menú Principal*\nEscribe *hola* para ver las opciones.`);
            return;
        }

        // CASO A: ELIGIENDO CATEGORÍA
        if (chatState[user].step === 'SELECT_CATEGORY') {
            const selection = parseInt(text);

            if (!isNaN(selection) && selection > 0 && selection <= CATEGORIES.length) {
                const cat = CATEGORIES[selection - 1]; 
                const link = `${WEB_URL}/explore?category=${cat.id}`;
                await client.sendText(user, 
                    `✅ *${cat.label}*\n📝 ${cat.description}\n\n🔗 *Ver aquí:* ${link}\n\n_Escribe "0" para volver._`
                );
            } else {
                await client.sendText(user, '⚠️ Opción no válida. Envía el número (ej: 1) o "0" para volver.');
            }
            return; 
        }

        // CASO B: MENÚ PRINCIPAL
        if (chatState[user].step === 'MAIN_MENU') {
            // Detectar saludo O comando volver
            if (['hola', 'buenas', 'dias', 'tardes', 'alo', 'hello', 'turibot', '0', 'menu'].some(w => text.includes(w))) {
                await client.sendText(user, 
                    `👋 ¡Hola! Bienvenido a *Wanderlust Viajes*.\n\n` +
                    `1️⃣ Ver Excursiones\n` +
                    `2️⃣ Ubicación\n` +
                    `3️⃣ Tips de Viaje\n` +
                    `4️⃣ Hablar con un Asesor`
                );
                return;
            }

            if (text === '1' || text.includes('excursiones')) {
                chatState[user].step = 'SELECT_CATEGORY'; 
                let menu = '🏔️ *Selecciona una categoría:*\n\n';
                CATEGORIES.forEach((cat, index) => { menu += `${index + 1}. ${cat.label}\n`; });
                menu += '\n✍️ *Envía el número* o escribe *0* para volver.';
                await client.sendText(user, menu);
                return;
            }

            if (text === '2' || text.includes('ubicacion')) {
                await client.sendText(user, `📍 Estamos en Av. San Martín 123, Mendoza.\n⏰ Lun-Vie 9-18hs.`);
                return;
            }

            if (text === '3' || text.includes('tips')) {
                await client.sendText(user, `🎒 *Tips:* Lleva agua, gorra y abrigo.`);
                return;
            }

            if (text === '4' || text.includes('asesor')) {
                chatState[user].mode = 'human'; 
                await client.sendText(user, '👨‍💻 *Bot pausado.* He notificado a un asesor.');
                
                try {
                    const contactName = message.sender?.pushname || 'Cliente';
                    if (!OWNER_NUMBER.includes('XXXX')) {
                        await client.sendText(OWNER_NUMBER, `🔔 Alerta: ${contactName} pide humano. Link: https://wa.me/${user.replace('@c.us','')}`);
                    } else {
                        console.log('⚠️ No se envió alerta al dueño: Configura el OWNER_NUMBER.');
                    }
                } catch (err) {
                    console.error('Error enviando alerta al dueño:', err.message);
                }
                return;
            }
        }
    } catch (e) {
        console.error('🔥 Error CRÍTICO procesando mensaje:', e);
    }
  });
}