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


def dev():
    _run(CMD)


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
