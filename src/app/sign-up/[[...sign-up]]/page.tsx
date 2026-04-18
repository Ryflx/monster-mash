import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-pitch p-4 gap-6">
      <div className="text-center">
        <div
          className="uppercase text-monster"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '56px',
            letterSpacing: '-2px',
            lineHeight: 0.88,
            textShadow: '3px 3px 0 var(--color-pitch), 3px 3px 0 0 var(--color-slime)',
          }}
        >
          JOIN THE<br />PACK
        </div>
        <p
          className="uppercase text-bone-3 mt-3"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '18px',
            letterSpacing: '1px',
          }}
        >
          MASH OUT · GET AFTER IT
        </p>
      </div>
      <SignUp
        appearance={{
          variables: {
            colorPrimary: '#FF5A1F',
            colorBackground: '#1C1C1C',
            colorText: '#F5F1E8',
            colorTextSecondary: '#C9C2B0',
            colorInputBackground: '#0A0A0A',
            colorInputText: '#F5F1E8',
            colorDanger: '#D42F2F',
            colorSuccess: '#B8FF3C',
            borderRadius: '6px',
            fontFamily: 'Space Grotesk, system-ui, sans-serif',
            fontFamilyButtons: 'Rubik Mono One, Arial Black, sans-serif',
          },
          elements: {
            card: 'border-2 border-smoke shadow-[4px_4px_0_0_#0A0A0A]',
          },
        }}
      />
    </main>
  );
}
