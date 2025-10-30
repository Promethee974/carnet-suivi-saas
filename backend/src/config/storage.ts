import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'node:stream';
import { env } from './env.js';

// Configuration du client S3
export const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: env.S3_FORCE_PATH_STYLE, // Nécessaire pour MinIO
});

export interface UploadOptions {
  bucket: string;
  key: string;
  body: Buffer;
  contentType?: string;
}

const getBucketForKey = (key: string): string => {
  if (key.startsWith('backups/')) {
    return env.S3_BUCKET_BACKUPS;
  }
  return env.S3_BUCKET_PHOTOS;
};

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

/**
 * Upload un fichier vers S3/MinIO
 */
export async function uploadFile(options: UploadOptions): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: options.bucket,
    Key: options.key,
    Body: options.body,
    ContentType: options.contentType || 'application/octet-stream',
  });

  await s3Client.send(command);

  // Retourner l'URL publique
  return `${env.S3_PUBLIC_URL}/${options.bucket}/${options.key}`;
}

/**
 * Générer une URL signée pour download
 */
export async function getSignedDownloadUrl(bucket: string, key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Supprimer un fichier de S3/MinIO
 */
export async function deleteFile(bucket: string, key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Générer une clé unique pour un fichier
 */
export function generateFileKey(userId: string, type: 'photo' | 'backup', filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const ext = filename.split('.').pop() || 'bin';

  return `${type}/${userId}/${timestamp}-${random}.${ext}`;
}

/**
 * Service de stockage - interface simplifiée
 */
export const storageService = {
  async uploadFile(buffer: Buffer, key: string, contentType: string): Promise<{ url: string; key: string }> {
    const bucket = getBucketForKey(key);
    const url = await uploadFile({ bucket, key, body: buffer, contentType });
    return { url, key };
  },

  async deleteFile(key: string): Promise<void> {
    const bucket = getBucketForKey(key);
    return deleteFile(bucket, key);
  },

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const bucket = getBucketForKey(key);
    return getSignedDownloadUrl(bucket, key, expiresIn);
  },

  async downloadFile(key: string): Promise<Buffer> {
    const bucket = getBucketForKey(key);
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    if (!response.Body) {
      throw new Error('Empty file body');
    }

    const bodyStream = response.Body as Readable;
    return streamToBuffer(bodyStream);
  },
};
