"use client";

/**
 * Formulário compartilhado pelas rotas de login e cadastro.
 * @module
 */

import imagensCloudinary from "@/lib/imagens-cloudinary.json";
import { type AuthUser, getApiErrorMessage, login, register } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

const { brandIcon, nameIcon, passwordIcon, flameIcon, registerIcon } =
  imagensCloudinary.iconesAcesso;

/** Apresenta os campos de acesso ou, no modo `signup`, os campos de cadastro. */
export default function AuthForm({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Recupera o e-mail lembrado após a montagem do formulário de login.
  useEffect(() => {
    if (signup) {
      return;
    }

    const rememberedIdentity = localStorage.getItem("wilderfeast_identity");
    if (rememberedIdentity) {
      setEmail(rememberedIdentity);
      setLembrar(true);
    }
  }, [signup]);

  /** Valida os dados, estabelece a sessão e navega para o destino após o acesso. */
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    if (!email.trim() || !senha || (signup && !nome.trim())) {
      setErro(
        signup ? "Dados de cadastro incompletos." : "Credenciais incompletas.",
      );
      return;
    }

    const emailNormalizado = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      setErro("Digite um endereço de e-mail válido.");
      return;
    }

    try {
      setEnviando(true);
      let usuario: AuthUser;

      if (signup) {
        usuario = await register({
          email: emailNormalizado,
          nome: nome.trim(),
          senha,
        });
      } else {
        usuario = {
          email: emailNormalizado,
          id: 0,
          nome: emailNormalizado.split("@")[0],
        };
      }

      const resposta = await login({
        email: emailNormalizado,
        senha,
      });
      const usuarioAutenticado: AuthUser = {
        ...usuario,
        id: resposta.usuario_id,
        nome: usuario.nome ?? nome.trim(),
      };

      localStorage.setItem(
        "wilderfeast_user",
        JSON.stringify(usuarioAutenticado),
      );
      if (lembrar) {
        localStorage.setItem("wilderfeast_identity", emailNormalizado);
      } else {
        localStorage.removeItem("wilderfeast_identity");
      }

      const nextPath = new URLSearchParams(window.location.search).get("next");
      router.push(
        nextPath?.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/",
      );
      router.refresh();
    } catch (error) {
      setErro(
        getApiErrorMessage(
          error,
          signup
            ? "Não foi possível concluir o cadastro."
            : "Credenciais inválidas.",
        ),
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main
      className="auth-page"
      style={{ backgroundImage: `url(${imagensCloudinary.interface.login})` }}
    >
      <div className="auth-page-overlay" aria-hidden="true" />

      <div className="auth-main">
        <header className="auth-hero">
          <img className="auth-mark" src={brandIcon} alt="" />
          <h1>WILDERFEAST HUB</h1>
          <p>Crônicas do Caçador-Cozinheiro</p>
        </header>

        <section className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-panel-heading">
              <h2>{signup ? "Registro do Feral" : "Login do Feral"}</h2>
              <span>REF. DE ENTRADA 001</span>
            </div>

            <form noValidate onSubmit={submit}>
              <label className="auth-field">
                <span>{signup ? "Nome de usuário" : "E-mail"}</span>
                <span className="auth-input-row">
                  <input
                    autoComplete={signup ? "username" : "email"}
                    onChange={(event) =>
                      signup
                        ? setNome(event.target.value)
                        : setEmail(event.target.value)
                    }
                    placeholder={
                      signup
                        ? "Digite seu nome de usuário..."
                        : "Digite seu e-mail..."
                    }
                    required
                    type={signup ? "text" : "email"}
                    value={signup ? nome : email}
                  />
                  <img src={nameIcon} alt="" />
                </span>
              </label>

              {signup && (
                <label className="auth-field">
                  <span>E-mail</span>
                  <span className="auth-input-row">
                    <input
                      autoComplete="email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Digite seu e-mail..."
                      required
                      type="email"
                      value={email}
                    />
                    <img src={nameIcon} alt="" />
                  </span>
                </label>
              )}

              <label className="auth-field">
                <span>Senha</span>
                <span className="auth-input-row auth-password-row">
                  <input
                    autoComplete={signup ? "new-password" : "current-password"}
                    minLength={6}
                    onChange={(event) => setSenha(event.target.value)}
                    placeholder="Digite sua senha..."
                    required
                    type="password"
                    value={senha}
                  />
                  <img src={passwordIcon} alt="" />
                </span>
              </label>

              <div className="auth-options">
                <label className="auth-remember">
                  <input
                    checked={lembrar}
                    onChange={(event) => setLembrar(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Lembrar de mim</span>
                </label>
                <Link href="/login">Esqueceu a senha?</Link>
              </div>

              {erro && (
                <p className="auth-error" role="alert">
                  {erro}
                </p>
              )}

              <div className="auth-actions">
                <button
                  className="auth-primary"
                  disabled={enviando}
                  type="submit"
                >
                  <span>
                    {enviando ? "AGUARDE..." : signup ? "CADASTRAR" : "ENTRAR"}
                  </span>
                  {!enviando && <img src={flameIcon} alt="" />}
                </button>

                <div className="auth-divider">
                  <span>OU</span>
                </div>

                <Link
                  className="auth-secondary"
                  href={signup ? "/login" : "/cadastro"}
                >
                  <img src={registerIcon} alt="" />
                  <span>{signup ? "ENTRAR" : "CADASTRAR NOVO FERAL"}</span>
                </Link>
              </div>
            </form>
          </div>
        </section>

        <footer></footer>
      </div>
    </main>
  );
}
