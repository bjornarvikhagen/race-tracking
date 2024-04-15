# MQTT Client subscribing to the MQTT broker and calling the API endpoint with the data

# Import necessary libraries
import json
import random

import paho.mqtt.client as mqtt
import paho.mqtt.enums as mqtt_enums
import requests

# Define the API endpoint
api_endpoint = "http://localhost:80/checkpoint_passing"  # Real endpoint to send checkpoint passings


# MQTT broker details
# Some docs on docker to find ports https://www.emqx.io/docs/en/latest/deploy/install-docker.html
# And for the dashboard: https://www.emqx.io/docs/en/latest/messaging/publish-and-subscribe.html#dashboard-websocket
broker_port = 1883  # EMQX default TCP listener
broker_address = "host.docker.internal"  # Docker host address

topic = "testtopic/1"  # The topic to which you want to publish/listen  # TODO: Change to real topic
client_id = f"python-mqtt-{random.randint(0, 1000)}"  # Random ID as the MQTT client-ID
username = "Erik"
password = "Erik"


# Define the callback function for when a message is received
def on_message(client, userdata, message):
    # Extract the message payload
    print("Message recieved!")
    data = message.payload.decode()
    print(f"{message.timestamp} | {data}")

    # Assume messages are recieved like this:
    # CheckpointID:RFID:Timestamp
    # Example: 3:Tag1:2024-04-15T11:39:02.561Z  # Tag1 belongs to Erik

    # Format the message data
    split_data = data.split(":")
    checkpoint_id = split_data[0]
    rfid = split_data[1]
    timestamp = ":".join(split_data[2:])

    api_payload = {
        "TagID": rfid,
        "CheckpointID": checkpoint_id,
        "PassingTime": timestamp,
    }
    print("Sending pyload: ", str(api_payload))

    # Make a POST request to the API with the message data
    response = requests.post(
        # api_endpoint, data=json.dumps(api_payload)
        api_endpoint,
        data=json.dumps(api_payload),
    )

    if response.status_code == 200:
        print("Data successfully forwarded to API!")
    else:
        print("Failed to send data to API...")


# Callback when the client receives a CONNACK response from the server. I.e. This is called once we have a connection.
def on_connect(client, userdata, flags, rc, properties):
    if rc == 0:
        print("Connected to MQTT Broker!")

        # Subscribing in on_connect() means that if we lose the connection and
        # reconnect then subscriptions will be renewed.
        client.subscribe(topic, qos=0)

    else:
        print("Failed to connect, return code %d\n", rc)


def on_subscribe(client, userdata, mid, reason_code_list, properties):
    print(f"Subscribed to topic {topic} with return properties of {reason_code_list}")


def connect_to_mqtt():
    # Create a new MQTT client instance
    client = mqtt.Client(
        callback_api_version=mqtt_enums.CallbackAPIVersion.VERSION2, client_id=client_id
    )
    client.username_pw_set(username, password)
    # client.tls_set(ca_certs="./pythonMQTTClient/emqxsl-ca.crt")

    # Assign the on_connect callback function
    client.on_connect = on_connect

    # Set the on_message function
    client.on_message = on_message

    # Confirm subscription status
    client.on_subscribe = on_subscribe

    # Connect to the broker
    print(f"Connecting to {broker_address}")
    client.connect(broker_address, broker_port, keepalive=60)

    # Publishing a hello-message to a topic
    client.publish(topic, "Hello, EMQX!")

    # Blocking call that processes network traffic, dispatches callbacks, and handles reconnecting.
    client.loop_forever(timeout=3600 * 10)  # 10 hour timeout for now


if __name__ == "__main__":
    connect_to_mqtt()
