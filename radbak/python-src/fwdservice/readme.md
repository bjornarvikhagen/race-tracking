# Forward service
Forward service is a MQTT client which listenes to MQTT signals and subsequently calls API's post-requests for checkpoint-passing.

### Endpoints:
Port 1883 for TCP (standard)
Broker adress: "host.docker.internal" for dockers internal "ip"-address when running locally.

### How to run:
See [README.md](../README.md) to run. Runs automatically with that 'poetry run dev' command.

### How to test:
Enter "http://localhost:18083/#/websocket" in browser to access the mqtt broker. Log in. Under "Diagnose/WebSocket Client" Create a proxy connection, subscribe it to the topic and try publishing messages. The payload should be visible in fwdservice terminal, and in the "recieved" table in the web-interface.
