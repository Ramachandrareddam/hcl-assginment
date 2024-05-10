const AWS = require("aws-sdk");
const csv = require('csv-parser');
const sendGridMail = require('@sendgrid/mail');

sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
const s3 = new AWS.S3();

 exports.lambdaHandler = async (event) => {
  try {
    const body = JSON.parse( event.Records[0].body);
    const { bucketName,keyName } = fetchS3Details(body);
    const fileData = await readS3File(bucketName,keyName);
    console.log('fileData',JSON.stringify(fileData));
    let promiseArray =[];
    for(let i=0;i<fileData.length;i++){
      promiseArray.push(sendEmail(fileData['email']))
    }
    await Promise.all(promiseArray);
  } catch (err) {
    console.log(err);
    return err;
  }
};

function fetchS3Details(event){
  const bucketObj = event.Records[0]['s3'];
  const bucketName = bucketObj['bucket']['name'];
  const keyName = bucketObj['object']['key'];
  return { bucketName,keyName};
}
async function readS3File(bucketName, keyName) {
  const params = {
    Bucket: bucketName,
    Key: keyName,
  };
  return new Promise((resolve, reject) => {
    const results = [];
    s3.getObject(params)
      .createReadStream()
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}


function getMessage(toEmailId) {
  const body = 'This is a test email ';
  return {
    to: toEmailId,
    from: 'ramachandra.reddam@gmail.com',
    cc:'rcrmca1@gmail.com',
    subject: 'Test email!',
    text: body,
    html: `<strong>${body}</strong>`,
  };
}

async function sendEmail(toEmailId) {
  try {
    await sendGridMail.send(getMessage(toEmailId));
  } catch (error) {
    console.error('Error sending test email');
    console.error(error);
  }
}
