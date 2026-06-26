import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { User, Mail, Wallet } from "lucide-react";
import { updateMpAliasAction } from "@/app/actions/settlements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function ProfilePage() {
  const session = await auth();
  const user = await db.user.findUnique({
    where: { id: session!.user!.id! },
    select: { id: true, name: true, email: true, mpAlias: true },
  });

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-10 lg:px-8">
      <h1 className="mb-8 text-xl font-semibold text-gray-900">Perfil</h1>

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-xl font-semibold text-sky-700">
            {getInitials(user.name ?? "?")}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-muted-foreground">Miembro de Accounts</p>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{user.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{user.email}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-sky-600" />
          <h2 className="text-sm font-semibold text-gray-900">Datos de pago</h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Tu alias de MercadoPago se muestra a los demás cuando te deben plata, para que puedan transferirte fácilmente.
        </p>
        <form action={updateMpAliasAction}>
          <label className="mb-1.5 block text-xs text-foreground/70" htmlFor="mpAlias">
            Alias de MercadoPago
          </label>
          <div className="flex gap-2">
            <Input
              id="mpAlias"
              name="mpAlias"
              placeholder="tu.alias.mp"
              defaultValue={user.mpAlias ?? ""}
              className="flex-1"
            />
            <Button type="submit" size="sm">
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
