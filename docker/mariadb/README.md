```
docker exec -it catch_a_nest_db bash
mysql -u root -p
create database catch_a_nest;
grant all privileges on catch_a_nest.* TO 'seo'@'%' identified by 'root';
flush privileges;
```

- my.cnf
  https://jojoldu.tistory.com/461

- typeorm migration
  https://velog.io/@heumheum2/typeORM-Migration-%EC%9D%B4%EC%8A%88

```bash
# mysql dump
docker exec catch_a_nest_db /usr/bin/mysqldump -u ... --password=... catch_a_nest > backup.sql

# ssh copy to local
scp -r -i "seo-nest-blog-db.pem" ubuntu@....compute.amazonaws.com:/home/ubuntu/backup.sql ./db-backup
```
