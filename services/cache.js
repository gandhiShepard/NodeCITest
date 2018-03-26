const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;

  // This give us a key to use for our top level property
  this.hashKey = JSON.stringify(options.key || '');

  return this;
}

mongoose.Query.prototype.exec = async function () {
  // console.log('Im about to run a query');

  // console.log(this.getQuery());
  // console.log(this.mongooseCollection.name);

  // We're going to get all the Properties of this.getQuery and assign them
  // to the empty object
  // then we tahe the collection: this.mongooseCollection.name and assing them
  // to the empty object as well

  // we do this because we don't want to accidentially modify the Query object

  if (!this.useCache) {
    return exec.apply(this, arguments)
  }

  const key = JSON.stringify(
      Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  );

  // See if we have a value for 'key' in Redis
  const cacheValue = await client.hget(this.hashKey, key);

  // if truthy, return that
  if (cacheValue) {
    //console.log(cacheValue);
    const doc = JSON.parse(cacheValue);

    return Array.isArray(doc) 
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }

  // Otherwise, send query to MongoDB then store result in Redis
  // 'result' is the mongo document instance
  const result = await exec.apply(this, arguments);

  // Stringigy the mongo document instance for Redis because it is 
  // unique and consistent
  client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10)

  return result;
}

module.exports = {
  clearHash(hashKey) {
    // we dont know if the hashkey is going to be an object or an array, so
    // let's stringify it to avoid any type of error
    client.del(JSON.stringify(hashKey))
  }
}