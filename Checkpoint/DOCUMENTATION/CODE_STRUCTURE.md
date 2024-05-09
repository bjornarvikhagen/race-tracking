# Short write-up on structure of checkpoint code.
## [src/main.c](../app/src/main.c)
Runs the main thread to initialize the various other parts of the code, before terminating the thread.
This file also includes the entry function for the NFC reader thread.

## [src/network.c](../app/src/network.c)
Contains the code related to dealing with the cellular network connection and modem configurations. It also includes an event handler for updates from the modem. Additionally, This file includes the entry functions for the two other permanent threads:
* The thread for keeping the MQTT connection to the broker alive.
* The thread for publishing data to the broker as soon as it's present in the passing buffer.

## [src/mqtt_connection.c](../app/src/mqtt_connection.c)
Contains code for managing the MQTT connection, including publishing and receiving data from the broker.<br/>
See [here](CONFIGURING_PROJECT.md) for details on changing MQTT broker/client information and credentials.

## [src/nfc.c](../app/src/nfc.c)
Contains all code relating to setting up the NFC module, and sending/receiving messages to/from it.

## [src/passing_buffer.c](../app/src/passing_buffer.c)
Simple queue data structure for storing RFID reads.

## [src/certificate.h](../app/src/certificate.h)
Server certificate for the MQTT broker, instructions for changing this, as well as MQTT client credentials, are located [here](CONFIGURING_PROJECT.md).

## [KConfig](../app/Kconfig)
Contains definitions and default values for configurable project/environment variables.

## [prj.conf](../app/prj.conf)
Contains overrides for default KConfig values, as well as all the enabled parts of the nRF SDK.