cmake_minimum_required(VERSION 3.20.0)
find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})

project(i2ctest)

target_sources(app PRIVATE src/main.c)
target_sources(app PRIVATE src/nfc.c)
target_sources(app PRIVATE src/passing_buffer.c)
