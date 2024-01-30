const EncryptedDynamoDbClient = require ('./dynamo_sdk');

const TableName ="otp"
const events = {
  save: async ({body})=>{
      const paramsItem = {
        TableName,
        Item: {
          id: {
            S: body.id
          },
          status: {
            S: body.status
          },
          nameApi: {
            S: body.nameApi
          },
          fecha:{
            S: "2015-03-25"
          }
        }
      };
      return await EncryptedDynamoDbClient.saveItem(TableName, paramsItem.Item);
  },
  get: async ({body})=>{
    const itemToSearch = {
        id: {
          S: body.id
        },
        fecha:{
          S: "2015-03-25"
        }
    }
    console.log('key', itemToSearch);
    return await EncryptedDynamoDbClient.getItem(TableName, itemToSearch);
  }
}

exports.handler = async (event, context) => {
  console.log("🚀 ~ lambdaHandler ~ event:", event.body.id)
    const eventValue = events[event.action]
    const response = await eventValue(event)
    return {
      statusCode: 200,
      body: {
        data: response,
        message: "Proceso exitoso"
      }
    }
};
