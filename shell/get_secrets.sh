#!/usr/bin/env bash
set -euo pipefail

# 引数チェック
if [ $# -lt 1 ]; then
  echo "指定された引数は$#個です。" 1>&2
  echo "実行するには1個の引数が必要です。" 1>&2
  echo "$0 [IAM ROLE NAME]"
  exit 1
fi

ROLE_NAME=$1

export AWS_SDK_LOAD_CONFIG=true

ROLE_ARN=$(aws iam get-role --role-name ${ROLE_NAME} --query 'Role.Arn' --output text)
STS_RESULT=$(aws sts assume-role --role-arn ${ROLE_ARN} --role-session-name s3-upload-session --duration-seconds 900)

AWS_ACCESS_KEY_ID=$(echo ${STS_RESULT} | jq -r '.Credentials.AccessKeyId')
AWS_SECRET_ACCESS_KEY=$(echo ${STS_RESULT} | jq -r '.Credentials.SecretAccessKey')
SESSION_TOKEN=$(echo ${STS_RESULT} | jq -r '.Credentials.SessionToken')

echo "以下の認証情報 (AccessKeyId:SecretAccessKey:SessionToken) をGASのフォームに貼り付けて下さい。"
echo "${AWS_ACCESS_KEY_ID}:${AWS_SECRET_ACCESS_KEY}:${SESSION_TOKEN}"