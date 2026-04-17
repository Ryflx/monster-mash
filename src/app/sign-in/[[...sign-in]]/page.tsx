import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-4">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#E63946',
            colorBackground: '#1A1A1A',
            colorText: '#FFFFFF',
            colorTextSecondary: '#888888',
            colorInputBackground: '#0D0D0D',
            colorInputText: '#FFFFFF',
            borderRadius: '0.75rem',
          },
        }}
      />
    </main>
  );
}
