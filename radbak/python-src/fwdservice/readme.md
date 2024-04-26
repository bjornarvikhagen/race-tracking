# Forward service
Forward service is a MQTT client which listenes to MQTT signals and subsequently calls API's post-requests for checkpoint-passing.

## SECURITY NOTE FOR PRODUCTION
Right now the certificate is placed in the repo, which is a security vulnerability we use only for this MVP testing purpose, and should otherwise never be done.

### Endpoints:
Port 1883 for TCP (standard)
Port 8883 for TLS (reccommended for security)
Broker adress: "o4b81453.ala.eu-central-1.emqxsl.com" For our cloud hosted broker on the internet.

For development we have an internal broker as well with adress: "host.docker.internal" for dockers internal "ip"-address when running locally.

### How to run:
Runs automatically together with the api.
See [README.md](../README.md) to run. Runs automatically with the 'poetry run dev' command.

Alternatively: run the fwdservice.py file directly.

### How to test:

For dev-environment: Enter "http://localhost:18083/#/websocket" in browser to access the mqtt broker.
For prod-environment: Enter "https://cloud-intl.emqx.com/console/deployments/o4b81453/overview"

Log in. Under "Diagnose/WebSocket Client" Create a proxy connection, subscribe it to the topic and try publishing messages. The payload should be visible in fwdservice terminal, and in the "recieved" table in the web-interface.
