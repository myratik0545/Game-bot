import { Bot, Context, session, SessionFlavor } from "grammy";
import type { MenuFlavor } from "@grammyjs/menu";
import { mainMenu, personalizeMenu, resultMenu } from "./personalize";
import { choiceMenu, game } from "./game";
import { storage } from "./database";

// const bot = new Bot<MyContext>(process.env.BOT_TOKEN!);

const bot = new Bot<MyContext>("7253411873:AAHbKjcfIOth8-mtq8GpAY_hoDDjwWXH-Uk");

export type MyContext = Context & SessionFlavor<SessionData> & MenuFlavor;

// Типизация сессии
interface SessionData {
  field: string[];
  userChoice: string;
  botChoice: string;
  currentMenuVersion: number;
  global_x_еmoji: string;
  global_o_еmoji: string;
  lastBotMessageId?: number;
}

// Сброс сессии
const initial = (): SessionData => ({
  field: Array(9).fill("_"),
  userChoice: "",
  botChoice: "",
  currentMenuVersion: 0,
  global_x_еmoji: "❌",
  global_o_еmoji: "⭕",
  lastBotMessageId: undefined,
});

bot.use(session({ initial, storage }));

mainMenu.register(choiceMenu);
mainMenu.register(personalizeMenu);
choiceMenu.register(game);
game.register(resultMenu);

bot.use(mainMenu);

// Отправка меню
async function sendMenu(ctx: MyContext, text: string) {
  const msg = await ctx.reply(text, { reply_markup: mainMenu });
  ctx.session.lastBotMessageId = msg.message_id;
}

// Очистка чата
async function cleanChat(ctx: MyContext) {
  try {
    if (ctx.message?.message_id) await ctx.deleteMessage();
  } catch {}
  if (!ctx.session.lastBotMessageId) return;
  try {
    await ctx.api.deleteMessage(Number(ctx.chat.id), ctx.session.lastBotMessageId);
  } catch {}
  ctx.session.lastBotMessageId = undefined;
}

bot.command("start", async (ctx) => {
  if (!ctx.from) return;

  if (!ctx.session.userChoice) {
    ctx.session.field = Array(9).fill("_");
    ctx.session.userChoice = "";
    ctx.session.botChoice = "";
  }

  try {
    if (ctx.message?.message_id) await ctx.deleteMessage();
  } catch {}

  try {
    if (ctx.session.lastBotMessageId) {
      await ctx.api.deleteMessage(Number(ctx.chat.id), ctx.session.lastBotMessageId);
    }
  } catch {}

  const userName = ctx.from.first_name || "Пользователь";
  await sendMenu(
    ctx,
    `Привет, ${userName}! 👋\nДобро пожаловать! 🎯\nX: ${ctx.session.global_x_еmoji} | O: ${ctx.session.global_o_еmoji}`
  );
});

bot.on("message:text", async (ctx) => {
  if (!ctx.message.text.startsWith("/start")) return;

  await cleanChat(ctx);
  await sendMenu(
    ctx,
    `Главное меню 🎯\nX: ${ctx.session.global_x_еmoji} | O: ${ctx.session.global_o_еmoji}`
  );
});

bot.catch((err: any) => {
  if (err.error?.description?.includes("message is not modified")) return;
  console.error("Ошибка:", err.error?.description || err);
});



bot.start();
