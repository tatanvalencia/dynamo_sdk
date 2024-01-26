const EncryptedDynamoDbClient = require ('./dynamo_sdk');

exports.handler = async (event, context) => {
  const body = JSON.parse(event.body);
  const id = body.id;
  const paramsItem = {
    TableName: 'employee-restore-status',
    Item: {
      id: {
        S: id
      },
      status: {
        S: "IN PROGRESS"
      },
      ttl: {
        S: "1800"
      }
    }
  };
  await EncryptedDynamoDbClient.encryptAndStoreData(paramsItem.Item.id.S);
  /*await EncryptedDynamoDbClient.saveItem(paramsItem.TableName, paramsItem.Item);
  const itemToSearch = {
      id: {
        S: id
      }
  }
  console.log('key', itemToSearch);
  const data = await EncryptedDynamoDbClient.getItem(paramsItem.TableName, itemToSearch);*/
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Proceso exitoso"
    }),
  };
};