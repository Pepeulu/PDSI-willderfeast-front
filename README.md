# Wilderfeast Hub

Aplicativo web para criar e gerenciar fichas de ferais, consultar o bestiário e rolar dados durante partidas de Wilderfeast. A aplicação usa Next.js, React e TypeScript.

## Pré-requisitos

- Node.js com npm. Use Node.js 22.13 ou superior na linha 22, ou Node.js 24.
- Acesso à API do Wilderfeast para cadastro, login, fichas e bestiário. Os testes simulam a API.

## Executar localmente

Na raiz do projeto, instale as dependências do `package-lock.json` e inicie o servidor de desenvolvimento.

```sh
npm ci
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Crie uma conta em `/cadastro` ou entre em `/login`. Em **Utensílios**, consulte o catálogo mesmo antes de criar seu primeiro Feral. Novos utensílios cadastrados no banco aparecem nesse catálogo e na criação da ficha. Escolha um para começar com ele no inventário. Na ficha, abra **Inventário** para ajustar a durabilidade do equipamento. A ficha também permite ajustar estilos, habilidades, traços e condições. No bestiário, abra uma fera para consultar partes, técnicas e efeitos de quebra.

### Usar outro endereço de API

O endereço padrão é `https://poas-wilderfeast.onrender.com`. Para usar outra instância, crie um arquivo `.env.local` na raiz e indique a URL base da API sem a barra final.

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Reinicie o servidor de desenvolvimento após alterar o arquivo. Para produção, gere um novo build. O Next.js também incorpora esse endereço ao código do navegador para resolver URLs de imagens. Use uma URL acessível pelo navegador e mantenha credenciais fora da variável.

Os novos recursos exigem a versão da API que contém as rotas de inventário e atributos. Nesta cópia do projeto, o repositório independente da API está em `POAS-Wilderfeast/backend`. Siga seu README para preparar o banco e carregar o catálogo antes de iniciar os dois servidores. A migração do banco prepara seis opções iniciais: Barbante, Cutelo, Espeto, Luvas, Maçarico e Panela. Para publicar, aplique as migrações e os catálogos da API antes de atualizar o frontend.

Para montar a mesma versão em outra máquina, a partir da raiz deste frontend, aplique as alterações à revisão de origem da API.

```sh
git clone https://github.com/ArthurGui004/POAS-Wilderfeast.git POAS-Wilderfeast
git -C POAS-Wilderfeast switch -c integracao-wilderfeast d6eb4cce35f5a3dc9340690b399a0504184d2151
git -C POAS-Wilderfeast apply ../integracao/api-wilderfeast.patch
```

### Executar em modo de produção

```sh
npm run build
npm start
```

O servidor de produção também usa a porta 3000 por padrão.

### Windows e OneDrive

Se `npm run dev` ou `npm run build` falhar ao criar ou acessar `.next-local`, coloque uma cópia do projeto fora da pasta sincronizada pelo OneDrive, execute `npm ci` nessa cópia e repita o comando.

## Verificações

| Comando                 | Resultado esperado                                                        |
| ----------------------- | ------------------------------------------------------------------------- |
| `npm run lint`          | Verifica as regras de Hooks e de pureza configuradas no ESLint.           |
| `npm run typecheck`     | Verifica os tipos do TypeScript.                                          |
| `npm run format:check`  | Verifica a formatação. Use `npm run format` para aplicá-la.               |
| `npm test`              | Executa a suíte de testes.                                                |
| `npm run test:coverage` | Gera o relatório e exige 100% em cada métrica por arquivo instrumentável. |

Abra `coverage/index.html` para ver a cobertura por arquivo. A linha **All files** mostra o total de instruções, ramificações, funções e linhas. A cobertura mede código executável TypeScript e JavaScript.

## Organização

| Caminho            | Responsabilidade                                                  |
| ------------------ | ----------------------------------------------------------------- |
| `app/`             | Páginas, layout, estilos e rota de sessão do Next.js.             |
| `components/`      | Componentes React compartilhados.                                 |
| `lib/api.ts`       | Contratos TypeScript e cliente HTTP usado pela interface.         |
| `app/api/session/` | Integração com a API externa e gerenciamento do cookie de sessão. |
| `middleware.ts`    | Redirecionamento de páginas protegidas para o login.              |
| `tests/`           | Testes de componentes, rotas e integração com o cliente HTTP.     |

As funções de renderização derivam a interface de props e estado. Eventos do usuário executam as gravações locais e as ações de formulário. Os efeitos sincronizam a interface com dados externos.

## Licença

O código deste repositório é distribuído sob a [Licença MIT](LICENSE). As ilustrações, imagens, fontes e marcas de terceiros continuam sujeitas às condições dos respectivos titulares.
