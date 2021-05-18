FROM alpine:3.10

# Variables de entorno
ENV HOME=/PFG-Survivor
ENV ANGULAR_CLI_VERSION=8.1.0

RUN mkdir $HOME
WORKDIR $HOME

# Instalación node npm angular
RUN apk add --update nodejs nodejs-npm
RUN npm install -g @angular/cli@$ANGULAR_CLI_VERSION

COPY ./ /PFG-Survivor

# Puertos
EXPOSE 4200

# Comandos de entrada cuando el contenedor se lanze 
CMD sh -c "npm install; npm run start"
