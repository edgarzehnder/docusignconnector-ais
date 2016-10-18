FROM node:4
MAINTAINER Eva Ramon <eva.ramon@swisscom.com>

# Install npm dependencies
RUN npm install --save date-format express promise request sleep-async

# Environment
ENV WORK=/opt/work

# Add files <src> <destination> where <src> is a releative path to the build context
COPY oauth.js $WORK/oauth.js
COPY dsrequest.js $WORK/dsrequest.js
COPY signrequest.js $WORK/signrequest.js
COPY signrequest.js $WORK/server.js

# Volumes: configuration file and SSL keys
VOLUME $WORK/config

# Expose ports
EXPOSE 8001

# Run the server
WORKDIR $WORK
CMD $WORK/nodejs server.js

