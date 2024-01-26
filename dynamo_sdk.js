'use strict';

/**
 * @module        aws-dynamodb
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
  saveItem,
  encryptAndStoreData
};

const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB();
const kms = new AWS.KMS();

//const elliptic = require("elliptic-nodejs");
//const hkdf = require("js-crypto-hkdf");
//const cryptoAesGcm = require("crypto-aes-gcm");
const { v4: uuidv4 } = require('uuid');
import {v4 as uuidv4} from 'uuid';

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
    return await decryptItem(data.Item);
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
    const encryptedItem = await encryptItem(item);
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
async function encryptItem(item) {
  const keyId = 'arn:aws:kms:us-east-1:<account_id>:key/<key>';
  const encryptedItem = {};
  let firstElementProcessed = false;
  for (const key in item) {
    if (!firstElementProcessed) {
      encryptedItem[key] = item[key];
      firstElementProcessed = true;
    } else {
      const encryptedData = await kms.encrypt({ KeyId: keyId, Plaintext: item[key].S }).promise();
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
async function decryptItem(data) {
  const keyId = 'arn:aws:kms:us-east-1:<account_id>:key/<key>';
  const decryptedItem = {};
  let firstElementProcessed = false;
  console.log('data', data);
  for (const key in data) {
    if (!firstElementProcessed) {
      console.log('data[key].S', data[key].S);
      decryptedItem[key] = data[key];
      firstElementProcessed = true;
    } else {
      const ciphertextBlob = Buffer.from(data[key].S, 'base64');
      console.log('ciphertextBlob', ciphertextBlob);
      const decryptedData = await kms.decrypt({ KeyId: keyId, CiphertextBlob: ciphertextBlob }).promise();
      decryptedItem[key] = decryptedData.Plaintext;
    }
  }
  return decryptedItem;
}

async function encryptAndStoreData(id) {
  console.log('UUID', uuidv4());
  // Genera una clave simétrica aleatoria
  const dataKey = await kms.generateDataKey({ KeyId: "<key>", KeySpec: "AES_256" }).promise();
  console.log('dataKey', dataKey);
  // Encripta la clave simétrica con la clave maestra de KMS
  const encryptedDataKey = await kms.encrypt({
    KeyId: dataKey.KeyId,
    Plaintext: dataKey.Plaintext,
  }).promise();
  // Deriva las claves de firma simétrica y asimétrica de la clave simétrica cifrada
  /*const encryptionKey = elliptic.ec("secp256k1").keyFromPrivate(encryptedDataKey.CiphertextBlob);
  console.log('encryptionKey', encryptionKey);
  const signatureKey = elliptic.ec("secp256k1").keyFromPrivate(encryptedDataKey.CiphertextBlob);*/
}
