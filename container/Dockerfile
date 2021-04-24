# Keep our base image as specific as possible.
FROM nginx/unit:1.23.0-node15

# Same as "working_directory" in config.json.
RUN mkdir -p /www/control
COPY unit-control-tool/* /www/control/

WORKDIR /www/control

RUN npm install

WORKDIR /www

# Port used by the listener in config.json.
EXPOSE 36936-36963
