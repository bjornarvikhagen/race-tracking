## BUILDING THE APP:

1.	Create a build configuration for the circuitdojo_feather_nrf9160 (both listed boards will work fine) using the nRF Toolchain.

2.	Build the configuration, and locate the build you just made. 
    F.ex: <project_root_folder>/build/zephyr/app_update.bin
    
    NOTE: If you have multiple build configurations, make sure you're in the right build folder. (Since the circuitdojo board was my 2nd build configuration, the build for it was located in the build_1 folder instead of the build folder.)

## SET UP NEWTMGR CLI:
### FOR WINDOWS:
Check if newtmgr already works from an nRF Connect terminal in VSCode by running newtmgr in it, if it works you can skip setting up newtmgr and move on to adding a profile.

Note: It does not help from my experience to edit the system environment variables, as the nRF terminal uses it's own PATH that I couldn't figure out how to make permanent changes to, so this was easier.

1.	Open an nRF Connect Terminal in VSCode and do type `echo %PATH%`

2.	Open any one of the filepaths from the PATH, preferably one with nordic semiconductor sdk files already in it.

3.	Copy `newtmgr.exe` from `%USERPROFILE%\.zephyrtools\newtmgr` and paste it into your chosen PATH folder.

Now newtmgr should work from an nRF Connect Terminal. Test it by running `newtmgr` in it.

### FOR MAX/OSX:
TBD

### FOR LINUX:
TBD

## ADD NEWTMGR PROFILE FOR FEATHER:
### FOR WINDOWS:
Run the command:

`newtmgr conn add feather type=serial connstring="dev=COM6,baud=1000000"`

This should add the correct profile for the device. If it does not work, double check that the COM port is correct  by opening device manager, expanding "Ports (COM and LPT)" and seeing which COM port it's connected to at the end in the parenthesis. 

F.ex.: "Silicon Labs CP210x USB to UART Bridge (**COM6**)"

### FOR MAX/OSX:
TBD

### FOR LINUX:
TBD

## FLASHING TO A DEVICE:
Make sure that you've built the program using the nRF Connect Toolchain we've been using for the other boards.

Before flashing, the device must be put into bootlodader mode.
To put the device into bootloader mode: 
1) Hold both the MODE and RST buttons. 
2) Let go of the RST button while still holding MODE for a few seconds. 
3) Let go of MODE after a few seconds. 

The blue light should now be lit, indicating the device is in boot mode and ready to be flashed.

Now run the command:

`newtmgr -c feather image upload <FEATHER_BUILD_FOLDER>/zephyr/app_update.bin`
	
Your application should now be flashed onto the device.

If this does not work, you may need to readd the feather profile to newtmgr.