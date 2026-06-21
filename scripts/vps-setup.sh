#!/bin/bash
# Setup inicial da VPS - executar uma única vez

set -e

DOMAIN="vetpro.housecloud.tec.br"
EMAIL="seu-email@email.com"  # ALTERE

echo "=== 1. Instalando dependências ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx

echo "=== 2. Parando nginx temporariamente ==="
sudo systemctl stop nginx

echo "=== 3. Clonando/app do repo ==="
cd /home/ubuntu
if [ -d "vetpro-app" ]; then
    cd vetpro-app && git pull origin main
else
    git clone https://github.com/welloliver1974/vetpro-app.git
    cd vetpro-app
fi

echo "=== 4. Instalando dependências e build ==="
npm ci
npm run build

echo "=== 5. Configurando PM2 ==="
npm install -g pm2
PORT=4004 pm2 restart vetpro --update-env || PORT=4004 pm2 start npm --name vetpro -- start
pm2 save
pm2 startup

echo "=== 6. Configurando Nginx ==="
sudo tee /etc/nginx/sites-available/vetpro > /dev/null <<EOF
server {
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:4004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/vetpro /etc/nginx/sites-enabled/
sudo nginx -t

echo "=== 7. Configurando SSL com Let's Encrypt ==="
sudo certbot --nginx -d $DOMAIN --noninteractive --agree-tos -m $EMAIL

echo "=== 8. Renovando SSL automaticamente ==="
sudo certbot renew --dry-run

echo "=== 9. Habilitando nginx ==="
sudo systemctl enable nginx
sudo systemctl start nginx

echo "=== Setup completo! ==="
echo "Acesse: https://$DOMAIN"
echo ""
echo "Comandos úteis:"
echo "  pm2 logs vetpro        # ver logs"
echo "  pm2 restart vetpro     # reiniciar"
echo "  pm2 status             # status"
echo "  sudo certbot renew     # renovar SSL"