'use server'

import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3'

let s3Client = null

function getS3Client() {
   if (s3Client) {
      return s3Client
   }
   const { R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env
   if (!R2_ENDPOINT_URL || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return null
   }
   s3Client = new S3Client({
      endpoint: R2_ENDPOINT_URL,
      region: 'auto',
      credentials: {
         accessKeyId: R2_ACCESS_KEY_ID,
         secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
   })
   return s3Client
}

export async function deleteR2Objects(keys) {
   if (!keys || keys.length === 0) {
      return
   }
   const client = getS3Client()
   if (!client) {
      console.warn('R2 not configured — skipping R2 object deletion')
      return
   }
   const bucket = process.env.R2_BUCKET_NAME
   // S3 DeleteObjects supports up to 1000 keys per request
   for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000)
      try {
         await client.send(new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: batch.map(Key => ({ Key })) },
         }))
      } catch (err) {
         console.error(`Failed to delete R2 objects (batch ${i / 1000 + 1}):`, err.message)
      }
   }
}
