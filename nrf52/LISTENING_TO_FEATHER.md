# LISTENING TO SERIAL COMMUNICATION ON FEATHER:
1)	Download PuTTY from their official site.
2)	Open putty, and change connection type to Serial.
3)	Change serial line to COM6, and set speed to 1000000 (1 million, AKA six 0s.)
4)	Click "Open" at the bottom, a new window will open and text sent from the board will appear on-screen.


# TROUBLESHOOTING:
## Double-check that the correct serial line is COM6.
### For windows:
1) Open device manager. (Enhetsbehandling på norsk.)
2) Under *Ports (COM and LPT)*, check at the end of *Silicon Labs CP210x USB to UART Bridge* which serial line it's connected to.
### For Mac/OSX:
TBD
### For Linux:
TBD

## Double-check whether the baud-rate for the serial line has been changed from 1 million (the "speed" in PuTTY) to something else.
If this has been changed, the new speed should be in the devicetree overlay for the circuitdojo_feather_nrf9160.