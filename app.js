const wppconnect = require('@wppconnect-team/wppconnect');
const http = require('http');


const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Turibot: Online y optimizado.');
});

server.listen(PORT, () => {
    console.log(`✅ [SERVER] Escuchando en puerto ${PORT}`);
    iniciarBot();
});


const OWNER_NUMBER = '5492615997309@c.us'; // 🚨 PON TU NÚMERO
const WEB_URL = 'https://wanderlust.turisuite.com'; 

const CATEGORIES = [
    { id: 'rutas-del-vino', label: '🍷 Rutas del Vino', description: 'Degustaciones premium.' },
    { id: 'potrerillos', label: '🏔️ Potrerillos', description: 'Dique y montaña.' },
    { id: 'experiencias-autor', label: '🌟 Experiencias', description: 'Actividades exclusivas.' },
    { id: 'programas', label: '📋 Programas', description: 'Paquetes completos.' }
];

const chatState = {};

// =================================================================
// 3. INICIO DE WPPCONNECT (OPTIMIZADO VÍA FLAGS)
// =================================================================

function iniciarBot() {
    console.log('🔄 [BOT] Iniciando WPPConnect modo Eco...');

    wppconnect.create({
        session: 'turibot-demo', 
        autoClose: 0, 
        logQR: false,
        updatesLog: false, 
        
        catchQR: (base64Qr, asciiQR) => {
            console.log('\n================== ESCANEA EL QR ==================\n');
            console.log(asciiQR); 
            console.log('\n===================================================\n');
        },
        
        puppeteerOptions: {
            headless: true,
            userDataDir: './tokens/turibot-demo',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process',
                '--disable-gpu',

                '--blink-settings=imagesEnabled=false', 
                '--disable-remote-fonts',
                '--js-flags="--max-old-space-size=400"' 
            ]
        }
    })
    .then((client) => start(client))
    .catch((error) => console.error('🔥 [FATAL] Error iniciando:', error));
}

// =================================================================
// 4. LÓGICA DE NEGOCIO
// =================================================================

async function start(client) {
  console.log('🚀 [BOT] Turibot LISTO. Modo Ahorro activado.');


  setTimeout(() => {
      console.log('♻️ [MANTENIMIENTO] Reiniciando proceso para limpiar RAM...');
      process.exit(0); 
  }, 21600000); 

  client.onMessage(async (message) => {
    try {
        if (message.from === 'status@broadcast') return;
        if (message.isGroupMsg) return;
        if (!message.body || typeof message.body !== 'string') return;

        console.log(`📩 [MSG] ${message.from}: ${message.body.substring(0, 20)}...`);

        const user = message.from;
        const text = message.body.toLowerCase().trim();

        // PING
        if (text === '!ping') {
            await client.sendText(user, '🏓 Pong! (Modo Eco)');
            return;
        }

        // GESTIÓN DE ESTADO
        if (!chatState[user]) chatState[user] = { mode: 'bot', step: 'MAIN_MENU' };
        
        if (text === 'bot on') {
            chatState[user].mode = 'bot';
            chatState[user].step = 'MAIN_MENU';
            await client.sendText(user, '🤖 Turibot reactivado.');
            return;
        }

        if (chatState[user].mode === 'human') return;

        // COMANDO VOLVER
        if (['volver', 'menu', 'inicio', '0'].includes(text)) {
            chatState[user].step = 'MAIN_MENU';
            await client.sendText(user, `🔙 *Menú Principal*\n\n1️⃣ Ver Excursiones\n2️⃣ Ubicación\n3️⃣ Tips\n4️⃣ Asesor`);
            return;
        }

        // --- MENÚS ---
        
        // SELECT CATEGORY
        if (chatState[user].step === 'SELECT_CATEGORY') {
            const selection = parseInt(text);
            if (!isNaN(selection) && selection > 0 && selection <= CATEGORIES.length) {
                const cat = CATEGORIES[selection - 1]; 
                await client.sendText(user, `✅ *${cat.label}*\n📝 ${cat.description}\n🔗 ${WEB_URL}/explore?category=${cat.id}\n\n_0 para volver._`);
            } else {
                await client.sendText(user, '⚠️ Opción inválida. Envía el número o "0".');
            }
            return; 
        }

        // MAIN MENU
        if (chatState[user].step === 'MAIN_MENU') {
            if (['hola', 'buenas', 'turibot', 'menu'].some(w => text.includes(w))) {
                await client.sendText(user, `👋 ¡Hola! Bienvenido a *Wanderlust*.\n\n1️⃣ Excursiones\n2️⃣ Ubicación\n3️⃣ Tips\n4️⃣ Asesor`);
                return;
            }

            if (text === '1' || text.includes('excursiones')) {
                chatState[user].step = 'SELECT_CATEGORY'; 
                let menu = '🏔️ *Categorías:*\n';
                CATEGORIES.forEach((cat, i) => { menu += `${i + 1}. ${cat.label}\n`; });
                menu += '\nEnvía el número o *0* para volver.';
                await client.sendText(user, menu);
                return;
            }

            if (text === '2') {
                await client.sendText(user, `📍 Av. San Martín 123, Mendoza.`);
                return;
            }

            if (text === '3') {
                await client.sendText(user, `🎒 Tips: Agua, gorra y abrigo.`);
                return;
            }

            if (text === '4') {
                chatState[user].mode = 'human'; 
                await client.sendText(user, '👨‍💻 He notificado a un asesor.');
                try {
                    if (!OWNER_NUMBER.includes('XXXX')) {
                        await client.sendText(OWNER_NUMBER, `🔔 Alerta Humano: wa.me/${user.replace('@c.us','')}`);
                    }
                } catch (e) { console.error('Error alerta dueño', e.message); }
                return;
            }
        }
    } catch (e) {
        console.error('⚠️ Error msg:', e.message);
    }
  });
}

// ANTI-CRASH GLOBAL
process.on('uncaughtException', (err) => console.error('💣 Ignored Exception:', err.message));
process.on('unhandledRejection', (reason) => console.error('💣 Ignored Rejection:', reason.message));