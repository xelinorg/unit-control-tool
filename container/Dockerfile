# Keep our base image as specific as possible.
FROM nginx/unit:1.23.0-node15

# Same as "working_directory" in config.json.

RUN mkdir -p /www/unit-control-tool
RUN mkdir -p /www/work

COPY unit-control-tool/index.js /www/unit-control-tool/

COPY unit-control-tool/work/unit-wrap.js /www/work/

COPY unit-control-tool/package.json /www

WORKDIR /www

RUN npm install --only=production

# Port used by the listener in config.json.
EXPOSE 36936-36963
