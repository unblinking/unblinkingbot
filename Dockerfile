FROM nothingworksright/amd64_debian_jessie_node

# Enable the systemd init system
ENV INITSYSTEM on

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
# docker build --rm --no-cache -t nothingworksright/unblinkingbot:latest .
# 
# Running:
# docker run --privileged --name unblinkingbot -v /sys/fs/cgroup:/sys/fs/cgroup:ro -p 1138:1138 -d nothingworksright/unblinkingbot:latest
# 
##