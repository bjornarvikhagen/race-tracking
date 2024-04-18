import logging
import os
import subprocess
import sys

logging.basicConfig(level=logging.INFO)


def _run(cmd: list[str], env=None) -> int:
    try:
        process = subprocess.Popen(cmd, env=env, stdin=sys.stdin, stdout=sys.stdout)
        process.communicate()
        exit_code = process.returncode
    except KeyboardInterrupt:
        exit_code = 0
    if exit_code != 0:
        sys.exit(exit_code)
    return exit_code


CMD = [
    "uvicorn",
    "api.main:app",
    "--ws-max-size",
    "4096",
    "--ws-ping-interval",
    "300",
    "--ws-ping-timeout",
    "300",
    "--host",
    "0.0.0.0",
    "--port",
    "80",
    "--reload",
]


def _start_fwdservice():
    # Start fwdservice.py as a subprocess
    return subprocess.Popen(["python", "fwdservice/fwdservice.py"])


def dev():
    # Start the forward service
    fwdservice_process = _start_fwdservice()
    try:
        # Start the Uvicorn server
        _run(CMD)
    finally:
        # Ensure fwdservice.py is terminated when the Uvicorn server stops
        fwdservice_process.terminate()
        fwdservice_process.wait()


def test():
    cmd = ["pytest"]

    env = os.environ.copy()
    env["ENVIRONMENT"] = "test"

    return _run(cmd, env=env)


def lint():
    _run(["ruff", "check", "."])
    _run(["black", ".", "--check"])


def check():
    lint()
    test()
