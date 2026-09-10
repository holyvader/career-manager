import importlib.util
import os
from pathlib import Path
import stat
import tempfile
import unittest
from urllib.parse import parse_qs, unquote, urlsplit

spec = importlib.util.spec_from_file_location("render_env", Path(__file__).with_name("render-env.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RuntimeEnvironmentTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.runtime = Path(self.directory.name) / "runtime"
        self.original_umask = os.umask(0o077)
        self.addCleanup(os.umask, self.original_umask)
        self.config = {
            "database_host": "database.example.internal", "database_name": "career_manager",
            "app_domain": "app.example.org", "smtp_host": "email-smtp.eu-central-1.amazonaws.com",
            "smtp_from": "no-reply@example.org", "region": "eu-central-1",
            "log_group": "/career-manager/production",
            "frontend_image": "123.dkr.ecr.eu-central-1.amazonaws.com/career-manager/frontend",
            "backend_image": "123.dkr.ecr.eu-central-1.amazonaws.com/career-manager/backend",
        }
        self.database = {"username": "career_manager", "password": "a:@/?#%$'secret"}
        self.app = {"BETTER_AUTH_SECRET": "a" * 48, "SMTP_USER": "ses-user", "SMTP_PASSWORD": "x$#'\"=secret"}

    def render(self, tag="a" * 40):
        module.render(self.config, self.database, self.app, tag, self.runtime)
        return dict(line.split("=", 1) for line in (self.runtime / "backend.env").read_text().splitlines())

    def test_credentials_survive_encoding_and_tls_is_required(self):
        env = self.render()
        url = urlsplit(env["DATABASE_URL"])
        self.assertEqual(unquote(url.password), self.database["password"])
        self.assertEqual(parse_qs(url.query)["sslmode"], ["require"])
        self.assertEqual(parse_qs(url.query)["sslaccept"], ["strict"])
        self.assertEqual(parse_qs(url.query)["sslcert"], [env["DATABASE_SSL_CA_PATH"]])
        self.assertEqual(env["SMTP_PASSWORD"], self.app["SMTP_PASSWORD"])
        self.assertEqual(env["SMTP_TLS"], "true")
        self.assertEqual(env["BETTER_AUTH_URL"], "https://app.example.org")
        self.assertEqual(env["FRONTEND_URL"], env["BETTER_AUTH_URL"])
        self.assertEqual(stat.S_IMODE((self.runtime / "backend.env").stat().st_mode), 0o600)
        self.assertEqual(stat.S_IMODE(self.runtime.stat().st_mode), 0o700)
        self.assertNotIn(self.app["SMTP_PASSWORD"], (self.runtime / "deployment.env").read_text())

    def test_secret_rotation_replaces_runtime_credentials(self):
        before = self.render()["DATABASE_URL"]
        self.database["password"] = "rotated-secret"
        after = self.render()["DATABASE_URL"]
        self.assertNotEqual(before, after)
        self.assertEqual(unquote(urlsplit(after).password), "rotated-secret")

    def test_missing_secret_and_multiline_injection_are_rejected(self):
        self.app["SMTP_PASSWORD"] = ""
        with self.assertRaises(ValueError):
            self.render()
        self.app["SMTP_PASSWORD"] = "password\nNODE_ENV=development"
        with self.assertRaises(ValueError):
            self.render()
        self.assertFalse((self.runtime / "backend.env").exists())

    def test_untrusted_release_identifiers_are_rejected(self):
        for tag in ("latest", "../../tmp", "a" * 40 + "; touch /tmp/bad"):
            with self.assertRaises(ValueError):
                self.render(tag)


if __name__ == "__main__":
    unittest.main()
