FROM nothingworksright/amd64_debian_jessie_node

# Enable the systemd init system
ENV INITSYSTEM on

# Prepare the unblinkingbot application files and directories
RUN mkdir -p /usr/local/unblinkingbot
RUN mkdir -p /usr/local/unblinkingbot/caps
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

##  Example docker commands
# 
# Building:
# docker build --rm --no-cache -t nothingworksright/unblinkingbot:0.0.1 .
# 
# Running:
# docker run --restart=always --detach --publish 1138:1138 --name unblinkingbot --volume /etc/localtime:/etc/localtime:ro --volume /sys/fs/cgroup:/sys/fs/cgroup:ro --volume /mnt/4tb/unblinkingbot/db:/usr/local/unblinkingbot/db --volume /mnt/4tb/motion/captured:/usr/local/unblinkingbot/caps nothingworksright/unblinkingbot:0.0.1
# 
##