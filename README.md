# Polaris Pro Clean · Client Portal

Portal do cliente da Polaris. O cliente entra com e-mail e senha e vê:

- visitas feitas e agendadas
- fotos de **antes e depois** (com comparação deslizante, por cômodo)
- o que foi feito em cada visita, horário de chegada/saída e recado da equipe
- faturas, saldo e botão de pagamento (via Jobber)
- os próprios dados

E a cada visita concluída no **Jobber**, o cliente recebe automaticamente um **e-mail** com o resumo e as fotos.

**Tecnologia:** Next.js (site) · Supabase (login, banco de dados, fotos) · Jobber API (dados das visitas) · Resend (e-mails) · Vercel (hospedagem).

---

## Rodar no computador (modo demonstração)

Sem configurar nada, o portal roda com dados de exemplo:

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — login: `demo@polaris.example` / `demo1234`.

---

## Colocar no ar — passo a passo

### 1. Supabase (banco de dados e login) — grátis
1. Crie uma conta em https://supabase.com → **New project** (região: East US).
2. Vá em **SQL Editor** → cole todo o conteúdo de `supabase/schema.sql` → **Run**.
3. Em **Authentication → URL Configuration**:
   - Site URL: `https://portal.polarisproclean.com`
   - Redirect URLs: `https://portal.polarisproclean.com/auth/callback`
4. Em **Authentication → Emails**, personalize o e-mail de convite ("Invite user") com o nome Polaris.
5. Em **Project Settings → API**, copie: Project URL, `anon` key e `service_role` key.

### 2. Jobber (app de desenvolvedor) — grátis
1. Crie uma conta em https://developer.getjobber.com e clique em **Create App**.
2. **OAuth Callback URL:** `https://portal.polarisproclean.com/api/jobber/callback`
3. **Scopes:** leitura de clientes, visitas/jobs, notas/anexos e faturas (read_clients, read_jobs, read_invoices, etc.).
4. **Webhooks:** adicione `VISIT_COMPLETE`, `VISIT_CREATE` e `VISIT_UPDATE` apontando para
   `https://portal.polarisproclean.com/api/jobber/webhook`
5. Copie o **Client ID** e o **Client Secret**.
6. ⚠️ Abra o **GraphiQL** do app e teste a consulta `VISIT_QUERY` de `src/lib/jobber.ts`. Os nomes dos campos do Jobber mudam de versão para versão; ajuste o que estiver diferente.

### 3. Resend (e-mails) — grátis até ~3.000/mês
1. Conta em https://resend.com → **Domains → Add domain** → seu domínio.
2. O Resend mostra alguns registros DNS: adicione-os no **Namecheap** (Domain List → Manage → Advanced DNS).
3. Crie uma **API key**.

### 4. Vercel (hospedagem) — grátis
1. Suba este projeto para um repositório no **GitHub**.
2. Em https://vercel.com → **Add New → Project** → escolha o repositório.
3. Em **Environment Variables**, preencha tudo que está em `.env.example`.
4. **Deploy**.
5. Em **Settings → Domains**, adicione `portal.polarisproclean.com`.
   No **Namecheap → Advanced DNS**, crie: `CNAME` · host `portal` · valor `cname.vercel-dns.com`.

### 5. Ligar o Jobber
Abra uma vez (logado no Jobber): `https://portal.polarisproclean.com/api/jobber/connect?key=SEU_ADMIN_SECRET` → **Allow**.
Pronto: a partir daí cada visita concluída sincroniza sozinha.

### 6. Botão "Client Login" no site (WordPress no HostGator)
O site polarisproclean.com é WordPress com Elementor. Para pôr o botão no menu:
1. Entre no painel do WordPress (`polarisproclean.com/wp-admin`).
2. **Aparência → Menus** → **Links personalizados**: URL `https://portal.polarisproclean.com`, texto `Client Login` → **Adicionar ao menu** → **Salvar**.
   (Se o menu for editado pelo Elementor: **Templates → Theme Builder → Header** → edite o menu ou adicione um botão com o mesmo link.)
O site continua no HostGator; o portal fica no subdomínio `portal.polarisproclean.com`.

---

## Clientes com vários prédios e várias pessoas

