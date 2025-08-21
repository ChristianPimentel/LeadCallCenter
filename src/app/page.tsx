import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/icons';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center gap-2 mb-4">
            <Logo className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Lead Call Center
            </h1>
        </div>
        <p className="text-lg text-muted-foreground">
            Streamline your student outreach.
        </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
