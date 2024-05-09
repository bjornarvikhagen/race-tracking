# Configuring the project information and credentials.
Several things are configurable to your specific environment, such as MQTT client and broker details.

## KConfig configurations / Project environment files.
All such configurables can be found in the [KConfig](../app/Kconfig) file, along with a short description to better understand what the configuration does.

If you wish to change something that is not already in the [prj.conf](../app/prj.conf) file, add the entry from the [KConfig](../app/Kconfig) file prefixed with `CONFIG_`.

Currently, the project only supports authenticated and unauthenticated connections via TCP/TLS, but regular TCP without TLS can be enabled with a few simple changes to the [mqtt_connection.c](../app/src/mqtt_connection.c) file.

## MQTT Broker certificate.
While peer verification with certificates can be disabled in the code, it is highly recommended for security reasons that you correctly download/generate and convert the certificate of your MQTT Broker for the project.

1. Open the Checkpoint folder of the repo in either VSCode, or a terminal of your choice that can run python 3. 

2. Delete the pre-existing [certificate.h](../app/src/certificate.h) file.

3. Copy your certificate file into the Checkpoint folder, and make sure it's in a .crt file format, and that it's named `server-certificate.crt`.

4. Run the crt_to_header.py script.

There should now be a new [certificate.h](../app/src/certificate.h) file with a certificate to your MQTT broker, formatted correctly for the nRF modem library to provision and use.