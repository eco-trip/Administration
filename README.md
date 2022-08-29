# Administration

Administration Node.js RESTful API with DynamoDB

## Development

If clone main repo [Ecotrip](https://github.com/eco-trip/Ecotrip) follow it's installation guidelines and view the application at:

[http://localhost:5000](http://localhost:5000)

DynamoDB addresses:

- Database [http://localhost:8000](http://localhost:8000)
- Admin GUI [http://localhost:8001](http://localhost:8001)

## References

- [dynamoose](https://dynamoosejs.com/)
- [dynamodb-admin](https://www.npmjs.com/package/dynamodb-admin)

## Notes

For dynamoose, the NodeJS server must have aws-cli, a custom docker image was created from node16-alpine plus aws-cli installed and configured.

## Connect to EC2

If deploy from your pc you can connect via ssh to EC2 with pem key genereted.

```sh
ssh -i ***.pem ec2-user@X.X.X.X
```
