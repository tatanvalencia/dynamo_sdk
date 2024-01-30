'use strict';

/**
 * @module        aws-dynamodb-kms
 * @description   Expone las funcionalidades relacionadas al servicio DynamoDB de AWS
 * @version       1.0.0
 * @author        <jhonatan.valencia@pragma.com.co>
 * @since         2024-01-24
 * @lastModified  2024-01-24
 * @example
 * npm install aws-dynamodb
 * let dynamoDB = require('aws-dynamodb');
 */

module.exports = {
  getItem,
  saveItem
};

const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB();
const kms = new AWS.KMS();

const ARN_KMS = "arn:aws:kms:us-east-1:<ACCOUNT_ID>:key/<KMS_KEY>";

/**
 * @function
 * @description Permite obtener un item almacenado en una tabla en DynamoDB
 * @param {string} tableName Nombre de la tabla de la cual desea consultar el item
 * @param {object} key Clave asociada al item en la tabla de DynamoDB
 * @return {Promise} Promesa del servicio
 **/
async function getItem(tableName, key) {
  try {
    let params = { TableName: tableName, Key: key };
    const data = await dynamodb.getItem(params).promise();
    return await decryptItem(data.Item, ["id", "fecha"]);
  } catch (err) {
    throw err;
  }
}

/**
 * @function
 * @description Permite guardar un item en una tabla en DynamoDB
 * @param {string} tableName Nombre de la tabla en la cual desea guardar el item
 * @param {object} item Item a guardar en DynamoDB
 * @return {Promise} Promesa del servicio
 **/
async function saveItem(tableName, item) {
  try {
    const encryptedItem = await encryptItem(item, ["id", "fecha"]);
    let params = { TableName: tableName, Item: encryptedItem };
    return await dynamodb.putItem(params).promise();
  } catch (err) {
    throw err;
  }
}

/**
 * @function
 * @description Permite cifrar con kms un item para almacenar en una tabla en DynamoDB
 * @param {object} item Item de la tabla a la cual vamos a cifrar
 * @return {Promise} Promesa del servicio
 **/
async function encryptItem(item, ignore) {
  const encryptedItem = {};
  for (const key in item) {
    if (ignore.includes(key)) {
      encryptedItem[key] = item[key];
    } else {
      const encryptedData = await kms.encrypt({ KeyId: ARN_KMS, Plaintext: item[key].S }).promise();
      const encryptedValue = encryptedData.CiphertextBlob.toString('base64');
      encryptedItem[key] = { S: encryptedValue };
    }
  }
  return encryptedItem;
}

/**
 * @function
 * @description Permite descifrar con kms un item almacenado en una tabla en DynamoDB
 * @param {object} data Item de la tabla a la cual vamos a descifrar
 * @return {Promise} Promesa del servicio
 **/
async function decryptItem(data, ignore) {
  const decryptedItem = {};
  for (const key in data) {
    if (ignore.includes(key)) {
      decryptedItem[key] = data[key].S;
    } else {
      const ciphertextBlob = Buffer.from(data[key].S, 'base64');
      const decryptedData = await kms.decrypt({ KeyId: ARN_KMS, CiphertextBlob: ciphertextBlob }).promise();
      decryptedItem[key] = decryptedData.Plaintext.toString('utf-8');
    }
  }
  return decryptedItem;
}
