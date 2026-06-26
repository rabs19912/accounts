import { auth } from "@/lib/auth";
import { User, Mail } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  const user = session!.user!;

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-10 lg:px-8">
      <h1 className="mb-8 text-xl font-semibold text-gray-900">Perfil</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
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
    </div>
  );
}
