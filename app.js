const wppconnect = require('@wppconnect-team/wppconnect');
const http = require('http');

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Turibot: Online y escuchando.');
});

server.listen(PORT, () => {
    console.log(`✅ [SERVER] Escuchando en puerto ${PORT} (Life Support)`);
    // Iniciamos el bot SOLO después de que el servidor web esté listo
    iniciarBot();
});


const OWNER_NUMBER = '5492615997309@c.us'; 
const WEB_URL = 'https://wanderlust.turisuite.com'; 

const CATEGORIES = [
    { id: 'rutas-del-vino', label: '🍷 Rutas del Vino', description: 'Degustaciones premium y almuerzos.' },
    { id: 'potrerillos', label: '🏔️ Potrerillos', description: 'Dique, montaña y aire libre.' },
    { id: 'experiencias-autor', label: '🌟 Experiencias de Autor', description: 'Actividades exclusivas.' },
    { id: 'programas', label: '📋 Programas Completos', description: 'Paquetes de varios días.' }
];

const chatState = {};


function iniciarBot() {
    console.log('🔄 [BOT] Iniciando motor WPPConnect...');

    wppconnect.create({
        session: 'turibot-demo', 
        autoClose: 0, 
        logQR: false,
        updatesLog: false, 
        disableWelcome: true, 
        
        catchQR: (base64Qr, asciiQR) => {
            console.log('\n================== ESCANEA EL QR ==================\n');
            console.log(asciiQR); 
            console.log('\n===================================================\n');
        },
        
        puppeteerOptions: {
            headless: true, // Modo servidor
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Vital para Docker/Railway
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', 
                '--disable-gpu',
                '--js-flags="--max-old-space-size=256"'
            ]
        }
    })
    .then(async (client) => {
        
        const page = client.page;
        await page.setRequestInterception(true);
        
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                req.abort(); // Bloquear descarga
            } else {
                req.continue();
            }
        });
    
        start(client);
    })
    .catch((error) => console.log(error));
}


