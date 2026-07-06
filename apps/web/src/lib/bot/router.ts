import { getAccounts, getCards, getCategories } from "@/lib/data";
import {
  addDaysISO,
  createInstallmentPurchase,
  formatBalances,
  formatBRL,
  formatInvoices,
  formatPendingBills,
  getAccountsWithBalances,
  getInvoice,
  HELP_MESSAGE,
  invoiceCycleForDate,
  type LlmIntent,
  matchByName,
  parseFixedCommand,
  todayISO,
} from "@meusaldo/core";
import { type CreditCard, type Db, schema } from "@meusaldo/db";
import { and, eq, ilike, isNotNull, lte, asc } from "drizzle-orm";
import { extractIntent } from "./ollama";

export interface BotContext {
  userId: string;
  familyId: string;
}

/** Processa uma mensagem recebida e devolve o texto de resposta. */
export async function handleBotMessage(db: Db, ctx: BotContext, text: string): Promise<string> {
  const today = todayISO();
  const cmd = parseFixedCommand(text);

  if (cmd) {
    switch (cmd.kind) {
      case "ajuda":
        return HELP_MESSAGE;
      case "saldo":
        return formatBalances(await getAccountsWithBalances(db, ctx.familyId));
      case "fatura": {
        const cards = await getCards(ctx.familyId);
        const invoices = await Promise.all(
          cards.map(async (card) => {
            const invoice = await getInvoice(db, card, invoiceCycleForDate(card.closingDay, today));
            return {
              cardName: card.name,
              totalCents: invoice.totalCents,
              dueDate: invoice.dueDate,
              cycle: invoice.cycle,
            };
          }),
        );
        return formatInvoices(invoices);
      }
      case "contas": {
        const bills = await db
          .select()
          .from(schema.transactions)
          .where(
            and(
              eq(schema.transactions.familyId, ctx.familyId),
              eq(schema.transactions.status, "pending"),
              isNotNull(schema.transactions.dueDate),
              lte(schema.transactions.dueDate, addDaysISO(today, 30)),
            ),
          )
          .orderBy(asc(schema.transactions.dueDate))
          .limit(15);
        return formatPendingBills(bills, today);
      }
      case "paguei":
        return handlePaguei(db, ctx, cmd.term, today);
    }
  }

  return handleNaturalLanguage(db, ctx, text, today);
}

async function handlePaguei(db: Db, ctx: BotContext, term: string, today: string) {
  const matches = await db
    .select()
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.familyId, ctx.familyId),
        eq(schema.transactions.status, "pending"),
        isNotNull(schema.transactions.accountId),
        ilike(schema.transactions.description, `%${term}%`),
      ),
    )
    .orderBy(asc(schema.transactions.dueDate))
    .limit(5);

  if (matches.length === 0) {
    return `Não encontrei conta pendente parecida com "${term}". Mande *contas* para ver a lista.`;
  }
  // descrições idênticas (ex: recorrência mensal): paga a de vencimento mais antigo
  const sameDescription = matches.every(
    (t) => t.description.toLowerCase() === matches[0]!.description.toLowerCase(),
  );
  if (matches.length > 1 && !sameDescription) {
    const lines = matches.map(
      (t) => `• ${t.description} — ${formatBRL(t.amountCents)}${t.dueDate ? ` (vence ${t.dueDate.split("-").reverse().join("/")})` : ""}`,
    );
    return [
      `Achei ${matches.length} pendências com "${term}":`,
      ...lines,
      "",
      "Seja mais específico (ex: *paguei aluguel julho*).",
    ].join("\n");
  }

  const txn = matches[0]!; // ordenado por vencimento: a mais antiga primeiro
  await db
    .update(schema.transactions)
    .set({ status: "paid", date: today, updatedAt: new Date() })
    .where(eq(schema.transactions.id, txn.id));
  const dueInfo = txn.dueDate ? ` (vencia ${txn.dueDate.split("-").reverse().join("/")})` : "";
  return `✅ Marquei como paga: *${txn.description}* — ${formatBRL(txn.amountCents)}${dueInfo}`;
}

