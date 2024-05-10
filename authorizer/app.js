exports.lambdaHandler = async (event) => {
  const token = event.authorizationToken;
  console.log('token',token);
  if (token === 'valid-token') {
      return generatePolicy('user', 'Allow', event.methodArn);
  } else {
      return generatePolicy('user', 'Deny', event.methodArn);
  }
};

const generatePolicy = (principalId, effect, resource) => {
  return {
      principalId: principalId,
      policyDocument: {
          Version: '2012-10-17',
          Statement: [{
              Action: 'execute-api:Invoke',
              Effect: effect,
              Resource: resource
          }]
      }
  };
};
