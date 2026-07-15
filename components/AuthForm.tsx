"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { login, register } from "@/lib/api";

export default function AuthForm({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    if (
      !email.trim() ||
      !senha ||
      (signup && (!nome.trim() || !confirmacaoSenha))
    ) {
      setErro(
        signup ? "Dados de cadastro incompletos." : "Credenciais incompletas.",
      );
      return;
    }

    if (signup && senha !== confirmacaoSenha) {
      setErro("Dados de cadastro inválidos.");
      return;
    }

    try {
      setEnviando(true);
      const resposta = signup
        ? await register({ nome, email, senha })
        : await login({ email, senha });

      const sessionResponse = await fetch("/api/session", {
        body: JSON.stringify({ token: resposta.access_token }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!sessionResponse.ok) {
        throw new Error("Não foi possível iniciar sua sessão.");
      }

      localStorage.setItem("wilderfeast_user", JSON.stringify(resposta.user));
      const nextPath = new URLSearchParams(window.location.search).get("next");
      router.push(
        nextPath?.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/",
      );
      router.refresh();
    } catch {
      setErro(
        signup
          ? "Não foi possível concluir o cadastro."
          : "Credenciais inválidas.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="auth-brand" href="/">
        
      </Link>
      <section className="auth-panel">
        <div className="auth-art">
          <span className="eyebrow">ENTRE NESSE NOVO MUNDO</span>
          <h1>
            {signup
              ? "SUA CAÇADA COMEÇA AGORA."
              : "A CAÇADA AINDA CONTINUA."}
          </h1>
          <p>
            Reúna seu grupo, prepare suas ferramentas e escreva uma história
            digna de ser contada ao redor de uma fogueira.
          </p>
          <div className="tracks"></div>
        </div>
        <form noValidate onSubmit={submit}>
          <span className="eyebrow">
            {signup ? "NOVO AVENTUREIRO" : "BEM-VINDO DE VOLTA"}
          </span>
          <h2>{signup ? "CRIAR CONTA" : "ENTRAR"}</h2>
          {signup && (
            <label>
              NOME
              <input
                autoComplete="name"
                onChange={(event) => setNome(event.target.value)}
                placeholder="Como devemos chamar você?"
                required
                value={nome}
              />
            </label>
          )}
          <label>
            E-MAIL
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            SENHA
            <input
              autoComplete={signup ? "new-password" : "current-password"}
              minLength={6}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="••••••••"
              required
              type="password"
              value={senha}
            />
          </label>
          {signup && (
            <label>
              CONFIRMAR SENHA
              <input
                autoComplete="new-password"
                minLength={6}
                onChange={(event) => setConfirmacaoSenha(event.target.value)}
                placeholder="••••••••"
                required
                type="password"
                value={confirmacaoSenha}
              />
            </label>
          )}
          {erro && (
            <p className="auth-error" role="alert">
              {erro}
            </p>
          )}
          <button className="btn primary" disabled={enviando} type="submit">
            {enviando
              ? "AGUARDE..."
              : signup
                ? "COMEÇAR AVENTURA"
                : "ENTRAR NA CONTA"}
          </button>
          <p className="switch">
            {signup ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
            <Link href={signup ? "/login" : "/cadastro"}>
              {signup ? "Entrar" : "Cadastre-se"}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
