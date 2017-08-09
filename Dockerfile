FROM nothingworksright/amd64_debian_systemd

# Enable the systemd init system
ENV INITSYSTEM on

# Update sources, install curl and build-essential
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential

# Use curl to get and install nodejs 8.x
RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
RUN apt-get install -y nodejs

# Prepare the unblinkingbot application files and directories
RUN mkdir -p /usr/local/unblinkingbot
RUN mkdir -p /usr/local/unblinkingbot/db
WORKDIR /usr/local/unblinkingbot
COPY . /usr/local/unblinkingbot
RUN npm install

# Prepare the unblinkingBot systemd based service
COPY unblinkingbot.service /lib/systemd/system/unblinkingbot.service
RUN systemctl enable unblinkingbot.service

# Listens to the specified network port at runtime
# Using port 1138, hopefully not already in use
EXPOSE 1138

# Run systemd
CMD [ "/sbin/init" ]
