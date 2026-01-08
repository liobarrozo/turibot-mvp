# Usamos una imagen de Node ligera pero compatible
FROM node:18-slim

# 1. Instalamos las librerías del sistema que Chromium necesita
# (Esto soluciona el error de libglib y otros)
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 2. Definimos el directorio de trabajo
WORKDIR /app

# 3. Copiamos los archivos de configuración e instalamos dependencias
COPY package*.json ./
RUN npm install

# 4. Copiamos el resto del código
COPY . .

# 5. Comando de inicio
CMD ["npm", "start"]