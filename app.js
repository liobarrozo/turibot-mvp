const wppconnect = require('@wppconnect-team/wppconnect');

const WEB_URL = 'https://wanderlust.turisuite.com'; 


const OWNER_NUMBER = '5492615997309@c.us'; 

const CATEGORIES = [
    { 
        id: 'rutas-del-vino', 
        label: '🍷 Rutas del Vino', 
        description: 'Degustaciones premium y almuerzos.' 
    },
    { 
        id: 'potrerillos', 
        label: '🏔️ Potrerillos', 
        description: 'Dique, montaña y aire libre.' 
    },
    { 
        id: 'experiencias-autor', 
        label: '🌟 Experiencias de Autor', 
        description: 'Actividades exclusivas.' 
    },
    { 
        id: 'programas', 
        label: '📋 Programas Completos', 
        description: 'Paquetes de varios días.' 
    }
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
  .catch((error) => console.log(error));

async function start(client) {
  console.log('🚀 Turibot v2.1 (Con Alertas) listo...');

  client.onMessage(async (message) => {
    // --- FILTROS DE SEGURIDAD ---
    if (message.isGroupMsg || message.from === 'status@broadcast') return; 
    if (!message.body || typeof message.body !== 'string') return;

    const user = message.from;
    const text = message.body.toLowerCase().trim();

    if (!chatState[user]) {
      chatState[user] = { mode: 'bot', step: 'MAIN_MENU' };
    }

    if (text === 'bot on') {
      chatState[user].mode = 'bot';
      chatState[user].step = 'MAIN_MENU';
      await client.sendText(user, '🤖 *Turibot reactivado.*');
      return;
    }

    if (chatState[user].mode === 'human') return;

    if (['volver', 'menu', 'inicio', '0'].includes(text)) {
        chatState[user].step = 'MAIN_MENU';
        await simulateTyping(client, user);
        await client.sendText(user, 
            `🔙 *Menú Principal*\n\n` +
            `1️⃣ Ver Excursiones\n` +
            `2️⃣ Ubicación\n` +
            `3️⃣ Tips de Viaje\n` +
            `4️⃣ Asesor Humano`
        );
        return;
    }



    // CASO A: ELIGIENDO CATEGORÍA
    if (chatState[user].step === 'SELECT_CATEGORY') {
        const selection = parseInt(text);

        if (!isNaN(selection) && selection > 0 && selection <= CATEGORIES.length) {
            const cat = CATEGORIES[selection - 1]; 
            const link = `${WEB_URL}/?category=${cat.id}`;

            await simulateTyping(client, user);
            await client.sendText(user, 
                `✅ Excelente elección: *${cat.label}*\n` +
                `📝 ${cat.description}\n\n` +
                `🔗 *Pueden mirar las excursiones de esa categoría aquí:*\n${link}\n\n` +
                `_Escribe "0" para volver al menú principal._`
            );
        } else {
            await client.sendText(user, '⚠️ Opción no válida. Escribe el número de la categoría (ej: 1) o "0" para volver.');
        }
        return; 
    }

    // CASO B: MENÚ PRINCIPAL
    if (chatState[user].step === 'MAIN_MENU') {

        // Saludo
        if (['hola', 'buenas', 'dias', 'tardes'].some(w => text.includes(w))) {
            await simulateTyping(client, user);
            await client.sendText(user, 
                `👋 ¡Hola! Bienvenido a *Wanderlust Turismo*.\n\n` +
                `1️⃣ Ver Categorías de Excursiones\n` +
                `2️⃣ Ubicación\n` +
                `3️⃣ Tips de Viaje\n` +
                `4️⃣ Hablar con un Asesor`
            );
            return;
        }

        // OPCIÓN 1: IR A SUB-MENÚ
        if (text === '1' || text.includes('excursiones') || text.includes('ver')) {
            chatState[user].step = 'SELECT_CATEGORY'; 
            await simulateTyping(client, user);
            
            let menu = '🏔️ *Selecciona una categoría:*\n\n';
            CATEGORIES.forEach((cat, index) => {
                menu += `${index + 1}. ${cat.label}\n`;
            });
            menu += '\n✍️ *Envía el número de tu interés (ej: 1)*\n\n🔙 O escribe *0* para volver atrás.';

            await client.sendText(user, menu);
            return;
        }

        // OPCIÓN 2: Ubicación
        if (text === '2' || text.includes('ubicacion')) {
            await simulateTyping(client, user);
            await client.sendText(user, `📍 Estamos en Av. San Martín 123, Mendoza.\n⏰ Lun-Vie 9-18hs.`);
            return;
        }

        // OPCIÓN 3: Tips
        if (text === '3' || text.includes('tips')) {
            await simulateTyping(client, user);
            await client.sendText(user, `🎒 *Tips:* Lleva agua, gorra y abrigo para alta montaña.`);
            return;
        }

    if (text === '4' || text.includes('asesor') || text.includes('humano')) {
        chatState[user].mode = 'human'; 
        
        // 1. Responder al cliente
        await simulateTyping(client, user);
        await client.sendText(user, '👨‍💻 *Aguarda unos instantes.* Un asesor te escribirá pronto por acá.');
  
        // 2. Notificar al dueño
        // Obtenemos el nombre del perfil (pushname) o usamos 'Cliente' si no tiene
        const contactName = message.sender?.pushname || message.sender?.formattedName || 'Cliente';
  
        await client.sendText(OWNER_NUMBER, 
            `🔔 *ALERTA TURISUITE*\n\n` +
            `👤 *Cliente:* ${contactName}\n` +
            `⚠️ Ha solicitado hablar con un humano y el bot se ha desactivado para este chat.\n\n` +
            `👉 *Por favor, revisa el dispositivo del bot para contestar manualmente.*`
        );
  
        return;
      }
    }
  });
}

async function simulateTyping(client, user) {
  await client.startTyping(user);
  const delay = Math.floor(Math.random() * 800) + 500; 
  await new Promise(resolve => setTimeout(resolve, delay));
  await client.stopTyping(user);
}