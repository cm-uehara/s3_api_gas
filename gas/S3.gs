function getInstance(accessKeyId, secretAccessKey, sessionToken, options) {
  return new S3(accessKeyId, secretAccessKey, sessionToken, options);
}

function S3(accessKeyId, secretAccessKey, sessionToken, options) {
  if (typeof accessKeyId !== 'string') throw "Must pass accessKeyId to S3 constructor";
  if (typeof secretAccessKey !== 'string') throw "Must pass secretAcessKey to S3 constructor";
  
  this.accessKeyId = accessKeyId;
  this.secretAccessKey = secretAccessKey;
  this.sessionToken = sessionToken;
  this.options = options | {};
}

S3.prototype.createBucket = function (bucket, options) {
  options = options || {}; 
  
  
  var request = new S3Request(this);
  request.setHttpMethod('PUT');
  
  //this is dumb and is optional from AWS perspective
  //but UrlFetchApp will default a Content-Type header to application/xml-www-form-url-encoded or whatever, which 
  //screws up the signature of the request
  request.setContentType('text/plain');
  
  //support setting of ACL
  if (typeof options["x-amz-acl"] == 'undefined') {
    options["x-amz-acl"] = "private";
  }
  request.addHeader("x-amz-acl", options["x-amz-acl"]);
  
  request.setBucket(bucket);
  
  request.execute(options);
  
};

S3.prototype.deleteBucket = function (bucket, options) {
  options = options || {};

  var request = new S3Request(this);
  request.setHttpMethod('DELETE');
  
  request.setBucket(bucket);
  request.execute(options);
};

S3.prototype.putObject = function (bucket, objectName, object, options) {
  options = options || {};

  var request = new S3Request(this);
  request.setHttpMethod('PUT');
  request.setBucket(bucket);
  request.setObjectName(objectName);
  
  var failedBlobDuckTest = !(typeof object.copyBlob == 'function' &&
                      typeof object.getDataAsString == 'function' &&
                      typeof object.getContentType == 'function'
                      );
  
  //wrap object in a Blob if it doesn't appear to be one
  if (failedBlobDuckTest) {
    object = Utilities.newBlob(JSON.stringify(object), "application/json");
    object.setName(objectName);
  }
  
  request.setContent(object.getDataAsString());
  request.setContentType(object.getContentType());
  
  request.execute(options);  
};

S3.prototype.getObject = function (bucket, objectName, options) {
  options = options || {};
  
  var request = new S3Request(this);
  request.setHttpMethod('GET');
  
  request.setBucket(bucket);
  request.setObjectName(objectName);
  try {
    var responseBlob = request.execute(options).getBlob();
  } catch (e) {
    if (e.name == "AwsError" && e.code == 'NoSuchKey') {
      return null;
    } else {
      //some other type of error, rethrow
      throw e; 
    }
  }
  
  //not sure this is better to put here, rather than in S3Request class
  if (responseBlob.getContentType() == "application/json") {
     return JSON.parse(responseBlob.getDataAsString());
  }
  return responseBlob;
};

S3.prototype.deleteObject = function (bucket, objectName, options) {
  options = options || {};  
  
  var request = new S3Request(this);
  request.setHttpMethod('DELETE');
  
  request.setBucket(bucket);
  request.setObjectName(objectName);
  
  request.execute(options);  
};

//for debugging
S3.prototype.getLastExchangeLog = function() {
  return this.lastExchangeLog; 
}

S3.prototype.logExchange_ = function(request, response) {
  var logContent = "";
  logContent += "\n-- REQUEST --\n";
  for (i in request) {
    if (typeof request[i] == 'string' && request[i].length > 1000) {
      //truncate to avoid making log unreadable
      request[i] = request[i].slice(0, 1000) + " ... [TRUNCATED]"; 
    }
    logContent += Utilities.formatString("\t%s: %s\n", i, request[i]);
  }
    
  logContent += "-- RESPONSE --\n";
  logContent += "HTTP Status Code: " + response.getResponseCode() + "\n";
  logContent += "Headers:\n";
  
  var headers = response.getHeaders();
  for (i in headers) {
    logContent += Utilities.formatString("\t%s: %s\n", i, headers[i]);
  }
  logContent += "Body:\n" + response.getContentText();
  this.lastExchangeLog = logContent;
}
