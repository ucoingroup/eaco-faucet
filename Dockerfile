# EACO Faucet - Free EACO Token Claim Website v0.01
# Minimal static site Docker image
# Cross-platform: Windows, Linux, macOS, Android (via container)

FROM busybox:stable

LABEL maintainer="EACO Community"
LABEL version="0.01"
LABEL description="EACO Faucet - Earth's Best Coin Free Token Claim"

# Create directories
RUN mkdir -p /var/www/js /var/www/rust /var/www/server

# Copy frontend files
COPY index.html /var/www/
COPY js/app.js /var/www/js/
COPY js/config.js /var/www/js/
COPY js/i18n.js /var/www/js/
COPY LICENSE /var/www/
COPY README.md /var/www/
COPY MANUAL.md /var/www/

# Copy backend reference files
COPY rust/eaco_faucet.rs /var/www/rust/
COPY rust/Anchor.toml /var/www/rust/
COPY rust/Cargo.toml /var/www/rust/
COPY server/claim.php /var/www/server/
COPY server/config.php /var/www/server/
COPY server/signer.js /var/www/server/
COPY server/stats.php /var/www/server/
COPY server/package.json /var/www/server/
COPY .gitignore /var/www/
COPY Dockerfile /var/www/
COPY .dockerignore /var/www/

# Expose port
EXPOSE 8080

# Simple HTTP server using busybox httpd
# -f = foreground, -p = port, -h = home directory
CMD ["httpd", "-f", "-p", "8080", "-h", "/var/www"]
