"use client";

import { useState } from "react";
import { sendInvitationAction } from "@/app/actions/invitations";

type Mode = "select" | "email";
type Status = "idle" | "pending" | "success" | "error";

export function useCreateGroup() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("select");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function reset() {
    setMode("select");
    setStatus("idle");
    setError(null);
    setSentTo(null);
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 300);
  }

  async function submit(formData: FormData) {
    setStatus("pending");
    setError(null);

    const result = await sendInvitationAction(formData);

    if (result?.error) {
      setError(result.error);
      setStatus("error");
      return;
    }

    setSentTo(result.email ?? null);
    setStatus("success");
  }

  return { open, setOpen, mode, setMode, status, error, sentTo, close, submit };
}
