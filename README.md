# Lojinha — CRUD de produtos

Frontend original em HTML/CSS/JavaScript, adaptado para uma API Express com MongoDB. A entidade da atividade é **Produto**. Backend e frontend ficam no mesmo repositório e são publicados separadamente.

## Executar localmente

Requer Node.js 22+ e MongoDB local ou Atlas.

1. `npm ci --prefix backend`
2. Copie `backend/.env.example` para `backend/.env`.
3. Configure `MONGODB_URI`, `MONGODB_DB` e uma `ADMIN_TOKEN` longa, exclusiva para esta aplicação. Não envie o `.env` ao GitHub.
4. `npm start --prefix backend`
5. Em outro terminal: `npm run build` e `npm start`.
6. Abra `http://localhost:8080`. Entre no perfil Vendedor com um email demonstrativo e use a chave configurada no backend para alterar produtos.

O perfil é demonstrativo, não autenticação de usuários. A chave de administração protege POST/PUT/DELETE e fica apenas no campo da página, sem ser incluída no código publicado. As quatro lojas são exemplos fixos; o cadastro de contas, pedidos e pagamentos não integra o CRUD persistente. Compras são explicitamente demonstrativas e não reservam estoque nem cobram valores.

## API

| Método | Rota | Operação |
|---|---|---|
| GET | `/api/health` | Saúde da aplicação e conexão ao banco |
| GET | `/api/products` | Listar produtos |
| GET | `/api/products/:id` | Consultar produto |
| POST | `/api/products` | Criar produto |
| PUT | `/api/products/:id` | Atualizar todos os campos editáveis |
| DELETE | `/api/products/:id` | Excluir produto |

Escrita exige `Authorization: Bearer <ADMIN_TOKEN>`. Exemplo de corpo JSON:

```json
{"name":"Bola de futebol","description":"Bola de treino","category":"Equipamentos","price":99.9,"quantity":5,"storeId":1,"image":"https://example.com/bola.png"}
```

IDs são gerados pelo MongoDB. Preço e estoque aceitam zero, mas não valores negativos; estoque exige inteiro. Retornos: 201 criação, 200 leitura/edição, 204 exclusão, 400 dados inválidos, 401 chave inválida, 404 recurso inexistente e 503 indisponibilidade do banco.

## Testes

`npm test --prefix backend` inicia um MongoDB temporário real e verifica CRUD, persistência, autenticação, validação, CORS e saúde. O primeiro teste baixa o binário oficial do MongoDB. Requer um ambiente que permita executar `mongod`. A mesma suíte roda no GitHub Actions.

## Deploy no Render

Importe o repositório usando `render.yaml` (Blueprint), ou crie um Web Service com diretório `backend`, build `npm ci --omit=dev`, start `npm start` e health check `/api/health`.

Configure no Render:
- `MONGODB_URI`: string de conexão do Atlas com usuário de banco autorizado somente para os dados da aplicação.
- `MONGODB_DB`: `lojinha`.
- `ADMIN_TOKEN`: chave exclusiva para operações de escrita.
- `FRONTEND_ORIGIN`: URL HTTPS exata do frontend Netlify. Origens adicionais podem ser separadas por vírgula.

No Atlas, configure o acesso de rede para as origens de conexão usadas pelo backend e pelo computador de desenvolvimento. Nenhuma credencial deve ser incluída no repositório.

## Deploy no Netlify

Importe o mesmo repositório, usando `npm run build` e diretório de publicação `dist` (já definidos no `netlify.toml`). Configure `API_URL` como a URL do Render seguida de `/api`. O build de produção exige uma URL HTTPS, para evitar publicar apontando para localhost. Apenas os arquivos do frontend são copiados para `dist`.

Após publicar, confirme `/api/health`, abra o frontend e cadastre um produto de teste. Recarregue a página, edite, recarregue novamente e exclua o produto. Confira também a rejeição de chave incorreta e de preço/estoque inválidos.

## Correções realizadas

- Edição não exclui antecipadamente o produto; cancelamento mantém o registro.
- IDs duplicados de filtros/formulários corrigidos.
- Sessão restaurada não volta ao login; navegação não quebra com página inexistente.
- Removida dependência do catálogo externo do Mercado Livre; fonte dos produtos é a API própria.
- Produtos persistidos no MongoDB e falhas de comunicação exibidas.
- Escape de conteúdo dinâmico para impedir interpretação de HTML digitado nos produtos.
- Quantidades inválidas e adição de produto sem estoque bloqueadas.
- Senha e pagamento fictícios identificados como demonstração.

## Estado da execução

Código enviado à branch main. Build, quatro testes de frontend e quatro testes de backend com MongoDB real aprovados no GitHub Actions: https://github.com/paywin/lojinha/actions/runs/35178322979

Serviço gratuito criado no Render: https://dashboard.render.com/web/srv-dallt7ek1f9s738mp4h0

A API ainda depende de configurar MONGODB_URI e ADMIN_TOKEN no ambiente do Render. Após configurar, verificar a saúde em https://lojinha-api-jwus.onrender.com/api/health e publicar o frontend no Netlify com API_URL=https://lojinha-api-jwus.onrender.com/api. Os testes ponta a ponta em nuvem permanecem pendentes.
