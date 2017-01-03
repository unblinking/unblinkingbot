FROM centos/systemd

# Prepare the required installations
RUN yum -y update; yum clean all
RUN curl --silent --location https://rpm.nodesource.com/setup_6.x | bash -
RUN yum -y install nodejs; yum clean all

# Prepare the unblinkingPi application
RUN mkdir -p /unblinkingbot
WORKDIR /unblinkingbot
COPY . /unblinkingbot
RUN npm install
COPY unblinkingbot.service /lib/systemd/system/unblinkingbot.service
RUN systemctl enable unblinkingbot.service

# Start the unblinkingPi application
EXPOSE 1138
CMD [ "/usr/sbin/init" ]

##  Example docker commands
# 
# Building:
# docker build --rm --no-cache -t unblinkingbot .
# 
# Running:
# docker run --privileged --name unblinkingbot -v /sys/fs/cgroup:/sys/fs/cgroup:ro -p 1138:1138 -d unblinkingbot