async function start(client) {
  console.log('🚀 [BOT] Turibot vDebug LISTO. Esperando mensajes...');

  client.onMessage(async (message) => {
    try {
        // --- FILTROS INICIALES ---
        // 1. Ignorar Estados (Stories) para no llenar el log
        if (message.from === 'status@broadcast') return;

        // 2. Ignorar Grupos (Opcional, quítalo si quieres que funcione en grupos)
        if (message.isGroupMsg) return;
        
        // 3. Ignorar mensajes sin texto válido
        if (!message.body || typeof message.body !== 'string') return;

        // --- LOGS LIMPIOS ---
        console.log(`📩 [MSG] De: ${message.from} | Texto: ${message.body}`);

        const user = message.from;
        const text = message.body.toLowerCase().trim();

        // 🟢 COMANDO DE VIDA (Para probar rápido)
        if (text === '!ping') {
            await client.sendText(user, '🏓 Pong! Turibot está activo en la nube.');
            return;
        }

        // --- GESTIÓN DE ESTADO ---
        if (!chatState[user]) {
            chatState[user] = { mode: 'bot', step: 'MAIN_MENU' };
        }

        // COMANDO DE REACTIVACIÓN (Si estaba en modo humano)
        if (text === 'bot on') {
            chatState[user].mode = 'bot';
            chatState[user].step = 'MAIN_MENU';
            await client.sendText(user, '🤖 *Turibot reactivado.* ¿En qué puedo ayudarte?');
            return;
        }

        // Si está hablando con humano, el bot no interviene
        if (chatState[user].mode === 'human') return;

        // --- NAVEGACIÓN GLOBAL ---
        // COMANDO VOLVER: Funciona en cualquier paso
        if (['volver', 'menu', 'inicio', '0'].includes(text)) {
            chatState[user].step = 'MAIN_MENU';
            // No hacemos return aquí para dejar que el bloque MAIN_MENU de abajo muestre las opciones
            // Forzamos el texto a "menu" virtualmente para que entre al IF de abajo
            // O simplemente enviamos el mensaje directo:
            await client.sendText(user, `🔙 *Menú Principal*\n\n1️⃣ Ver Excursiones\n2️⃣ Ubicación\n3️⃣ Tips de Viaje\n4️⃣ Asesor Humano`);
            return;
        }

        // --- LÓGICA POR PASOS ---

        // PASO 1: SELECCIONANDO CATEGORÍA
        if (chatState[user].step === 'SELECT_CATEGORY') {
            const selection = parseInt(text);

            if (!isNaN(selection) && selection > 0 && selection <= CATEGORIES.length) {
                const cat = CATEGORIES[selection - 1]; 
                const link = `${WEB_URL}/?category=${cat.id}`;
                
                await client.sendText(user, 
                    `✅ *${cat.label}*\n📝 ${cat.description}\n\n🔗 *Ver opciones aquí:* ${link}\n\n_Escribe "0" para volver al menú._`
                );
            } else {
                await client.sendText(user, '⚠️ Opción no válida. Por favor escribe el número (ej: 1) o "0" para volver.');
            }
            return; 
        }

        // PASO 2: MENÚ PRINCIPAL
        if (chatState[user].step === 'MAIN_MENU') {
            
            // Detectar saludo o petición de menú
            const saludos = ['hola', 'buenas', 'dias', 'tardes', 'alo', 'hello', 'turibot', 'menu'];
            if (saludos.some(w => text.includes(w))) {
                await client.sendText(user, 
                    `👋 ¡Hola! Bienvenido a *Wanderlust Viajes*.\n\n` +
                    `1️⃣ Ver Categorías de Excursiones\n` +
                    `2️⃣ Ubicación\n` +
                    `3️⃣ Tips de Viaje\n` +
                    `4️⃣ Hablar con un Asesor`
                );
                return;
            }

            // OPCIÓN 1: EXCURSIONES
            if (text === '1' || text.includes('excursiones') || text.includes('ver')) {
                chatState[user].step = 'SELECT_CATEGORY'; 
                let menu = '🏔️ *Selecciona una categoría:*\n\n';
                CATEGORIES.forEach((cat, index) => { menu += `${index + 1}. ${cat.label}\n`; });
                menu += '\n✍️ *Envía el número (ej: 1)* o escribe *0* para volver.';
                await client.sendText(user, menu);
                return;
            }

            // OPCIÓN 2: UBICACIÓN
            if (text === '2' || text.includes('ubicacion')) {
                await client.sendText(user, `📍 Estamos en Av. San Martín 123, Mendoza.\n⏰ Lun-Vie 9-18hs.`);
                return;
            }

            // OPCIÓN 3: TIPS
            if (text === '3' || text.includes('tips')) {
                await client.sendText(user, `🎒 *Tips:* Lleva agua, gorra y abrigo para alta montaña.`);
                return;
            }

            // OPCIÓN 4: HUMANO
            if (text === '4' || text.includes('asesor')) {
                chatState[user].mode = 'human'; 
                await client.sendText(user, '👨‍💻 *Bot pausado.* He notificado a un asesor. Te escribirán pronto.');
                
                // Notificar al dueño (con seguridad anti-crash)
                try {
                    if (!OWNER_NUMBER.includes('XXXX')) {
                        const contactName = message.sender?.pushname || 'Cliente';
                        // Limpiamos el número para crear el link de wa.me
                        const cleanNumber = user.replace('@c.us', '');
                        await client.sendText(OWNER_NUMBER, `🔔 *Alerta:* ${contactName} pide humano.\nLink: https://wa.me/${cleanNumber}`);
                    } else {
                        console.log('⚠️ [CONFIG] No se envió alerta: Configura el OWNER_NUMBER en el código.');
                    }
                } catch (err) {
                    console.error('❌ Error enviando alerta al dueño:', err.message);
                }
                return;
            }
        }

    } catch (e) {
        console.error('⚠️ Error procesando mensaje:', e);
        // Opcional: Avisar al usuario que hubo un error
        // await client.sendText(message.from, 'Ups, tuve un error momentáneo. Intenta de nuevo.');
    }
  });

  setTimeout(() => {
    console.log('♻️ Reinicio programado para limpiar memoria RAM...');
    process.exit(0); 
}, 21600000);
}

// =================================================================
// 5. PREVENCIÓN DE CRASHES GLOBALES
// =================================================================
process.on('uncaughtException', (err) => {
    console.error('💣 [ANTI-CRASH] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('💣 [ANTI-CRASH] Unhandled Rejection:', reason);
});