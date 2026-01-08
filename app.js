const wppconnect = require('@wppconnect-team/wppconnect');
const http = require('http'); // 1. Importar módulo HTTP

// --- TRUCO PARA RAILWAY (SERVIDOR FANTASMA) ---
// Esto mantiene vivo el contenedor engañando a Railway
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Turibot esta vivo y escuchando!');
});
server.listen(PORT, () => {
    console.log(`👻 Servidor Fantasma escuchando en el puerto ${PORT} (Para mantener vivo a Railway)`);
});
// ----------------------------------------------

// URL de tu proyecto
const WEB_URL = 'https://wanderlust.turisuite.com'; 

// 🚨 TU NÚMERO
const OWNER_NUMBER = '549261XXXXXXX@c.us'; 

const CATEGORIES = [
    { id: 'rutas-del-vino', label: '🍷 Rutas del Vino', description: 'Degustaciones premium y almuerzos.' },
    { id: 'potrerillos', label: '🏔️ Potrerillos', description: 'Dique, montaña y aire libre.' },
    { id: 'experiencias-autor', label: '🌟 Experiencias de Autor', description: 'Actividades exclusivas.' },
    { id: 'programas', label: '📋 Programas Completos', description: 'Paquetes de varios días.' }
];

const chatState = {};

wppconnect
  .create({
    session: 'turibot-demo',
    catchQR: (base64Qr, asciiQR) => console.log(asciiQR),
    logQR: false, 
    headless: true, 
    devtools: false,
    autoClose: 0,
    qrTimeout: 0,
    puppeteerOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu']
    }
  })
  .then((client) => start(client))
  .catch((error) => console.log(error));

async function start(client) {
  console.log('🚀 Turibot vDebug listo. Esperando mensajes...');

  client.onMessage(async (message) => {
    
    // --- LOGS ESPÍA ---
    console.log(`📩 Recibido de: ${message.from} | Tipo: ${message.type}`);

    // 1. Filtros de Seguridad
    if (message.isGroupMsg) return;
    if (message.from === 'status@broadcast') return; 
    
    if (!message.body || typeof message.body !== 'string') {
        console.log('❌ Ignorado: No tiene cuerpo de texto válido');
        return;
    }

    const user = message.from;
    const text = message.body.toLowerCase().trim();

    // Inicializar estado
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

    if (chatState[user].mode === 'human') return;

    // COMANDO VOLVER
    if (['volver', 'menu', 'inicio', '0'].includes(text)) {
        chatState[user].step = 'MAIN_MENU';
        await client.sendText(user, 
            `🔙 *Menú Principal*\n\n1️⃣ Ver Excursiones\n2️⃣ Ubicación\n3️⃣ Tips de Viaje\n4️⃣ Asesor Humano`
        );
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
            await client.sendText(user, '⚠️ Opción no válida. Escribe el número (ej: 1) o "0" para volver.');
        }
        return; 
    }

    // CASO B: MENÚ PRINCIPAL
    if (chatState[user].step === 'MAIN_MENU') {
        // Saludo
        if (['hola', 'buenas', 'dias', 'tardes', 'alo', 'hello', 'turibot'].some(w => text.includes(w))) {
            console.log('✅ Enviando Saludo...');
            await client.sendText(user, 
                `👋 ¡Hola! Bienvenido a *Wanderlust Viajes*.\n\n` +
                `1️⃣ Ver Categorías de Excursiones\n` +
                `2️⃣ Ubicación\n` +
                `3️⃣ Tips de Viaje\n` +
                `4️⃣ Hablar con un Asesor`
            );
            return;
        }

        if (text === '1' || text.includes('excursiones') || text.includes('ver')) {
            chatState[user].step = 'SELECT_CATEGORY'; 
            let menu = '🏔️ *Selecciona una categoría:*\n\n';
            CATEGORIES.forEach((cat, index) => { menu += `${index + 1}. ${cat.label}\n`; });
            menu += '\n✍️ *Envía el número (ej: 1)* o escribe *0* para volver.';
            await client.sendText(user, menu);
            return;
        }

        if (text === '2' || text.includes('ubicacion')) {
            await client.sendText(user, `📍 Estamos en Av. San Martín 123, Mendoza.\n⏰ Lun-Vie 9-18hs.`);
            return;
        }

        if (text === '3' || text.includes('tips')) {
            await client.sendText(user, `🎒 *Tips:* Lleva agua, gorra y abrigo para alta montaña.`);
            return;
        }

        if (text === '4' || text.includes('asesor')) {
            chatState[user].mode = 'human'; 
            await client.sendText(user, '👨‍💻 *Bot pausado.* He notificado a un asesor.');
            
            const contactName = message.sender?.pushname || 'Cliente';
            await client.sendText(OWNER_NUMBER, `🔔 Alerta: ${contactName} pide humano.`);
            return;
        }
    }
  });
}