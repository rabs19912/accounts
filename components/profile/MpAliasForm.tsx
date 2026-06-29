"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateMpAliasAction } from "@/app/actions/settlements";
import { useRouter } from "next/navigation";

type Status = "idle" | "saving" | "saved";

export function MpAliasForm({ initialAlias }: { initialAlias: string }) {
  const [alias, setAlias] = useState(initialAlias);
  const [status, setStatus] = useState<Status>("idle");
  const router = useRouter();

  async function handleSave() {
    setStatus("saving");
    await updateMpAliasAction(alias);
    setStatus("saved");
    router.refresh();
    setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="tu.alias.mp"
          className="flex-1"
        />
        <Button size="sm" onClick={handleSave} disabled={status === "saving"}>
          {status === "saving" ? "Guardando…" : "Guardar"}
        </Button>
      </div>
      {status === "saved" && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600">
          <Check className="h-3.5 w-3.5" /> Guardado
        </p>
      )}
    </div>
  );
}
