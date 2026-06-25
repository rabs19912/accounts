import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-sky-50">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-bold text-sky-600">Accounts</h1>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button variant="ghost" size="sm" type="submit">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-4 px-6 py-12">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Bienvenido</p>
          <h2 className="mt-1 text-3xl font-bold text-gray-900">
            Hola, {session?.user?.name} 👋
          </h2>
          <p className="mt-3 text-muted-foreground">
            Próximamente: grupos de gastos compartidos.
          </p>
        </div>
      </main>
    </div>
  );
}
