variable "region" {
  type    = string
  default = "eu-central-1"
}
variable "name" {
  type    = string
  default = "career-manager"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,24}$", var.name))
    error_message = "Use 3–25 lowercase letters, digits, or hyphens, starting with a letter."
  }
}
variable "app_domain" {
  type        = string
  description = "Real application hostname, without a scheme or path."
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]+\\.[a-z]{2,}$", var.app_domain)) && !endswith(var.app_domain, ".example.com")
    error_message = "Supply your real application hostname; example.com placeholders cannot be deployed."
  }
}
variable "email_domain" {
  type        = string
  description = "Domain owned by you and verified with SES, e.g. example.org."
}
variable "smtp_from" {
  type        = string
  description = "Sender email address under email_domain (no display name)."
  validation {
    condition     = can(regex("^[^ <>@]+@[^ <>@]+$", var.smtp_from))
    error_message = "Supply a sender email address without a display name."
  }
}
variable "github_repository" {
  type        = string
  description = "GitHub owner/repository allowed to deploy via the production environment."
  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "Expected owner/repository."
  }
}
variable "github_oidc_provider_arn" {
  type        = string
  default     = ""
  description = "Existing GitHub OIDC provider ARN, or empty to create it in this account."
}
variable "notification_email" {
  type        = string
  description = "Email receiving EC2 and RDS alarms; confirm the SNS subscription after apply."
}
variable "instance_type" {
  type    = string
  default = "t3.medium"
}
variable "database_instance_class" {
  type    = string
  default = "db.t4g.micro"
}
