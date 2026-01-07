require('dotenv').config();
const wppconnect = require('@wppconnect-team/wppconnect');
const { createClient } = require('@supabase/supabase-js');


// Estado en memoria (Para saber si el bot está activo o en modo silencio)
const chatState = {};

// Datos "Hardcodeados" para la Demo (Simulando lo que vendría de Supabase)
const MOCK_EXCURSIONS = [
    { title_es: '🍷 Tour de Bodegas Luján', price_adult: 45000 },
    { title_es: '🏔️ Alta Montaña + Aconcagua', price_adult: 55000 },
    { title_es: '🏙️ City Tour Mendoza', price_adult: 15000 },
    { title_es: '🚣 Rafting Potrerillos', price_adult: 30000 }
];

// Iniciar WPPConnect
wppconnect
  .create({
    session: 'turibot-demo',
    catchQR: (base64Qr, asciiQR) => {
      console.log(asciiQR); // Muestra el QR en terminal
    },
    logQR: false, 
    headless: true, 
    devtools: false,
  })
  .then((client) => start(client))
  .catch((error) => console.log(error));

async function start(client) {
  console.log('🚀 Turibot (Modo Demo) está listo y escuchando...');

  client.onMessage(async (message) => {
    // --- FILTROS DE SEGURIDAD ---
    if (message.isGroupMsg) return; 
    if (message.body === null) return; 
    if (message.from === 'status@broadcast') return; 

    const user = message.from;
    const text = message.body.toLowerCase().trim();

    // Inicializar estado del usuario si es nuevo
    if (!chatState[user]) {
      chatState[user] = { mode: 'bot' }; // Modos: 'bot', 'human'
    }

    // --- COMANDO DE REACTIVACIÓN (Secreto para ti) ---
    if (text === 'bot on') {
      chatState[user].mode = 'bot';
      await client.sendText(user, '🤖 *Turibot reactivado.*');
      return;
    }

    // Si el modo es 'human', el bot NO responde nada
    if (chatState[user].mode === 'human') return;

    // --- FLUJO DEL BOT ---

    // 1. Saludo Inicial
    if (['hola', 'buenas', 'buenos dias', 'buenas tardes', 'inicio'].some(w => text.includes(w))) {
      await simulateTyping(client, user);
      await client.sendText(user, 
        `👋 ¡Hola! Soy el asistente virtual de *Turisuite*.\n\n` +
        `¿En qué puedo ayudarte hoy?\n\n` +
        `1️⃣ Ver Excursiones Disponibles\n` +
        `2️⃣ Hablar con un Asesor Humano`
      );
      return;
    }

    // 2. Ver Excursiones (DATOS FIJOS)
    if (text === '1' || text.includes('excursiones') || text.includes('ver')) {
      await simulateTyping(client, user);
      
      // Usamos la lista de arriba en lugar de consultar la base de datos
      let response = '🏔️ *Nuestras Experiencias Destacadas (Demo):*\n\n';
      
      MOCK_EXCURSIONS.forEach((exc, index) => {
        response += `*${index + 1}.* ${exc.title_es}\n   💲 $${exc.price_adult.toLocaleString('es-AR')}\n\n`;
      });
      
      response += '✍️ *Escribe el nombre de la excursión para reservar.*';

      await client.sendText(user, response);
      return;
    }

    // 3. Derivar a Humano
    if (text === '2' || text.includes('asesor') || text.includes('humano')) {
      chatState[user].mode = 'human'; // Apagamos el bot para este usuario
      
      await simulateTyping(client, user);
      await client.sendText(user, '👨‍💻 Entendido. *Desactivo mi sistema automático* para este chat.\n\nUn asesor humano leerá tu mensaje en breve y te responderá por aquí.');
      return;
    }
  });
}

// Función auxiliar para simular "Escribiendo..."
async function simulateTyping(client, user) {
  await client.startTyping(user);
  const delay = Math.floor(Math.random() * 1000) + 500; // Un poco más rápido para la demo
  await new Promise(resolve => setTimeout(resolve, delay));
}