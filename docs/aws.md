## aws

ec2 인스턴스 유형 선택 시 최소 micro 이상 사용하는 것을 권장함.
(그 이하를 잠깐 써본 결과 이건 쓸게 못됨...)

1. 인스턴스 생성
2. IAM 설정
3. 인바운드 설정(ex: 웹서버일 경우 https(443), http(80), ssh(22, only user) 등)
4. 웹 서비스 시작(자동시작일 경우 확인)
5. DNS 설정(ip 변경될 경우)
6. 배포 환경 변경: ssh, known-hosts 설정 등
   (인스턴스 유형 변경 등 시 external url, ip 등 변경될 경우, internal url은 변경되지 않음)
7. 개발 환경 변경: ssh
   (인스턴스 유형 변경 등 시 external url, ip 등 변경될 경우, internal url은 변경되지 않음)

## tips

```bash
# grep ssh-known-hosts
ssh-keyscan ec2-.... | pbcopy

# ssh interactive
ssh -i ~/.ssh/id_rsa ubuntu@ec2-...
```
