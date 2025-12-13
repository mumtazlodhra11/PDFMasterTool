FROM node:18-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-l10n-en-gb \
    libreoffice-help-en-gb \
    python3 \
    python3-uno \
    unoconv \
    ghostscript \
    fonts-dejavu \
    fonts-liberation \
    libgl1 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Set environment variables for LibreOffice headless mode
ENV SAL_USE_VCLPLUGIN=headless
ENV HOME=/tmp

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
RUN chmod +x ./src/utils/excelToPdfWithPageSetup.py

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "src/server.js"]

