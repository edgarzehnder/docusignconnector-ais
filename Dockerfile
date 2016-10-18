FROM node:4
MAINTAINER Eva Ramon <eva.ramon@swisscom.com>


# Environment
ENV WORK=/opt/work
RUN mkdir -p $WORK
WORKDIR $WORK

# Install npm dependencies
COPY package.json $WORK/package.json
RUN npm install

# Bundle app source 
COPY oauth.js $WORK/oauth.js
COPY dsrequest.js $WORK/dsrequest.js
COPY signrequest.js $WORK/signrequest.js
COPY signrequest.js $WORK/server.js

# Volumes: configuration file and SSL keys
VOLUME $WORK/config

# Expose ports
EXPOSE 8001

# Run the server
CMD ["npm", "start"]

