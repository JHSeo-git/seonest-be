## nginx.conf

```nginx
user nginx; ## NGINX 프로세스가 실행되는 권한, root 권한은 보안상 위험함
worker_processes 2; ## Default: 1, CPU 코어 하나에 최소한 한 개의 프로세스가 배정되도록 변경 권장
worker_priority 0; ## 값이 작을 수록 높은 우선순위를 갖는다. 커널 프로세스의 기본 우선순위인 -5 이하로는 설정하지 않도록 한다.

# 로그레벨 [ debug | info | notice | warn | error | crit ]
error_log /var/log/nginx/error.log error; ## 로그레벨을 warn -> error로 변경함
pid /var/run/nginx.pid;

events {
  worker_connections 1024; ## Default: 1024, 현 서버는 RAM 8GB라 상향조정
  multi_accept off; ## Default: off
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';

  access_log /var/log/nginx/access.log main;

  sendfile on;

  #tcp_nopush on;

  server_tokens off; ## 헤더에 NGINX 버전을 숨김 (보안상 설정 권장)
  keepalive_timeout 65; ## 접속 시 커넥션 유지 시간

  #gzip on;

  include /etc/nginx/conf.d/*.conf;
}
```
