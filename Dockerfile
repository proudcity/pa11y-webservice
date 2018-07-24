# This Dockerfile uses the stock node container for Node.js, release 8.X (latest)

FROM node:8

# install ssh for npm git and phantom dep
RUN apt-get update && apt-get -y install ssh libfontconfig libfreetype6

# https://github.com/nodejs/docker-node/issues/479#issuecomment-319446283
# and https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#global-npm-dependencies
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
# optionally if you want to run npm global bin without specifying path
ENV PATH=$PATH:/home/node/.npm-global/bin
ENV NODE_ENV="production"

# Copy app's source code to the /app directory
COPY . /home/node/app

# The application's directory will be the working directory
WORKDIR /home/node/app

# Install Node.js dependencies defined in '/app/packages.json'
RUN npm install

EXPOSE 3000

USER node
# Start the application
CMD ["npm", "start"]