import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  const svg = readFileSync(join(process.cwd(), 'public/brand/logo-appicon-orange.svg'));
  const src = `data:image/svg+xml;base64,${svg.toString('base64')}`;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={512} height={512} alt="" />
      </div>
    ),
    size,
  );
}
