Developer Setup
--

> Want to run this on your own server?  If you have a server running node v12+, here is all you need to do:

#### Clone Repo

```bash
git clone git@github.com:manifestinteractive/teleprompter.git
cd teleprompter
npm install
```

#### Start Client ( only needed for developers )

```bash
npm run client
```


#### Start Server ( for Remote - if needed )

```bash
npm start
```

#### Sample Nginx Config

```nginx
server {
  listen 80;
  listen [::]:80;
  server_name website.com www.website.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  include snippets/ssl-website.com.conf;
  include snippets/ssl-params.conf;
  include snippets/basic.conf;
  include snippets/error-pages.conf;

  add_header X-Frame-Options DENY;

  root /var/www/website.com/html;
  index index.php index.html index.htm index.nginx-debian.html;

  server_name website.com www.website.com;

  location / {
    try_files $uri $uri/ =404;
  }

  location ^~ /remote/ {
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;
    proxy_http_version 1.1;
    proxy_pass http://localhost:3000/;
  }
}
```
