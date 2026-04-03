#!/usr/bin/env python3
"""
Backfill migration: compress existing cars.screenshot bytea data to WebP,
upload to Cloudflare R2, and populate the screenshots table.

Prerequisites:
    1. Run the schema migration first (see SCHEMA.sql or migration SQL below).
    2. Set R2 env vars in .env: R2_ENDPOINT_URL, R2_ACCESS_KEY_ID,
       R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL.

Usage:
    python backfill_screenshots.py [--batch-size 50] [--dry-run]

Schema migration SQL (run before this script):

    CREATE TABLE IF NOT EXISTS screenshots (
        id integer NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        md5_hash character(32) NOT NULL UNIQUE,
        r2_key text NOT NULL,
        r2_url text NOT NULL,
        format text NOT NULL DEFAULT 'webp',
        width integer,
        height integer,
        original_size integer,
        compressed_size integer,
        created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    ALTER TABLE cars ADD COLUMN IF NOT EXISTS screenshot_id integer
        REFERENCES screenshots(id);
"""

import argparse
import hashlib
import io
import os
import re
import sys

import boto3
import psycopg
from dotenv import load_dotenv
from PIL import Image

load_dotenv()


def compress_to_webp(png_data, quality=80):
    img = Image.open(io.BytesIO(png_data))
    width, height = img.size
    buf = io.BytesIO()
    img.save(buf, format='WebP', quality=quality)
    return buf.getvalue(), width, height


def main():
    parser = argparse.ArgumentParser(description='Backfill screenshots to R2')
    parser.add_argument('--batch-size', type=int, default=50)
    parser.add_argument('--dry-run', action='store_true', help='Compress and report but do not upload or update DB')
    args = parser.parse_args()

    conn = psycopg.connect(os.environ['PGSQL_URL'], connect_timeout=10)

    s3 = boto3.client(
        's3',
        endpoint_url=os.environ['R2_ENDPOINT_URL'],
        aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],
        region_name='auto',
    )
    bucket = os.environ['R2_BUCKET_NAME']
    public_url = os.environ['R2_PUBLIC_URL'].rstrip('/')

    with conn.cursor() as cur:
        cur.execute('''
            SELECT count(*) FROM cars
            WHERE screenshot IS NOT NULL AND screenshot_id IS NULL
        ''')
        total = cur.fetchone()[0]

    print(f'Found {total} cars with screenshots to backfill')
    if total == 0:
        return

    processed = 0
    skipped = 0
    dedup_hits = 0
    total_original = 0
    total_compressed = 0

    while processed + skipped < total:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute('''
                    SELECT c.id, c.vehicle_id, c.screenshot, s.name as search_name
                      FROM cars c
                     INNER JOIN searches s ON c.search_id = s.id
                     WHERE c.screenshot IS NOT NULL AND c.screenshot_id IS NULL
                     LIMIT %s
                ''', (args.batch_size,))
                rows = cur.fetchall()

                if not rows:
                    break

                for car_id, vehicle_id, screenshot_data, search_name in rows:
                    try:
                        webp_data, width, height = compress_to_webp(screenshot_data)
                        original_size = len(screenshot_data)
                        compressed_size = len(webp_data)
                        md5_hash = hashlib.md5(webp_data).hexdigest()
                        total_original += original_size
                        total_compressed += compressed_size

                        if args.dry_run:
                            print(f'  [DRY RUN] car={car_id} vehicle={vehicle_id}: '
                                  f'{original_size / 1024:.0f}KB → {compressed_size / 1024:.0f}KB '
                                  f'({compressed_size / original_size * 100:.0f}%)')
                            processed += 1
                            continue

                        # Check dedup
                        cur.execute('SELECT id FROM screenshots WHERE md5_hash = %s', (md5_hash,))
                        existing = cur.fetchone()

                        if existing:
                            screenshot_id = existing[0]
                            dedup_hits += 1
                        else:
                            safe_name = re.sub(r'\W+', '_', search_name).lower().strip('_')
                            r2_key = f'screenshots/{safe_name}/{vehicle_id}/backfill.webp'
                            r2_url = f'{public_url}/{r2_key}'

                            s3.put_object(Bucket=bucket, Key=r2_key, Body=webp_data, ContentType='image/webp')

                            cur.execute('''
                                INSERT INTO screenshots (md5_hash, r2_key, r2_url, format, width, height, original_size, compressed_size)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                                RETURNING id
                            ''', (md5_hash, r2_key, r2_url, 'webp', width, height, original_size, compressed_size))
                            screenshot_id = cur.fetchone()[0]

                        cur.execute('UPDATE cars SET screenshot_id = %s WHERE id = %s', (screenshot_id, car_id))
                        processed += 1

                        print(f'  [{processed}/{total}] car={car_id} vehicle={vehicle_id}: '
                              f'{original_size / 1024:.0f}KB → {compressed_size / 1024:.0f}KB '
                              f'({compressed_size / original_size * 100:.0f}%)'
                              f'{" (dedup)" if existing else ""}')

                    except Exception as e:
                        print(f'  ERROR car={car_id}: {e}', file=sys.stderr)
                        skipped += 1

    conn.close()

    print(f'\nDone! Processed: {processed}, Skipped: {skipped}, Dedup hits: {dedup_hits}')
    if total_original > 0:
        print(f'Total: {total_original / 1024 / 1024:.1f}MB → {total_compressed / 1024 / 1024:.1f}MB '
              f'({total_compressed / total_original * 100:.0f}% of original)')


if __name__ == '__main__':
    main()
