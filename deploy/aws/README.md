# AWS production deployment

One EC2 instance runs Caddy, Next.js, and the Bun backend. RDS PostgreSQL 16
stores application data; SES sends email. Only HTTP/HTTPS are public. This is
independent of `docker-compose.local-prod.yml` and its self-signed certificate.

Default region: Frankfurt (`eu-central-1`). Default capacity: `t3.medium` EC2
with 30 GB encrypted gp3 storage, and Single-AZ `db.t4g.micro` RDS with 20 GB
encrypted gp3 storage. There is no NAT gateway, load balancer, or automatic
application failover. Deployments briefly stop application traffic. This stack
incurs AWS charges, including EC2, public IPv4, RDS, storage, and logs.

## 1. Create infrastructure

Prerequisites: AWS CLI v2 authenticated with your provisioning identity,
Terraform >= 1.10, a domain you control, and administrative access to the
GitHub repository. Use your own AWS identity for Terraform; the deployment
role deliberately cannot provision infrastructure or read Terraform state.

Bootstrap a globally unique state bucket:

```bash
terraform -chdir=infra/aws/bootstrap init
terraform -chdir=infra/aws/bootstrap apply -var='state_bucket=YOUR-UNIQUE-STATE-BUCKET'
```

Keep the bootstrap directory's local state in a secure backup. The bucket has
versioning, encryption, public-access blocking, and deletion prevention. Main
infrastructure state and its lock are stored remotely:

```bash
cp infra/aws/backend.hcl.example infra/aws/backend.hcl
cp infra/aws/terraform.tfvars.example infra/aws/terraform.tfvars
# Edit both files with your bucket, real domain, sender, notification email,
# and GitHub owner/repository. These files are gitignored.
terraform -chdir=infra/aws init -backend-config=backend.hcl
terraform -chdir=infra/aws plan -out=production.tfplan
terraform -chdir=infra/aws apply production.tfplan
```

Supply `github_oidc_provider_arn` if this account already has GitHub's OIDC
provider; AWS permits only one provider per URL. Commit both generated
`.terraform.lock.hcl` files when updating provider versions. Do not commit
state, saved plans, real `.tfvars`, or credentials.

Terraform creates the EC2 host, VPC/subnets/security groups, Elastic IP, RDS,
ECR repositories, release-artifact S3 bucket, SES identity/DKIM, application
secret container, IAM roles, CloudWatch log group, and alarms. It does not
create a DNS hosted zone or change your existing DNS provider.

RDS has deletion protection, seven-day backups, and a final snapshot on
intentional deletion. If recreating after a previous deletion, choose a new
`final_snapshot_identifier` before a later destroy to avoid name collisions.
The EC2 root disk and its Caddy volumes are lost on instance replacement;
RDS data and the Elastic IP are independent. Review replacement actions in
Terraform plans, including replacements caused by cloud-init changes.

## 2. Configure DNS, email, and secrets

Read the Terraform outputs:

```bash
terraform -chdir=infra/aws output
```

- Add `dns_app_record` as an ordinary DNS A record pointing to the Elastic IP.
  Avoid a DNS-provider proxy initially. Ports 80/443 must reach Caddy for
  certificate issuance. Do not point an AAAA record at an unrelated host.
- Add `ses_verification_record` and all `ses_dkim_records` to your DNS provider.
  Wait for SES to show the domain as verified in the selected region.
- In SES in **the same region**, request production access to leave the
  sandbox. Until approved, SES restricts recipients to verified identities.
- Create SES SMTP credentials in the SES console. These are region-specific
  SMTP credentials, not an ordinary AWS access key and secret. The current
  mailer uses SMTP on port 587 with STARTTLS.
- The SMTP principal needs `ses:SendRawEmail` for the verified identity. Scope
  its policy to `ses_identity_arn` and the configured sender where practical.
- Confirm the SNS subscription email for EC2 status and low RDS storage alarms.

Populate the secret identified by `application_secret_arn` using the AWS
Secrets Manager console's plaintext JSON editor:

```json
{
  "BETTER_AUTH_SECRET": "REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS",
  "SMTP_USER": "YOUR_SES_SMTP_USERNAME",
  "SMTP_PASSWORD": "YOUR_SES_SMTP_PASSWORD"
}
```

Generate the auth secret with `openssl rand -base64 48`; use the generated
value, not the example. Terraform intentionally manages only this secret's
container, so secret values never enter Terraform configuration or state.
RDS creates and rotates its own database password in a separate managed
secret. The initial deployment uses that database owner for the application
and migrations; the instance role alone can retrieve these two secrets.

The host checks secrets every five minutes and recreates containers when
values change. A rotated database credential may cause a short reconnect
failure until that refresh. Check `career-manager-secrets.service` if refresh
fails; it retries on the next timer invocation. Changing the auth secret
invalidates existing sessions. To refresh immediately on EC2:

```bash
sudo systemctl start career-manager-secrets.service
```

Runtime credentials are stored in root-only files under
`/opt/career-manager/runtime`, never in the repository or image layers.
The RDS CA bundle is downloaded from AWS during bootstrap and mounted into
backend containers. Runtime connections verify the CA and hostname; Prisma
migrations use Prisma's `sslmode=require`, `sslaccept=strict`, and `sslcert`
CA-file parameters in their connection URL. PostgreSQL/libpq's `verify-full`
and `sslrootcert` parameters alone do not enforce Prisma migration verification.
Do not disable verification to work around connection problems.

## 3. Configure GitHub and deploy

