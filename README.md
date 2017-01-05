[![Code Climate](https://codeclimate.com/github/nothingworksright/unblinkingbot/badges/gpa.svg)](https://codeclimate.com/github/nothingworksright/unblinkingbot) [![Test Coverage](https://codeclimate.com/github/nothingworksright/unblinkingbot/badges/coverage.svg)](https://codeclimate.com/github/nothingworksright/unblinkingbot/coverage) [![Issue Count](https://codeclimate.com/github/nothingworksright/unblinkingbot/badges/issue_count.svg)](https://codeclimate.com/github/nothingworksright/unblinkingbot)

# unblinkingbot  

Another Slack bot.  

![unblinkingbot logo](public/images/android-chrome-192x192.png "unblinkingbot logo")

## Try it out  

To clone, build, and run the unblinkingbot as a docker container:  

```Bash
git clone https://github.com/nothingworksright/unblinkingbot.git
cd unblinkingbot
docker build --rm --no-cache -t unblinkingbot .
docker run --privileged --name unblinkingbot -v /sys/fs/cgroup:/sys/fs/cgroup:ro -p 1138:1138 -d unblinkingbot
```

Find the IP address of the machine running the docker container. Open a web browser and type the IP address with port 1138. If the machine's IP address is 192.168.0.38, go to [http://192.168.0.42:1138](http://192.168.0.42:1138). If the web browser is on the same machine as the docker container, try [http://127.0.0.1:1138](http://127.0.0.1:1138).  

Use the settings page to save your own Slack bot token.  

Open your Slack app and say hello to the unblinkingbot.

## More  

Screenshots are at [http://unblinkingbot.com/](http://unblinkingbot.com/).