- No Jobber, cadastre **a empresa como um cliente** (ex.: "Lakeshore Property Management") e **cada prédio como uma propriedade** (Property) desse cliente.
  Use o campo de endereço linha 2 para o nome do prédio se quiser (ex.: `2850 N Clark St` + `Clark Street Medical Building`).
- No portal, o cliente vê **todos os prédios** num lugar só e pode filtrar as visitas por prédio.
- O contato principal do Jobber recebe o convite automaticamente. Para dar acesso a **mais pessoas** (gerente, síndico, recepção),
  use **/admin → Add & invite**. Todas as pessoas com acesso recebem o e-mail de cada visita.

## Como a equipe usa no Jobber (padrão das fotos)

Para o portal saber o que é "antes" e "depois":

1. Na visita, no app do Jobber, adicione uma **nota** com o texto `Before - Kitchen` e anexe as fotos do antes da cozinha.
2. Depois da limpeza, outra nota `After - Kitchen` com as fotos do depois.
3. Repita por cômodo (`Before - Bathroom`, `After - Bathroom`…).
4. Qualquer outra nota (sem "Before/After") vira o **recado da equipe** para o cliente.
5. Os itens do serviço (line items) aparecem como **"What we did"**.
6. Ao marcar a visita como **concluída**, o e-mail sai automaticamente.

Cada cliente novo recebe um **convite por e-mail** para criar a senha na primeira visita sincronizada.

---

## Página da Polaris (administração)

Em `https://portal.polarisproclean.com/admin` (senha = `ADMIN_SECRET`) a Polaris vê:

- todos os clientes, quantos prédios cada um tem e as pessoas com acesso ao portal
- **adicionar mais pessoas** de uma empresa e enviar o convite
- se o e-mail da última visita foi enviado
- próxima visita e saldo de cada cliente
- botões para **enviar convite / link de senha** e **reenviar o e-mail da visita**
- **prévia do e-mail** exatamente como o cliente recebe
- se o Jobber está conectado

No modo demonstração a senha é `admin1234`.

## Personalizar

| O quê | Onde |
|---|---|
| Logo | `public/logo-white.png` (fundo escuro) e `public/logo.png` — já são os logos oficiais do site |
| Cores | Topo de `src/app/globals.css` (`--navy`, `--accent`…) |
| Nome, telefone, e-mail | `src/lib/config.ts` (`brand`) |
| Texto do e-mail | `src/lib/email.ts` |
| Fuso horário | variável `NEXT_PUBLIC_TIMEZONE` (padrão `America/Chicago`) |

## Re-sincronizar uma visita manualmente

```bash
curl -X POST https://portal.polarisproclean.com/api/jobber/sync \
  -H "Authorization: Bearer SEU_ADMIN_SECRET" -H "Content-Type: application/json" \
  -d '{"visitId":"ID_DA_VISITA_NO_JOBBER","sendEmail":false}'
```

## Segurança
- Cada cliente só enxerga os próprios dados (Row Level Security no Supabase).
- Fotos ficam em armazenamento privado, com links temporários.
- Webhooks do Jobber são verificados por assinatura (HMAC).
- Nunca coloque as chaves (`SERVICE_ROLE`, `JOBBER_CLIENT_SECRET`, `RESEND_API_KEY`) no código — só nas variáveis da Vercel.

## Visitas feitas pela equipe no portal

Aplique `supabase/migrations/202611250001_team_visits.sql` depois do schema base e antes de publicar a rota `/team`.
Crie uma conta separada de funcionário em Supabase Authentication. No SQL Editor, cadastre o usuário em `team_members`,
o prédio e seu cliente em `team_sites`, e o par usuário/prédio em `team_assignments`. Cada prédio recebe o checklist
padrão, que pode ser alterado na coluna `checklist`. A equipe entra pela mesma tela de login e só vê os prédios atribuídos.

A visita exige um par de fotos e permite até oito pares antes/depois. Aplique também a migração `202611250002_team_photo_pairs.sql` antes de publicar esta versão. As fotos são armazenadas no bucket privado,
e a localização de chegada, quando autorizada, fica no registro interno da equipe. O cliente só recebe o relatório
depois que a visita é finalizada. Configure `RESEND_API_KEY` e `EMAIL_FROM` para habilitar a notificação.
