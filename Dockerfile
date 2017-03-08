# Using the official CentOS systemd docker container
# Useful for running systemd based services
# https://hub.docker.com/r/centos/systemd/
FROM centos/systemd

# Update sources and install node.js
RUN yum -y update; yum clean all
RUN curl --silent --location https://rpm.nodesource.com/setup_6.x | bash -
RUN yum -y install nodejs; yum clean all

# Prepare the unblinkingbot application files
RUN mkdir -p /unblinkingbot
WORKDIR /unblinkingbot
COPY . /unblinkingbot
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