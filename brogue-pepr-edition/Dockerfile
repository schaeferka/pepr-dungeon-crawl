FROM ubuntu:22.04

# Avoid prompts from apt-get asking for input during build
ARG DEBIAN_FRONTEND=noninteractive

# Install C build tools, VNC server, and xfce
RUN apt-get update && apt-get install -y \
    build-essential \
    libjansson-dev \
    libmicrohttpd-dev \
    libncurses5-dev \
    libsdl2-dev \
    libsdl2-image-dev \
    libpng-dev \
    libjpeg-dev \
    libtiff-dev \
    libwebp-dev \
    xfce4 \
    xfce4-goodies \
    x11vnc \
    xvfb \
    curl \
    net-tools \
    x11-xserver-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

RUN apt-get remove -y xfce4-power-manager && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

# Download kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && chmod +x ./kubectl \
    && mv ./kubectl /usr/local/bin/kubectl

# Set the working directory
WORKDIR /app

# Copy your Node.js and C application files
COPY . /app

# Make sure your start script is executable
RUN chmod +x /app/startgame.sh

# Create a desktop entry for the autostart
RUN mkdir -p /root/.config/autostart && \
    echo '[Desktop Entry]\nType=Application\nName=StartBrogue\nExec=/app/startgame.sh\nX-GNOME-Autostart-enabled=true' > /root/.config/autostart/startbrogue.desktop

# Disable xfwm4 compositing
RUN mkdir -p /root/.config/xfce4/xfconf/xfce-perchannel-xml && \
    echo '<?xml version="1.0" encoding="UTF-8"?><channel name="xfwm4" version="1.0"><property name="general" type="empty"><property name="use_compositing" type="bool" value="false"/></property></channel>' > /root/.config/xfce4/xfconf/xfce-perchannel-xml/xfwm4.xml

# Install Node.js dependencies for your app
RUN npm install

# Build your C application
RUN make all

# Set up VNC
ARG VNC_PASSWORD
RUN mkdir ~/.vnc \
    && x11vnc -storepasswd $VNC_PASSWORD ~/.vnc/passwd

# Expose the VNC port
EXPOSE 5900
EXPOSE 8888
EXPOSE 8889

ENV XDG_RUNTIME_DIR=/tmp

# Set up the X virtual framebuffer (Xvfb) in the background and start XFCE and x11vnc
CMD bash -c "Xvfb :1 -screen 0 1920x1080x24 & \
             while ! xset -display :1 q; do sleep 1; done; \
             DISPLAY=:1 xfce4-session & \
             export SDL_VIDEODRIVER=dummy; \
             DISPLAY=:1 xset r on & \
             DISPLAY=:1 x11vnc -display :1 -usepw -forever -o /var/log/x11vnc.log & \
             DISPLAY=:1 /app/brogue & \
             DISPLAY=:1 node /bin/client/notificationClient.js & \
             wait"
