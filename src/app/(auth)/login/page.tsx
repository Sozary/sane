"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou mot de passe incorrect");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <>
      <div className="text-center space-y-2">
        <p className="text-3xl font-bold" style={{ color: "#E8384F" }}>
          Sane
        </p>
        <h1 className="text-2xl font-bold text-foreground">Connexion</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={cn(
              "h-12 rounded-xl border border-border",
              "focus-visible:ring-[#E8384F] focus-visible:border-[#E8384F]"
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Mot de passe
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={cn(
              "h-12 rounded-xl border border-border",
              "focus-visible:ring-[#E8384F] focus-visible:border-[#E8384F]"
            )}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl text-white font-medium"
          style={{ backgroundColor: "#E8384F" }}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-medium" style={{ color: "#E8384F" }}>
          S&apos;inscrire
        </Link>
      </p>
    </>
  );
}
