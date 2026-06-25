import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-sky-600">Accounts</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresá a tu cuenta
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="font-medium text-sky-600 hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
