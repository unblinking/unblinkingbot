[![Docker Stars](https://img.shields.io/docker/stars/nothingworksright/unblinkingbot.svg)](https://hub.docker.com/r/nothingworksright/unblinkingbot/)  [![Docker Pulls](https://img.shields.io/docker/pulls/nothingworksright/unblinkingbot.svg)](https://hub.docker.com/r/nothingworksright/unblinkingbot/)  [![Docker Automated build](https://img.shields.io/docker/automated/nothingworksright/unblinkingbot.svg)](https://hub.docker.com/r/nothingworksright/unblinkingbot/)  
[![Code Climate](https://codeclimate.com/github/nothingworksright/unblinkingbot/badges/gpa.svg)](https://codeclimate.com/github/nothingworksright/unblinkingbot) [![Test Coverage](https://codeclimate.com/github/nothingworksright/unblinkingbot/badges/coverage.svg)](https://codeclimate.com/github/nothingworksright/unblinkingbot/coverage) [![Issue Count](https://codeclimate.com/github/nothingworksright/unblinkingbot/badges/issue_count.svg)](https://codeclimate.com/github/nothingworksright/unblinkingbot)  

# Unblinking Bot  

Another Slack bot.  

![unblinkingbot logo](https://raw.githubusercontent.com/nothingworksright/unblinkingbot/gh-pages/android-chrome-192x192.png "unblinkingbot logo")

## Why  

Make it easy to get started on a new Slack bot.  

The bot serves a website where you paste in a Slack bot token. Once the token has been saved you can immediately talk to the bot through Slack. As it is, mentioning the bot's name in a direct message or channel with the bot will trigger a response of "That's my name, don't wear it out!" but the bot does nothing else.  

Fork this repository and then customize the bot for your own needs. Add other fun message responses, schedule tasks for home automation or server maintenance, setup notifications for important events, etc.  

## Try it out  

The bot can be run as a docker container. Using this method avoids installing it as a systemd based service directly on your Linux machine.  

Run these two commands to pull and then run the unblinkingbot Docker image from Docker Hub:  

```Bash
docker pull nothingworksright/unblinkingbot
docker run --privileged --name unblinkingbot -v /sys/fs/cgroup:/sys/fs/cgroup:ro -p 1138:1138 -d unblinkingbot
```

On the same machine running the docker container, open a web browser and go to [http://127.0.0.1:1138](http://127.0.0.1:1138).  

Use the settings page to save your own Slack bot token.  

Open your Slack app and say hello to the unblinkingbot.  

![unblinkingbot in Slack](https://raw.githubusercontent.com/nothingworksright/unblinkingbot/gh-pages/slack.png "unblinkingbot in Slack")  

## More  

Screenshots are at [http://unblinkingbot.com/](http://unblinkingbot.com/).  

## Show your support  

Support this project by [making a pledge via Patreon](https://www.patreon.com/jmg1138).  
