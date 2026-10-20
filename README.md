<p align="center"><img src="public/biziva/brand.svg" width="64" alt="Biziva" /></p>

# Biziva Transfer

Envie com mais certeza. Confira a integridade antes e depois da transferência. Os arquivos são lidos apenas neste navegador.

Fork completo de [schlagmichdoch/PairDrop](https://github.com/schlagmichdoch/PairDrop), referência `1b0c9c9d903c3cfc706df1303dc75c3b54d04c77`. Licença **GPL-3.0**, copyright, histórico e aplicação original preservados. O projeto original tinha 11,631 estrelas na consulta de 19/10/2026; essas estrelas não pertencem a este fork. Não prometemos viralização.

## Começar em menos de um minuto

Requer Node.js 22 ou superior. O workspace Biziva não instala dependências nem exige chaves:

```sh
git clone https://github.com/omatheuslop/biziva-transfer.git
cd biziva-transfer
npm run biziva
```

Abra http://127.0.0.1:8891/biziva/ . Porta opcional: `PORT=8892 npm run biziva`. O servidor escuta somente em loopback. Para produção, configure sua própria hospedagem HTTPS; este commit não provisiona SaaS.

## O que foi acrescentado

Confira a integridade antes e depois da transferência. Os arquivos são lidos apenas neste navegador. Interface Biziva, entrada e saída revisáveis, exportação explícita e projeto local portátil, sem persistir dados automaticamente. Implementação em `public/biziva/logic.mjs`; UI em `public/biziva/`.

Conferência SHA-256 de até 100 arquivos, até 64 MiB cada e 512 MiB no lote; detecta ausentes, extras e divergentes. Manifestos não enviam arquivos nem substituem a transferência PairDrop.

## App original

As funcionalidades completas do upstream continuam no repositório. Siga [UPSTREAM-README.md](UPSTREAM-README.md) para instalar, compilar e configurar o app original. A entrada nativa tem um atalho para `/biziva/index.html`; esse workspace também pode ser servido pelos assets públicos do app original. O servidor mínimo `npm run biziva` serve apenas a extensão local, não substitui backends ou protocolos do original.

## Verificação

```sh
npm run test:biziva
```

CI da extensão e testes locais não certificam todo o código, dependências, integrações ou protocolos herdados do upstream. Leia [BIZIVA.md](BIZIVA.md) para o escopo e limites.
