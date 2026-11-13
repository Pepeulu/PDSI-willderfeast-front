/**
 * Ponto de entrada público para criação de contas.
 * @module app/cadastro
 */
import AuthForm from "@/components/AuthForm";

/** Renderiza o formulário compartilhado no modo de cadastro. */
export default function Cadastro() {
  return <AuthForm signup />;
}
