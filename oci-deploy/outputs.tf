output "server_public_ip" {
  value = oci_core_instance.portfolio_server.public_ip
}

output "ssh_command" {
  value = "ssh ubuntu@${oci_core_instance.portfolio_server.public_ip}"
}