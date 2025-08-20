import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/icons';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col items-center md:items-start text-center md:text-left p-8">
             <div className="flex items-center gap-2 mb-4">
                <Logo className="h-10 w-10 text-primary" />
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                    CallFlow
                </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6">
              Streamline your student outreach. Manage groups, track calls, and improve communication efficiency.
            </p>
            <div className="w-full aspect-video relative rounded-lg overflow-hidden shadow-xl border">
                <Image
                    src="https://placehold.co/600x400.png"
                    alt="Dashboard preview"
                    fill
                    className="object-cover"
                    data-ai-hint="dashboard preview"
                />
            </div>
          </div>
          <div className="w-full">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
