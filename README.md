[![Build Status](https://travis-ci.org/innowatio/lambda-user-producer.svg?branch=master)](https://travis-ci.org/innowatio/lambda-user-producer)
[![Coverage Status](https://coveralls.io/repos/innowatio/lambda-user-producer/badge.svg?branch=master&service=github)](https://coveralls.io/github/innowatio/lambda-user-producer?branch=master)
[![Dependency Status](https://david-dm.org/innowatio/lambda-user-producer.svg)](https://david-dm.org/innowatio/lambda-user-producer)
[![devDependency Status](https://david-dm.org/innowatio/lambda-user-producer/dev-status.svg)](https://david-dm.org/innowatio/lambda-user-producer#info=devDependencies)

#iwwa-lambda-user-producer

Takes HTTP requests coming from AWS API Gateway and emits events into AWS
Kinesis.

## Deployment

### Continuous deployment

Since the project uses TravisCI and
[`lambda-deploy`](https://github.com/innowatio/lambda-deploy/) for continuous
deployment, the following environment variables need to be set:

- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_DEFAULT_REGION`
- `S3_BUCKET`
- `LAMBDA_NAME`
- `LAMBDA_ROLE_ARN`

WARNING: the value of those variables must be kept secret. Do not set them in
the `.travis.yml` config file, only in the Travis project's settings (where they
are kept secret).

### Configuration

The following environment variables are needed to configure the function:

- `MONGODB_URL`
- `KINESIS_STREAM_NAME`

NOTE: since the project uses `lambda-deploy`, in the build environment (Travis)
we need to define the above variables with their name prefixed by
`__FUNC_CONFIG__`.
