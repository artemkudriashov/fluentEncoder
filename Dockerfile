FROM jrottenberg/ffmpeg

RUN yum install -y \
  curl \
  git

RUN mkdir /nodejs && curl http://nodejs.org/dist/v0.12.0/node-v0.12.0-linux-x64.tar.gz | tar xvzf - -C /nodejs --strip-components=1

ENV PATH $PATH:/nodejs/bin

RUN mkdir /fluent 

WORKDIR /fluent

#COPY app/ app/
git clone https://github.com/artemkudriashov/fluentEncoder.git /fluent

WORKDIR /fluent/app/

RUN ["npm", "install"]

ENV FFMPEG_PATH=/usr/local/bin/ffmpeg

ENV FFPROBE_PATH=/usr/local/bin/ffprobe

ENTRYPOINT ["npm", "start"]

EXPOSE 3001




