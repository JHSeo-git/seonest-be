# CI/CD

pm2 + github actions.

github action를 통해 github docker에서 pm2 deploy script를 실행하는 방식.

## PM2 Deploy

우선 deploy를 하기 위해선 setup script를 사전에 실행하여 환경을 만들어주어야 한다.

1. setup
2. deploy (production, staging)

```bash
--> Deploying to production environment
--> on host ec2-54-180-96-175.ap-northeast-2.compute.amazonaws.com

  ○ deploying origin/main
  ○ executing pre-deploy-local
  ○ hook pre-deploy
  ○ fetching updates
  ○ full fetch
Fetching origin
  ○ resetting HEAD to origin/main
HEAD is now at 8258c9e remove auth_check where GET lastest temp post
  ○ executing post-deploy `export NODE_ENV=production && yarn install && yarn pm2:reload`
yarn install v1.22.17
[1/4] Resolving packages...
success Already up-to-date.
Done in 0.44s.
yarn run v1.22.17
$ pm2 reload ecosystem.config.js
[PM2] Applying action reloadProcessId on app [seonest-be](ids: [ 0, 1 ])
[PM2] [seonest-be](0) ✓
[PM2] [seonest-be](1) ✓
Done in 8.97s.
  ○ successfully deployed origin/main
--> Success
✨  Done in 15.40s.
```

### trouble shooting

#### 1. ssh key

`ssh-keygen`을 이용하여 private.key public.key를 만들고 서버에 복사하여 연결 시 사용할 수 있는 key path를 지정해야 한다.

#### 2. source folder not found

deploy를 진행하기 전에 setup을 먼저 진행해야 한다.

production(or staging) 전 반드시 해당 서버에서 `pm2 deploy production setup`을 진행하여 pm2 배포 환경 폴더를 설정해주어야 한다.

#### 3. bash: yarn: command not found

> ssh script로 bash call 테스트를 미리 해볼 것을 추천한다.
> path에 node bin path가 설정되어 있는지 확인할 필요가 있다.
> `ssh -i key user@serverIp 'echo $PATH`

pm2가 정상 deploy 스테이지까지 마쳤으면(보통 git fetch까지),
post-deploy script를 실행하게 되는데 보통 여기서 dependency와 run script를 실행한다.

여기 script는 ssh command로 요청하기 때문에 non-interactive non-login ssh 로 호출하게 된다.

만약 `bash: <사용할 cli>: command not found`가 뜬다면 .bashrc를 살펴볼 필요가 있다.

아래와 같이 interactive가 아닌 접속에 대한 방어코드 하단에 $PATH와 관련된 코드가 들어가 있으면 무시되기 때문에 반드시 방어 코드 상단에 만들어둔다.

```bash
# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac
```

> https://stackoverflow.com/Questions/940533/how-do-i-set-path-such-that-ssh-userhost-command-works

#### 4. .env

만약 서버 동작에 필요한 .env파일이 있다면 `env` 를 이용해 설정해주거나,
만약 gitignore에 있다면 .env파일을 실행 전에 생성하거나 옮겨질 수 있도록 해야한다.

#### 5. post-deploy

> 보통 서버 기동을 하는 script를 쓰기 때문에 패키지 노드 설정과 관련이 많다.

여기서 부터는 node 문제일 가능성이 제일 크다.
디펜던시가 설치가 안되었다던지, 잘 못 설치되었던지, script에 문제가 있는건지 확인할 필요가 있다.

## Github Actions

PM2를 로컬에서 배포할 수 있도록 설정이 완료되었다면 그 행위를 Github Action으로 옮겨주기만 하면 된다. 조심해야 할 것은 디펜던시가 없는 상태에서 실행해야 한다는 점을 생각하여 디펜던시 설치까지 생각하도록 하자. 또한, ssh key를 가지고 deploy를 할 수 있기 때문에 경로와 생성파일을 정확히 지정해주어야 한다.

> @see https://dev.to/goodidea/setting-up-pm2-ci-deployments-with-github-actions-1494
