[![Docker Stars](https://img.shields.io/docker/stars/nothingworksright/unblinkingbot.svg)](https://hub.docker.com/r/nothingworksright/unblinkingbot/)  [![Docker Pulls](https://img.shields.io/docker/pulls/nothingworksright/unblinkingbot.svg)](https://hub.docker.com/r/nothingworksright/unblinkingbot/)  [![Docker Automated build](https://img.shields.io/docker/automated/nothingworksright/unblinkingbot.svg)](https://hub.docker.com/r/nothingworksright/unblinkingbot/)  
[![Code Climate](https://codeclimate.com/github/nothingworksright/unblinkingbot/badges/gpa.svg)](https://codeclimate.com/github/nothingworksright/unblinkingbot) [![Test Coverage](https://codeclimate.com/github/nothingworksright/unblinkingbot/badges/coverage.svg)](https://codeclimate.com/github/nothingworksright/unblinkingbot/coverage) [![Issue Count](https://codeclimate.com/github/nothingworksright/unblinkingbot/badges/issue_count.svg)](https://codeclimate.com/github/nothingworksright/unblinkingbot)  

# Unblinking Bot  

Another [Slack](https://api.slack.com/bot-users) bot.  

![unblinkingbot logo](https://raw.githubusercontent.com/nothingworksright/unblinkingbot/gh-pages/android-chrome-192x192.png "unblinkingbot logo")

## Why  

Make it easy to get started on a new [Slack](https://api.slack.com/bot-users) bot.  

Once running, the bot serves a website where you paste in your [Slack](https://api.slack.com/bot-users) bot token and save it. After that, you can immediately talk to the bot through [Slack](https://api.slack.com/bot-users). As it is, mentioning the bot's name in a direct message or channel with the bot will trigger a response of "That's my name, don't wear it out!" but the bot does nothing else.  

Fork this repository and then customize the bot for your own needs. Add other fun message responses, schedule tasks for home automation or server maintenance, setup notifications for important events, etc.  

## Try it out  

### As a [Docker](https://www.docker.com/) container  

The bot can be run as a [Docker](https://www.docker.com/) container. Using this method avoids installing it as a [systemd](https://www.freedesktop.org/wiki/Software/systemd/) based service directly on your Linux machine.  

To run the unblinkingbot [Docker](https://www.docker.com/) image from [Docker Hub](https://hub.docker.com/r/nothingworksright/unblinkingbot/):  

```Bash
docker run --privileged --name unblinkingbot -v /sys/fs/cgroup:/sys/fs/cgroup:ro -p 1138:1138 -d nothingworksright/unblinkingbot:latest
```

Once the container is running, open a web browser on the same machine and go to [http://127.0.0.1:1138](http://127.0.0.1:1138). To use a browser from a differet machine  

Use the settings page to save your own [Slack](https://api.slack.com/bot-users) bot token.  

Open your [Slack](https://api.slack.com/bot-users) app and say hello to the unblinkingbot.  

![unblinkingbot in Slack](https://raw.githubusercontent.com/nothingworksright/unblinkingbot/gh-pages/slack.png "unblinkingbot in Slack")  

## More  

Screenshots are at [http://www.unblinkingbot.com/](http://www.unblinkingbot.com/).  

## Show your support  

Support this project by [making a pledge via Patreon](https://www.patreon.com/jmg1138).  
