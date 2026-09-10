data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
resource "aws_instance" "app" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.app.id]
  iam_instance_profile        = aws_iam_instance_profile.app.name
  user_data_replace_on_change = true
  user_data = templatefile("${path.module}/templates/cloud-init.sh.tftpl", {
    config_b64 = base64encode(jsonencode({
      region          = var.region
      app_domain      = var.app_domain
      smtp_from       = var.smtp_from
      smtp_host       = "email-smtp.${var.region}.amazonaws.com"
      database_host   = aws_db_instance.main.address
      database_name   = aws_db_instance.main.db_name
      database_secret = aws_db_instance.main.master_user_secret[0].secret_arn
      app_secret      = aws_secretsmanager_secret.app.arn
      frontend_image  = aws_ecr_repository.app["frontend"].repository_url
      backend_image   = aws_ecr_repository.app["backend"].repository_url
      log_group       = aws_cloudwatch_log_group.app.name
    }))
  })
  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 30
    encrypted             = true
    delete_on_termination = true
  }
  tags       = { Name = var.name }
  depends_on = [aws_route_table_association.public, aws_iam_role_policy.instance, aws_iam_role_policy_attachment.ssm]
}
resource "aws_eip" "app" {
  domain   = "vpc"
  instance = aws_instance.app.id
}
