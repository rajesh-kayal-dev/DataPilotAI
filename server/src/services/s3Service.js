import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { logger } from '../utils/logger.js';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Verify S3 configuration on startup
 */
export const checkS3Connection = async () => {
  try {
    const command = new HeadBucketCommand({ Bucket: process.env.AWS_BUCKET });
    await s3Client.send(command);
    logger.info('AWS S3 connected successfully');
    return true;
  } catch (error) {
    logger.error('AWS S3 connection failed. Check your credentials and bucket name.', { error: error.message });
    return false;
  }
};

/**
 * Upload a file buffer to S3
 * @param {Buffer} fileBuffer 
 * @param {string} fileName 
 * @param {string} mimeType 
 * @returns {Promise<{key: string, url: string}>}
 */
export const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
  const key = `documents/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  return {
    key,
    url: `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  };
};

/**
 * Delete an object from S3
 * @param {string} key 
 */
export const deleteFromS3 = async (key) => {
  if (!key) return;
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
  });
  await s3Client.send(command);
};

/**
 * Get an object stream from S3
 * @param {string} key 
 * @returns {Promise<ReadableStream>}
 */
export const getFileFromS3 = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
  });
  const response = await s3Client.send(command);
  return response.Body;
};
