# Setting up the program with the CircuitDojo nRF9160 Feather

This guide aims at getting the project built and running on the CircuitDojo nRF9160 Feather using a computer with Windows. The setup might differ slightly accross operating systems.

1. Download and install the CircuitDojo SDK by following the instructions in the [official CircuitDojo documentation](https://docs.circuitdojo.com/nrf9160-getting-started.html).

2. Clone the repo into a folder of your choice.<br/>
Note: It's recommended to use a short filepath, such as `C:/code/clonedrepo` due to some of the deeply nested folders of the documentation. Cloning the repo into a long filepath could cause filepath too long errors when downloading dependencies.

3. Open the Checkpoint folder from the full repo in VSCode, press Ctrl + Shift + P to open the commands widget, and run `Zephyr Tools: Create Project`.

4. Now open the commands widget again and run `Zephyr Tools: Download Dependencies`.<br/>
Note: Sometimes, it may be required to run Download Dependencies two or three times for it to fully finish, as it may occasionally terminate early with no error or warning. For reference, the last step in the Download Dependencies command is downloading python requirements.

5. Run `Zephyr Tools: Change Board` and set it to `circuitdojo_feather_nrf9160_ns`. Also run `Zephyr Tools: Change Project` and change the project to `$YOUR_FILEPATH_TO_REPO/Checkpoint/app`.

6. Now, you can run `Zephyr Tools: Build` to build the project, then `Zephyr Tools: Load via Bootloader and Monitor` to flash to your device via USB-C.

## Troubleshooting
* You may be required to manually configure serial at some point. For the CircuitDojo nRF9160 Feather, the baud rate is 1000000, and the port can be found in Device Manager in Windows.

* In rare cases, you may be required to copy all the contents from the `deps` folder into the Checkpoint folder for Zephyr Tools to find all the dependencies properly.

* NMP Timeout while loading via bootloader: If this error occurs, then Zephyr Tools was not able to put the device into bootloader mode via USB. To manually put the Feather into bootloader mode:
  1. Hold the MODE button.
  2. While holding the MODE button, press the RESET button.
  3. Keep holding the MODE button until the blue led is on.

  You should now be able to load the built program via bootloader.