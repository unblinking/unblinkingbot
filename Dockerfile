FROM nothingworksright/amd64_debian_node

# Enable the systemd init system
ENV INITSYSTEM on

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
CMD [ "/usr/sbin/init" ]