Create a GitHub environment named **production**. Restrict its deployment
branches to your production branch and configure required reviewers if
appropriate for your repository. Copy every entry from the Terraform
`github_environment_variables` output into that environment's **variables**:

```bash
terraform -chdir=infra/aws output -json github_environment_variables
```

The workflow obtains temporary AWS credentials via OIDC. Its role can publish
only these application images/artifacts and send Systems Manager commands to
this EC2 instance. Anyone permitted to run production deployments can execute
application code as root on this host; keep environment and branch access
restricted to maintainers.

Wait for EC2 bootstrap to finish before the first deployment. Use Systems
Manager Session Manager (no SSH key or inbound port 22):

```bash
aws ssm start-session --target YOUR_INSTANCE_ID --region eu-central-1
sudo cloud-init status --wait
sudo test -f /etc/career-manager/ready
```

In GitHub Actions, run **AWS production deployment** on the intended revision
with `release_sha` empty. It checks the application, builds Linux amd64 images,
pushes immutable commit-SHA tags to ECR, uploads the versioned deployment
bundle to S3, and invokes the host through Systems Manager.

On EC2 the release script fetches secrets, pulls both images, stops the old
frontend/backend, applies existing Prisma migrations once, and starts all
services. It waits for health checks and verifies the public HTTPS frontend
and API before recording the release as healthy. The initial database is
empty; create accounts normally once SES is ready.

The frontend's public backend URL is baked into the image:
`https://APP_DOMAIN/backend`. Changing the domain requires a **new commit SHA
and image build**, plus updated DNS, Terraform configuration, and GitHub
variables. The manifest and frontend image label prevent accidentally reusing
an image built for a different domain. Server-side frontend calls stay on
`http://backend:3334` inside Docker.

Re-running a partially completed build reuses images already published under
that immutable SHA. A release is deployable only after both images and its
bundle have been published successfully.

## 4. Logs, validation, and recovery

Container logs go to CloudWatch under `/career-manager/production` (or the
configured project name), with one stream per container and 14-day retention.
Backend production output is JSON. Caddy also emits structured access logs.
The log driver uses a bounded nonblocking buffer: logging outages do not halt
the application, but can drop logs. Host bootstrap and credential-refresh logs
are available through cloud-init and journald:

```bash
aws logs tail /career-manager/production --follow --region eu-central-1
# On EC2:
sudo journalctl -u career-manager-secrets.service
sudo cat /var/log/cloud-init-output.log
sudo cat /opt/career-manager/current-sha
```

Validate after the first deployment:

1. `http://APP_DOMAIN` redirects to HTTPS with a publicly trusted certificate.
2. `https://APP_DOMAIN/backend/health` returns `{"status":"ok"}`.
3. Sign up, receive an SES verification email, follow its callback, sign in,
   load authenticated pages, and exercise password reset. Check secure cookies.
4. Confirm only ports 80/443 are public; EC2 application ports and RDS are not.
5. Reboot EC2 and confirm Docker restarts the application and HTTPS works.
6. Confirm backups, alarm subscriptions, and the secret-refresh timer in AWS.

To redeploy an older release, run the same workflow with its full 40-character
`release_sha`. No images are rebuilt. Alternatively, with an authorized AWS
identity from your workstation:

```bash
python3 deploy/aws/send-deployment.py --region eu-central-1 \
  --instance YOUR_INSTANCE_ID --bucket YOUR_RELEASE_BUCKET --sha FULL_COMMIT_SHA
```

Use the SHA recorded by `/opt/career-manager/previous-release` or GitHub's
successful deployment history. Failed migrations leave the frontend/backend
stopped and the previous healthy release marker intact. A failure after
startup can leave the candidate containers running; inspect SSM output and
CloudWatch before retrying. The workflow never automatically reverses schema
changes. Only redeploy older images when they support the current schema.

For database recovery, restore an RDS snapshot or point-in-time backup to a
**new private instance**, using the same database subnet/security groups and
SSL parameter group. Stop application writes before a cutover. Verify the
restored data, then deliberately reconcile/import the restored instance into
Terraform and update its managed-secret reference and endpoint in the EC2
configuration. Run a reviewed Terraform plan and redeploy a schema-compatible
release. Do not point a fresh deployment at the restored database before
reviewing its migrations, and retain the original database until verification.

Watch EC2 disk usage (`df -h`, `docker system df`). Images and release bundles
are retained for explicit rollbacks; remove only versions outside your chosen
rollback window. Avoid `docker system prune --volumes`, which can delete
Caddy certificate storage. For a planned host replacement, redeploy a retained
SHA through SSM; Caddy obtains certificates again after DNS reaches the host.

## Local configuration checks

These checks do not provision resources:

```bash
terraform -chdir=infra/aws init -backend=false
terraform -chdir=infra/aws validate
terraform -chdir=infra/aws test
terraform -chdir=infra/aws/bootstrap init
terraform -chdir=infra/aws/bootstrap validate
terraform fmt -check -recursive infra/aws
bash -n deploy/aws/deploy.sh
bash -n deploy/aws/refresh-secrets.sh
python3 -m unittest discover -s deploy/aws -p 'test_*.py'
```

To repeat the certificate-verification integration test with disposable local
containers (also run by the AWS configuration checks workflow):

```bash
docker build -f packages/backend/Dockerfile -t career-manager-tls-test .
bash deploy/aws/test-tls.sh career-manager-tls-test
```

Real RDS TLS, SES delivery, DNS/certificate issuance, IAM access, and reboot
recovery require the provisioned AWS environment and the live checks above.
