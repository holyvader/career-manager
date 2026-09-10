output "application_url" { value = "https://${var.app_domain}" }
output "dns_app_record" { value = { type = "A", name = var.app_domain, value = aws_eip.app.public_ip } }
output "ses_verification_record" {
  value = { type = "TXT", name = "_amazonses.${var.email_domain}", value = aws_ses_domain_identity.main.verification_token }
}
output "ses_dkim_records" {
  value = [for token in aws_ses_domain_dkim.main.dkim_tokens : { type = "CNAME", name = "${token}._domainkey.${var.email_domain}", value = "${token}.dkim.amazonses.com" }]
}
output "application_secret_arn" { value = aws_secretsmanager_secret.app.arn }
output "database_secret_arn" { value = aws_db_instance.main.master_user_secret[0].secret_arn }
output "database_endpoint" { value = aws_db_instance.main.address }
output "ses_identity_arn" { value = aws_ses_domain_identity.main.arn }
output "github_environment_variables" {
  value = {
    AWS_REGION      = var.region
    AWS_ROLE_ARN    = aws_iam_role.github.arn
    EC2_INSTANCE_ID = aws_instance.app.id
    RELEASE_BUCKET  = aws_s3_bucket.releases.id
    FRONTEND_IMAGE  = aws_ecr_repository.app["frontend"].repository_url
    BACKEND_IMAGE   = aws_ecr_repository.app["backend"].repository_url
    APP_DOMAIN      = var.app_domain
  }
}
