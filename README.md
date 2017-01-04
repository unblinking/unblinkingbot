# unblinkingBot  

Another Slack bot, but easy.  

## Try it out  

To clone, build, and run the unblinkingBot as a docker container:  

```Bash
git clone https://github.com/nothingworksright/unblinkingBot.git
cd unblinkingBot
docker build --rm --no-cache -t unblinkingbot .
docker run --privileged --name unblinkingbot -v /sys/fs/cgroup:/sys/fs/cgroup:ro -p 1138:1138 -d unblinkingbot
```

Find the IP address of the machine running the docker container. Open a web browser and type the IP address with port 1138. If the machine's IP address is 192.168.0.38, go to [http://192.168.0.42:1138](http://192.168.0.42:1138). If the web browser is on the same machine as the docker container, try [http://127.0.0.1:1138](http://127.0.0.1:1138).
