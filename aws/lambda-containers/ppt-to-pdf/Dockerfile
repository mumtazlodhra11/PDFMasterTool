# Lambda Container with LibreOffice for PowerPoint to PDF
FROM public.ecr.aws/lambda/nodejs:20

# Install LibreOffice and dependencies (including NSS libraries)
RUN dnf install -y \
    wget \
    tar \
    gzip \
    findutils \
    java-21-amazon-corretto \
    fontconfig \
    libXinerama \
    cups-libs \
    dbus-glib \
    cairo \
    libSM \
    nss \
    nss-softokn \
    && dnf clean all

# Download and install LibreOffice 7.6
RUN cd /tmp && \
    wget https://downloadarchive.documentfoundation.org/libreoffice/old/7.6.4.1/rpm/x86_64/LibreOffice_7.6.4.1_Linux_x86-64_rpm.tar.gz && \
    tar -xzf LibreOffice_7.6.4.1_Linux_x86-64_rpm.tar.gz && \
    cd LibreOffice_7.6.4.1_Linux_x86-64_rpm/RPMS && \
    rpm -Uvh --nodeps *.rpm && \
    rm -rf /tmp/LibreOffice*

# Create symlinks for LibreOffice (force if exists)
RUN ln -sf /opt/libreoffice7.6/program/soffice /usr/bin/libreoffice7.6 && \
    ln -sf /opt/libreoffice7.6/program/soffice /usr/bin/soffice && \
    ln -sf /opt/libreoffice7.6/program/soffice /usr/bin/libreoffice

# NSS libraries are now installed via dnf above
# Verify NSS libraries are available
RUN ls -la /usr/lib64/libnss3.so* /usr/lib64/libssl3.so* /usr/lib64/libsmime3.so* 2>/dev/null || echo "NSS libraries installed"

# Copy function code
COPY package*.json ${LAMBDA_TASK_ROOT}/
RUN npm install --omit=dev
COPY ppt-to-pdf.js ${LAMBDA_TASK_ROOT}/

# Set HOME for LibreOffice temp files
ENV HOME=/tmp

CMD [ "ppt-to-pdf.handler" ]


