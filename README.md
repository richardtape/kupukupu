# KupuKupu

A modern web application that runs both in the browser and as a desktop application.

## Development Setup

1. Install dependencies:

    ```bash
    npm install
    ```

2. Create your environment file:

    ```bash
    cp .env.example .env
    ```

3. Start the development server:
    - For web: `npm run dev`
    - For desktop: `npm run electron:dev`

## Building

-   For web: `npm run build`
-   For desktop: `npm run electron:build`

## Deployment

### Prerequisites

1. Set up a Digital Ocean droplet with Ubuntu
2. Install Nginx: `sudo apt update && sudo apt install nginx`
3. Set up SSL with Certbot (recommended)

### GitHub Secrets

The following secrets need to be set in your GitHub repository:

-   `SSH_PRIVATE_KEY`: Your SSH private key for the deployment
-   `SSH_KNOWN_HOSTS`: The known hosts entry for your server
-   `DEPLOY_USER`: The username on your deployment server
-   `DEPLOY_HOST`: Your server's hostname or IP
-   `STAGING_URL`: The staging URL (https://kupukupu.cc)

### Server Setup

1. Create the web root directory:

    ```bash
    sudo mkdir -p /var/www/kupukupu.cc
    sudo chown -R $USER:$USER /var/www/kupukupu.cc
    ```

2. Copy the Nginx configuration:
    ```bash
    sudo cp nginx.conf.example /etc/nginx/sites-available/kupukupu.cc
    sudo ln -s /etc/nginx/sites-available/kupukupu.cc /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    ```

### Deployment Process

The application automatically deploys to staging when pushing to the main branch.

## Environment Variables

-   `VITE_APP_ENV`: The current environment (development/staging/production)
-   `VITE_APP_URL`: The application URL for the current environment
-   `VITE_APP_TITLE`: The application title

## License

ISC
