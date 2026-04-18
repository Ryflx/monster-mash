import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
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
            gap: '0px',
          }}
        >
          <div
            style={{
              color: '#FF5A1F',
              fontSize: '220px',
              fontWeight: 900,
              fontFamily: 'sans-serif',
              lineHeight: 1,
              letterSpacing: '-12px',
            }}
          >
            MM
          </div>
          <div
            style={{
              color: '#B8FF3C',
              fontSize: '36px',
              fontWeight: 700,
              fontFamily: 'sans-serif',
              letterSpacing: '10px',
              marginTop: '-8px',
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
