# Using the Resin Base Images
# Useful for running systemd based services
# https://docs.resin.io/runtime/resin-base-images/
FROM resin/amd64-debian:jessie-20170304

# Enable the systemd init system
ENV INITSYSTEM on

# Update sources and install node.js
RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
RUN apt-get install -y nodejs

# Prepare the unblinkingbot application files
RUN mkdir -p /usr/local/unblinkingbot
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

##  Example docker commands
# 
# Building:
# docker build --rm --no-cache -t unblinkingbot .
# 
# Running:
# docker run --privileged --name unblinkingbot -v /sys/fs/cgroup:/sys/fs/cgroup:ro -p 1138:1138 -d unblinkingbot
#
##

