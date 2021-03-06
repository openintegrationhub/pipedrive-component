FROM node:12-alpine
LABEL NAME="pipedrive-connector"
LABEL MAINTAINER Ioannis Lafiotis "ioannis.lafiotis@cloudecosystem.org"
LABEL SUMMARY="This image is used to start the Pipedrive connector for OIH"

RUN apk --no-cache add \
    python \
    make \
    g++ \
    libc6-compat

WORKDIR /usr/src/app

COPY package.json /usr/src/app

RUN npm install --production

COPY . /usr/src/app

RUN chown -R node:node .

USER node

ENTRYPOINT ["npm", "start"]