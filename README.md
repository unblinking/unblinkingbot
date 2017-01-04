# unblinkingBot  

A Slack bot starting point.  

## Try it out  

To clone, build, and run the unblinkingBot as a docker container:  

```Bash
git clone https://github.com/nothingworksright/unblinkingBot.git
cd unblinkingBot
docker build --rm --no-cache -t unblinkingbot .
docker run --privileged --name unblinkingbot -v /sys/fs/cgroup:/sys/fs/cgroup:ro -p 1138:1138 -d unblinkingbot
```

