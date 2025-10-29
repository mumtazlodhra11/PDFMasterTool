# Google Cloud Run - Python + LibreOffice
FROM python:3.11-slim

# Install LibreOffice and dependencies
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Expose port (Cloud Run uses PORT env variable)
ENV PORT=8080
EXPOSE 8080

# Run the application
CMD exec uvicorn app:app --host 0.0.0.0 --port ${PORT} --workers 1


