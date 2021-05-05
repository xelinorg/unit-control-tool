# unit-control-tool

If you have docker you are ready to go, if not you should setup [nginx unit](https://unit.nginx.org/)

From the root directory of the repository `npm run build:docker && npm run run:docker`

When you are done  clean with `npm run clean:docker`

Using curl

Test connectivity 

`curl --location --head 'http://localhost:36963/`

Deploy the function

`curl --location --request POST 'http://localhost:36963/control/deploy/raw.githubusercontent.com/xelinorg/unit-web-function/master/unit-say-hello.js'`

Invoke the deployed function

`curl --location --request POST 'http://localhost:36937'`
