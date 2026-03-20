"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'inscription");
        return;
      }

      // Auto sign-in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Inscription réussie. Veuillez vous connecter.");
        router.push("/login");
      } else {
        router.push("/onboarding/weight");
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center space-y-2">
        <p className="text-3xl font-bold" style={{ color: "#E8384F" }}>
          Sane
        </p>
        <h1 className="text-2xl font-bold text-foreground">Créer un compte</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-foreground">
            Nom
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={cn(
              "h-12 rounded-xl border border-border",
              "focus-visible:ring-[#E8384F] focus-visible:border-[#E8384F]"
            )}
          />
        </div>

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
            minLength={8}
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
          {loading ? "Inscription..." : "S'inscrire"}
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium" style={{ color: "#E8384F" }}>
          Se connecter
        </Link>
      </p>
    </>
  );
}
