# ---- Base: Debian slim for easy apt install ----
FROM debian:bookworm-slim

# Avoid tz prompt; keep image small
ENV DEBIAN_FRONTEND=noninteractive \
    HOME=/tmp \
    TMPDIR=/tmp \
    NODE_ENV=production

# Install Node.js 20 + LibreOffice (headless capable) + required libs + fonts
# Keep it minimal: writer/calc/impress + core + GS + basic X libs used by LO even in headless
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates curl xz-utils \
      nodejs npm \
      libreoffice-core libreoffice-writer libreoffice-calc libreoffice-impress \
      libreoffice-common \
      ghostscript \
      # common runtime libs that prevent LO crashes in headless
      libc6 libgcc1 libstdc++6 libx11-6 libxext6 libxrender1 libxinerama1 libsm6 libice6 \
      libxrandr2 libglu1-mesa \
      # fonts to avoid garbled PDFs
      fonts-dejavu fonts-liberation fonts-noto-core fonts-noto-cjk fonts-noto-color-emoji \
      # optional: basic xfonts (some docs need metrics)
      xfonts-base \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# App deps
WORKDIR /var/task
COPY package*.json ./
RUN npm ci --omit=dev && npm i aws-lambda-ric

# App code
COPY *.mjs ./

# Helpful envs for LibreOffice stability in headless
ENV UNO_DISABLE_ENV=true \
    SAL_USE_VCLPLUGIN=headless \
    HOME=/tmp

# Lambda entry via aws-lambda-ric (Node 20)
# index.handler => export const handler = ...
ENTRYPOINT ["node", "node_modules/aws-lambda-ric/bin/cli.mjs"]
CMD ["index.handler"]


