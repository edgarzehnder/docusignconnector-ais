FROM node:4
MAINTAINER Eva Ramon <eva.ramon@swisscom.com>

# Set workdir to /app
RUN mkdir -p /app
WORKDIR /app

# Bundle app source 
COPY package.json /app/
COPY oauth.js /app/
COPY dsrequest.js /app/
COPY signrequest.js /app/
COPY server.js /app/

# Install npm dependencies
RUN npm install

# Volumes: configuration file and SSL keys
VOLUME /app/config

# Expose ports
EXPOSE 8001

# Run the server
CMD ["npm", "start"]
