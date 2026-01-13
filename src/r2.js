// r2.js
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
const crypto = require("crypto");
const path = require("path");

dotenv.config();

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadFile(fileBuffer, originalName) {
  const fileName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${path.extname(originalName)}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: "audio/mpeg",
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
}

module.exports = { uploadFile };
