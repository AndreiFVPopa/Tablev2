import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router redirect protocol; remove if redirect() becomes throwable Error.
    throw redirect({ to: "/elevi" });
  },
});
