mock_provider "aws" {
  mock_data "aws_availability_zones" {
    defaults = { names = ["eu-central-1a", "eu-central-1b"] }
  }
  mock_data "aws_caller_identity" {
    defaults = { account_id = "123456789012" }
  }
  mock_resource "aws_db_instance" {
    defaults = {
      address = "database.example.internal"
      master_user_secret = [{
        secret_arn    = "arn:aws:secretsmanager:eu-central-1:123456789012:secret:rds-test"
        secret_status = "active"
        kms_key_id    = "arn:aws:kms:eu-central-1:123456789012:key/test"
      }]
    }
  }
}

variables {
  app_domain         = "app.example.org"
  email_domain       = "example.org"
  smtp_from          = "no-reply@example.org"
  github_repository  = "example/career-manager"
  notification_email = "ops@example.org"
}

run "private_database_and_single_public_host" {
  command = plan
  assert {
    condition     = !aws_db_instance.main.publicly_accessible && !aws_db_instance.main.multi_az
    error_message = "The initial RDS instance must be private and Single-AZ."
  }
  assert {
    condition     = aws_db_instance.main.storage_encrypted && aws_db_instance.main.deletion_protection && aws_db_instance.main.backup_retention_period == 7
    error_message = "Database encryption, deletion protection, and backups are required."
  }
  assert {
    condition     = toset(keys(aws_vpc_security_group_ingress_rule.web)) == toset(["80", "443"])
    error_message = "Only HTTP and HTTPS may be publicly accessible."
  }
  assert {
    condition     = aws_vpc_security_group_ingress_rule.database.from_port == 5432 && aws_vpc_security_group_ingress_rule.database.cidr_ipv4 == null
    error_message = "Database access must use the application security group, not a public CIDR."
  }
  assert {
    condition     = aws_instance.app.metadata_options[0].http_tokens == "required" && aws_instance.app.metadata_options[0].http_put_response_hop_limit == 1
    error_message = "Require IMDSv2 and prevent bridged application containers from using instance credentials."
  }
  assert {
    condition     = aws_cloudwatch_log_group.app.retention_in_days == 14 && aws_ecr_repository.app["frontend"].image_tag_mutability == "IMMUTABLE"
    error_message = "Keep bounded logs and immutable release images."
  }
}
