# Administration

Administration Node.js RESTful API with DynamoDB

## References

- [dynamoose](https://dynamoosejs.com/)
- [dynamodb-admin](https://www.npmjs.com/package/dynamodb-admin)

## Development

If clone main repo [Ecotrip](https://github.com/eco-trip/Ecotrip) follow it's installation guidelines and view the application at:

[http://localhost:5000](http://localhost:5000)

DynamoDB addresses:

- Database [http://localhost:8000](http://localhost:8000)
- Admin GUI [http://localhost:8001](http://localhost:8001)

For dynamoose, the NodeJS server must have aws-cli, a custom docker image was created from node16-alpine plus aws-cli installed and configured.

## Deployment

The deploy of Administration API required Cognito User Pool already created!

#### Connect to EC2

If deploy application from your PC, you can connect via ssh to EC2 with pem key genereted.

```sh
ssh -i ***.pem ec2-user@X.X.X.X
```
