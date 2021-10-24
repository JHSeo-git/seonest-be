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
