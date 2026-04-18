import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: '#FF5A1F',
              fontSize: '78px',
              fontWeight: 900,
              fontFamily: 'sans-serif',
              lineHeight: 1,
              letterSpacing: '-4px',
            }}
          >
            MM
          </div>
          <div
            style={{
              color: '#B8FF3C',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'sans-serif',
              letterSpacing: '4px',
              marginTop: '-4px',
            }}
          >
            MASH
          </div>
        </div>
      </div>
    ),
    size,
  );
}
