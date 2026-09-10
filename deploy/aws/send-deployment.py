#!/usr/bin/env python3
"""Deploy an existing release through SSM, without credentials or SSH on the host."""
import argparse
import json
import re
import shlex
import subprocess
import time


def aws(region, *args):
    return json.loads(subprocess.check_output(
        ["aws", "--region", region, *args, "--output", "json"], text=True,
    ))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--region", required=True)
    parser.add_argument("--instance", required=True)
    parser.add_argument("--bucket", required=True)
    parser.add_argument("--sha", required=True)
    args = parser.parse_args()
    for value, pattern in [(args.sha, r"[0-9a-f]{40}"),
                           (args.instance, r"i-[0-9a-f]+"),
                           (args.bucket, r"[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]"),
                           (args.region, r"[a-z]{2}-[a-z]+-\d")]:
        if not re.fullmatch(pattern, value):
            parser.error("Invalid deployment identifier")
    # AWS credentials never enter this payload. The host uses its instance role.
    command = f"""set -eu
export AWS_DEFAULT_REGION={shlex.quote(args.region)}
test -f /etc/career-manager/ready
mkdir -p /opt/career-manager/releases
staging=$(mktemp -d /opt/career-manager/releases/.incoming-XXXXXX)
trap 'rm -rf "$staging"' EXIT
aws s3 cp {shlex.quote(f's3://{args.bucket}/releases/{args.sha}.tar.gz')} "$staging/release.tar.gz" --only-show-errors
mkdir "$staging/app"
tar -xzf "$staging/release.tar.gz" -C "$staging/app"
if [ ! -d /opt/career-manager/releases/{args.sha} ]; then
  mv "$staging/app" /opt/career-manager/releases/{args.sha}
fi
bash /opt/career-manager/releases/{args.sha}/deploy.sh {args.sha}
"""
    result = aws(args.region, "ssm", "send-command", "--instance-ids", args.instance,
                 "--document-name", "AWS-RunShellScript", "--timeout-seconds", "600",
                 "--parameters", json.dumps({"commands": [command], "executionTimeout": ["1800"]}))
    command_id = result["Command"]["CommandId"]
    print(f"SSM command: {command_id}", flush=True)
    deadline = time.monotonic() + 2100
    while time.monotonic() < deadline:
        # SSM's invocation may not be visible immediately after SendCommand.
        result = subprocess.run(
            ["aws", "--region", args.region, "ssm", "get-command-invocation",
             "--command-id", command_id, "--instance-id", args.instance, "--output", "json"],
            capture_output=True, text=True,
        )
        if result.returncode:
            if "InvocationDoesNotExist" not in result.stderr:
                raise RuntimeError(result.stderr)
        else:
            invocation = json.loads(result.stdout)
            status = invocation["Status"]
            if status not in ("Pending", "InProgress", "Delayed"):
                print(invocation.get("StandardOutputContent", ""))
                print(invocation.get("StandardErrorContent", ""))
                if status != "Success":
                    raise SystemExit(f"Deployment failed: {status}. Inspect SSM and CloudWatch.")
                print(f"Deployed {args.sha}")
                return
        time.sleep(10)
    raise SystemExit(f"Timed out waiting for {command_id}; inspect SSM before retrying.")


if __name__ == "__main__":
    main()
