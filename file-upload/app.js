const AWS = require("aws-sdk");
const Busboy = require('busboy');
const s3 = new AWS.S3();

 exports.lambdaHandler = async (event) => {
  try {
    console.log('Event',JSON.stringify(event));
    await fileUpload(event);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File uploaded successfully",
      }),
    };
  } catch (err) {
    console.log(err);
    return err;
  }
};

const parseFile = (event) => new Promise((resolve, reject) => {
  let contentType = event.headers['content-type']
  if (!contentType) {
    contentType = event.headers['Content-Type'];
  }

  const busboy = Busboy({ headers: { 'content-type': contentType } });
  const uploadedFile = {};
  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    file.on('data', data => {
      uploadedFile.data = data;
    });

    file.on('end', () => {
      uploadedFile.filename = filename;
      uploadedFile.contentType = mimetype;
    });
  });

  busboy.on('error', error => {
    reject(error);
  });

  busboy.on('finish', () => {
    resolve(uploadedFile);
  });

  busboy.write(event.body, event.isBase64Encoded ? 'base64' : 'binary');
  busboy.end();
});

async function fileUpload(event) {
  const bucketName = process.env.BUCKET_NAME;
  const fileName = `user_data_${Date.now()}.csv`;
  const { data } = await parseFile(event);
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: data,
  };
  console.log("bucketName", bucketName, "fileName", fileName);
  return s3.putObject(params).promise();
}
