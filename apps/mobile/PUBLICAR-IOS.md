# Publicar o app iOS na App Store (EAS)

O build de iOS roda na nuvem do EAS (funciona a partir do Windows). O código e a
config já estão prontos — faltam só os passos que exigem **suas credenciais** e que
não podem ser feitos por aqui.

## ⚠️ Antes de tudo: o backend precisa estar no ar

O build de produção aponta para `https://contacerta.linkwise.digital`
(`eas.json` → `build.production.env`). A revisão da Apple **testa o app de verdade** —
se o login não funcionar porque o servidor não responde, o app é **reprovado**.

Faça o deploy no VPS primeiro (ver [README](../../README.md#deploy-no-vps-contacertalinkwisedigital)),
confirme que `https://contacerta.linkwise.digital` abre com TLS válido, e crie uma
**conta de teste em produção** (via dashboard web) para informar à Apple na revisão.

## Pré-requisitos (uma vez)

- **Apple Developer Program** ativo (US$ 99/ano) — https://developer.apple.com/programs/
- **Conta Expo** (grátis) — https://expo.dev/signup
- App criado no **App Store Connect** (https://appstoreconnect.apple.com) com o
  bundle id `com.meusaldo.app`. Anote o **Apple ID do app** (App Information → General →
  Apple ID, um número) — é o `ascAppId`.

## Passos

Tudo a partir de `apps/mobile`:

```bash
cd apps/mobile
npx eas-cli login                 # sua conta Expo
npx eas-cli init                  # cria o projeto e grava extra.eas.projectId no app.json
```

Preencha em `eas.json` → `submit.production.ios`: `appleId` (seu e-mail Apple),
`ascAppId` (número do App Store Connect) e `appleTeamId` (Membership → Team ID).

```bash
# 1) Build na nuvem — o EAS cria/gerencia o certificado de distribuição e o
#    provisioning profile automaticamente (responda "yes" quando perguntar).
npx eas-cli build --platform ios --profile production

# 2) Envio para o App Store Connect (TestFlight)
npx eas-cli submit --platform ios --profile production --latest
```

Ou tudo de uma vez: `npx eas-cli build --platform ios --profile production --auto-submit`.

O número de build é gerenciado pelo EAS (`appVersionSource: remote` + `autoIncrement`),
então cada build sobe sozinho. Para uma nova versão pública, altere `version` em
`app.json` (ex.: `1.0.1`).

## No App Store Connect (antes de enviar para revisão)

- **Privacidade do app** (obrigatório p/ finanças): declare os dados coletados
  (e-mail, dados financeiros lançados pelo usuário) na seção *App Privacy*.
- **URL da política de privacidade** — obrigatória; hospede uma página simples.
- **Screenshots** (6.7" e 6.5" no mínimo), descrição, palavras-chave, categoria
  (*Finance*), classificação etária.
- **Notas para revisão**: informe a conta de teste de produção (e-mail + senha) —
  o app é atrás de login e o revisor precisa entrar.

## Observações

- **pnpm monorepo**: se o build na nuvem falhar com "Unable to resolve module",
  crie um `.npmrc` na raiz do repositório com `node-linker=hoisted`, rode
  `pnpm install` e refaça o build. (Mantido isolado por enquanto porque os builds
  locais passam assim.)
- **Exclusão de conta**: a criação de conta é só no dashboard web (o app apenas faz
  login). Se o revisor exigir exclusão de conta in-app (guideline 5.1.1(v)),
  responda que o cadastro/gestão da conta é feito na web, ou adicione um fluxo de
  exclusão — avaliar se a Apple pedir.
- **Sem permissões nativas sensíveis**: o app não usa câmera/localização/push no
  device (o WhatsApp é server-side via WAHA), então não há strings de permissão a
  declarar. `ITSAppUsesNonExemptEncryption: false` já está em `app.json` (usa só
  HTTPS padrão), o que dispensa a pergunta de conformidade de exportação a cada envio.
