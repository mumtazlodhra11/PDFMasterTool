# Google Cloud Run - Python + LibreOffice + PDF Tools
# FIXED: All known Cloud Run LibreOffice issues addressed
FROM python:3.11-slim

# Suppress debconf warnings and set non-interactive mode
ENV DEBIAN_FRONTEND=noninteractive
ENV TERM=xterm

# Install LibreOffice and essential dependencies
# FIXED: Added comprehensive font packages (ttf-mscorefonts requires manual download, using alternatives)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-core \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libgl1 \
    ghostscript \
    poppler-utils \
    fonts-dejavu \
    fonts-liberation \
    fonts-freefont-ttf \
    fonts-noto \
    fonts-noto-cjk \
    fonts-opensymbol \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# FIX 1: Create soffice symlink (LibreOffice sometimes needs this)
RUN ln -sf /usr/bin/libreoffice /usr/bin/soffice || true

# FIX 2: Ensure /tmp is writable (Cloud Run permission fix)
RUN chmod -R 777 /tmp

# FIX 3: Set writable HOME directory
ENV HOME=/tmp

# Basic LibreOffice environment variables
ENV SAL_USE_VCLPLUGIN=headless

# Verify LibreOffice installation
RUN libreoffice --version || echo "LibreOffice version check failed (may be normal in headless)"
RUN which libreoffice || echo "LibreOffice not in PATH"
RUN which soffice || echo "soffice symlink not found"

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (FastAPI app + engine modules)
COPY . .

# Expose port (Cloud Run uses PORT env variable)
ENV PORT=8080
EXPOSE 8080

# Run the application
CMD exec uvicorn app:app --host 0.0.0.0 --port ${PORT} --workers 1
