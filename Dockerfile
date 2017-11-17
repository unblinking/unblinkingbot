FROM nothingworksright/amd64_debian_systemd

# Update sources, install curl and build-essential
RUN apt-get update && apt-get install -y \
    curl \
    build-essential

# Use curl to get and install nodejs 8.x
RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
RUN apt-get install -y nodejs

# Prepare the unblinkingbot application files and directories
RUN mkdir -p /usr/local/unblinkingbot
RUN mkdir -p /usr/local/unblinkingbot/db
RUN mkdir -p /usr/local/unblinkingbot/motion
WORKDIR /usr/local/unblinkingbot
COPY . /usr/local/unblinkingbot
RUN yarn

# Prepare the unblinkingBot systemd based service
COPY unblinkingbot.service /lib/systemd/system/unblinkingbot.service
RUN systemctl enable unblinkingbot.service

# Listens to the specified network port at runtime
# Using port 1138, hopefully not already in use
EXPOSE 1138

# Run systemd
CMD [ "/sbin/init" ]