async function handleNaturalLanguage(db: Db, ctx: BotContext, text: string, today: string) {
  const [accounts, cards, categories] = await Promise.all([
    getAccounts(ctx.familyId),
    getCards(ctx.familyId),
    getCategories(ctx.familyId),
  ]);

  const intent = await extractIntent(text, {
    accounts: accounts.map((a) => a.name),
    cards: cards.map((c) => c.name),
    categories: categories.map((c) => c.name),
    today,
  });
  if (!intent) return `Não entendi 🤔\n\n${HELP_MESSAGE}`;

  const amountCents = Math.round(intent.amount * 100);
  const category = intent.category
    ? (categories.find((c) => c.name.toLowerCase() === intent.category.toLowerCase()) ?? null)
    : null;

  if (intent.intent === "installment") {
    const card = pickCard(intent, cards);
    if (!card) {
      return cards.length === 0
        ? "Você não tem cartão cadastrado — parcelamento exige cartão de crédito."
        : `Não identifiquei o cartão. Diga o nome, ex.: "${intent.description} ${intent.amount} em ${intent.installments}x no ${cards[0]!.name}".`;
    }
    await createInstallmentPurchase(db, {
      familyId: ctx.familyId,
      card,
      description: intent.description,
      totalCents: amountCents,
      installments: intent.installments,
      purchaseDate: today,
      categoryId: category?.id ?? null,
      userId: ctx.userId,
    });
    const parcela = formatBRL(Math.ceil(amountCents / intent.installments));
    return `✅ Compra parcelada registrada: *${intent.description}* — ${formatBRL(amountCents)} em ${intent.installments}x de ~${parcela} no cartão ${card.name}.`;
  }

  // lançamento simples: decide origem (conta ou cartão)
  const hint = intent.source.toLowerCase();
  const wantsCard = /cart[aã]o|card|cr[eé]dito/.test(hint) || /no cart[aã]o/i.test(text);
  const card = wantsCard || intent.type === "expense" ? matchExact(cards, hint) : null;
  const account = matchExact(accounts, hint);

  let target: { kind: "account" | "card"; id: string; name: string } | null = null;
  if (account && (!card || !wantsCard)) target = { kind: "account", id: account.id, name: account.name };
  else if (card) target = { kind: "card", id: card.id, name: card.name };
  else {
    const fuzzyCard = wantsCard ? matchByName(cards, hint) : null;
    const fuzzyAcc = matchByName(accounts, hint);
    if (fuzzyCard) target = { kind: "card", id: fuzzyCard.id, name: fuzzyCard.name };
    else if (fuzzyAcc) target = { kind: "account", id: fuzzyAcc.id, name: fuzzyAcc.name };
  }
  if (!target) {
    const options = [...accounts.map((a) => a.name), ...cards.map((c) => c.name)].join(", ");
    return `Em qual conta/cartão? Tenho: ${options}. Ex.: "${text} no ${accounts[0]?.name ?? "..."}"`;
  }
  if (target.kind === "card" && intent.type === "income") {
    // estorno no cartão é raro; receita vai para conta
    return "Receitas entram numa conta (não em cartão). Diga em qual conta recebeu.";
  }

  await db.insert(schema.transactions).values({
    familyId: ctx.familyId,
    description: intent.description,
    amountCents,
    type: intent.type,
    // cartão fica pendente até a fatura; conta entra como pago
    status: target.kind === "card" ? "pending" : "paid",
    date: today,
    accountId: target.kind === "account" ? target.id : null,
    creditCardId: target.kind === "card" ? target.id : null,
    categoryId: category?.id ?? null,
    createdBy: ctx.userId,
  });

  const emoji = intent.type === "income" ? "💚" : "✅";
  const kind = intent.type === "income" ? "Receita" : "Despesa";
  const catInfo = category ? `, categoria ${category.name}` : "";
  return `${emoji} ${kind} lançada: *${intent.description}* — ${formatBRL(amountCents)} (${target.name}${catInfo})`;
}

function matchExact<T extends { name: string }>(items: T[], hint: string): T | null {
  if (!hint) return null;
  return items.find((i) => i.name.toLowerCase() === hint) ?? null;
}

function pickCard(intent: LlmIntent, cards: CreditCard[]): CreditCard | null {
  const hint = intent.source.toLowerCase();
  return matchExact(cards, hint) ?? matchByName(cards, intent.source);
}
