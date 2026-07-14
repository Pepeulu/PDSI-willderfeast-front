"use client";

import { AxiosError } from "axios";
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

    if (signup && senha !== confirmacaoSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setEnviando(true);
      const resposta = signup
        ? await register({ nome, email, senha })
        : await login({ email, senha });

      localStorage.setItem("wilderfeast_token", resposta.access_token);
      localStorage.setItem("wilderfeast_user", JSON.stringify(resposta.user));
      router.push("/");
      router.refresh();
    } catch (error) {
      if (error instanceof AxiosError) {
        const detail = error.response?.data?.detail;
        setErro(
          typeof detail === "string"
            ? detail
            : "Não foi possível autenticar. Tente novamente.",
        );
      } else {
        setErro(
          "Não foi possível conectar à API. Verifique se o backend está em execução.",
        );
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="auth-brand" href="/">
        WILDERFEAST
      </Link>
      <section className="auth-panel">
        <div className="auth-art">
          <span className="eyebrow">ENTRE NA SELVA</span>
          <h1>
            {signup
              ? "SUA CAÇADA COMEÇA AGORA."
              : "A FOGUEIRA AINDA ESTÁ ACESA."}
          </h1>
          <p>
            Reúna seu grupo, prepare suas ferramentas e escreva uma história
            digna de ser contada ao redor da fogueira.
          </p>
          <div className="tracks">✦ ᨒ ✦ ᨒ ✦</div>
        </div>
        <form onSubmit={submit}>
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
          <div className="divider">
            <span>OU</span>
          </div>
          <button className="social" type="button">
            G&nbsp;&nbsp; CONTINUAR COM GOOGLE
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
