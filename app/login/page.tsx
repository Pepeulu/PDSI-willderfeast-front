/**
 * Ponto de entrada público para autenticação de usuários existentes.
 * @module app/login
 */
import AuthForm from "@/components/AuthForm";

/** Renderiza o formulário compartilhado no modo de login. */
export default function Login() {
  return <AuthForm />;
}
