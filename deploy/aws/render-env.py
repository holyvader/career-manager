#!/usr/bin/env python3
"""Fetch production secrets on EC2; never emit their values to stdout."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import quote, urlencode


def get_secret(arn, region):
    result = subprocess.run(
        ["aws", "secretsmanager", "get-secret-value", "--secret-id", arn,
         "--region", region, "--query", "SecretString", "--output", "text"],
        check=True, capture_output=True, text=True,
    )
    return json.loads(result.stdout)


def write_env(path, values, *, raw=False):
    lines = []
    for key, value in values.items():
        if not isinstance(value, str) or any(c in value for c in "\r\n\x00"):
            raise ValueError(f"Invalid single-line configuration value: {key}")
        # Compose raw env_file preserves SMTP passwords containing $, #, and quotes.
        encoded = value if raw else "'" + value.replace("'", "\\'") + "'"
        lines.append(f"{key}={encoded}\n")
    with path.open("w") as output:
        output.writelines(lines)
    path.chmod(0o600)


def render(config, database, app, tag, runtime):
    if not re.fullmatch(r"[0-9a-f]{40}", tag):
        raise ValueError("Image tag must be a full lowercase Git commit SHA")
    for key in ("BETTER_AUTH_SECRET", "SMTP_USER", "SMTP_PASSWORD"):
        if not isinstance(app.get(key), str) or not app[key]:
            raise ValueError(f"Application secret is missing {key}")
    if len(app["BETTER_AUTH_SECRET"]) < 32:
        raise ValueError("BETTER_AUTH_SECRET must contain at least 32 characters")
    ca_path = "/etc/ssl/certs/aws-rds-global-bundle.pem"
    # The CLI consumes these TLS URL parameters; runtime uses the same CA explicitly.
    # Prisma's migration engine uses sslcert for the CA and defaults sslaccept
    # to accept_invalid_certs. require + strict is needed for verified TLS.
    query = urlencode({"sslmode": "require", "sslaccept": "strict", "sslcert": ca_path})
    database_url = (
        f"postgresql://{quote(database['username'], safe='')}:"
        f"{quote(database['password'], safe='')}@{config['database_host']}:5432/"
        f"{quote(config['database_name'], safe='')}?{query}"
    )
    os.umask(0o077)
    runtime.mkdir(parents=True, exist_ok=True, mode=0o700)
    write_env(runtime / "backend.env", {
        "NODE_ENV": "production",
        "DATABASE_URL": database_url,
        "DATABASE_SSL_CA_PATH": ca_path,
        "BETTER_AUTH_SECRET": app["BETTER_AUTH_SECRET"],
        "BETTER_AUTH_URL": f"https://{config['app_domain']}",
        "FRONTEND_URL": f"https://{config['app_domain']}",
        "SMTP_HOST": config["smtp_host"],
        "SMTP_PORT": "587",
        "SMTP_USER": app["SMTP_USER"],
        "SMTP_PASSWORD": app["SMTP_PASSWORD"],
        "SMTP_FROM": config["smtp_from"],
        "SMTP_TLS": "true",
        "SMTP_SSL": "false",
        "LOG_LEVEL": "info",
    }, raw=True)
    write_env(runtime / "deployment.env", {
        "AWS_REGION": config["region"],
        "LOG_GROUP": config["log_group"],
        "FRONTEND_IMAGE": config["frontend_image"],
        "BACKEND_IMAGE": config["backend_image"],
        "APP_DOMAIN": config["app_domain"],
        "IMAGE_TAG": tag,
        "BACKEND_ENV_FILE": str(runtime / "backend.env"),
    })


def main():
    config = json.loads(Path("/etc/career-manager/config.json").read_text())
    tag = sys.argv[1]
    manifest = json.loads(Path(__file__).with_name("release.json").read_text())
    if manifest != {"sha": tag, "app_domain": config["app_domain"]}:
        raise ValueError("Release SHA/domain mismatch: build a new revision for a changed domain")
    runtime = Path("/opt/career-manager/runtime") / tag
    render(config, get_secret(config["database_secret"], config["region"]),
           get_secret(config["app_secret"], config["region"]), tag, runtime)


if __name__ == "__main__":
    main()
