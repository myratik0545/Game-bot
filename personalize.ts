import { Menu } from "@grammyjs/menu";
import type { MyContext } from "./main";
import { choiceMenu } from "./game";


export let local_x_emoji = "❌";
export let local_o_emoji = "⭕";

const xEmojis = ["😀", "😂", "👑"];
const oEmojis = ["😢", "😴", "🤖"];


type SessionEmojiField = 'global_x_еmoji' | 'global_o_еmoji';

// Сохранение выбранного эмодзи
const personalizeHandler = (emoji: string, field: SessionEmojiField) => 
  async (ctx: MyContext) => {
    (ctx.session as any)[field] = emoji;
    await ctx.answerCallbackQuery();
    ctx.menu!.update();
  };

// Статус кнопки
const getStatus = (ctx: MyContext, field: SessionEmojiField, emoji: string) =>
  `${emoji} ${(ctx.session as any)[field] === emoji ? "🟢" : "⚪"}`;

// Переход в главное меню
const goToMainMenu = async (ctx: MyContext) => {
  const x = (ctx.session as any).global_x_еmoji ?? local_x_emoji;
  const o = (ctx.session as any).global_o_еmoji ?? local_o_emoji;
  
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `Главное меню 🎯\nX: ${x} | O: ${o}`, 
    { reply_markup: mainMenu }
  );
  ctx.menu!.nav("main-menu");
};



// Главное меню
export const mainMenu = new Menu<MyContext>("main-menu", { onMenuOutdated: false })
  .text("🎮 Начать игру", async (ctx) => {
    const x = (ctx.session as any).global_x_еmoji ?? local_x_emoji;
    const o = (ctx.session as any).global_o_еmoji ?? local_o_emoji;
    
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `Выбери X:${x} | O:${o}`, 
      { reply_markup: choiceMenu }
    );
    ctx.menu!.nav("choice");
  })
  .text("🎨 Персонализация", async (ctx) => {
    (ctx.session as any).global_x_еmoji ||= local_x_emoji;
    (ctx.session as any).global_o_еmoji ||= local_o_emoji;
    
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `🔧 Персонализация\nX:${(ctx.session as any).global_x_еmoji} | O:${(ctx.session as any).global_o_еmoji}`, 
      { reply_markup: personalizeMenu }
    );
    ctx.menu!.nav("personalize");
  });


export const personalizeMenu = new Menu<MyContext>("personalize", { onMenuOutdated: false });

// Автосоздание эмодзи
const emojiGroups = [
  [xEmojis, 'global_x_еmoji' as SessionEmojiField],
  [oEmojis, 'global_o_еmoji' as SessionEmojiField]
] as const;

for (const [emojis, field] of emojiGroups) {
  personalizeMenu.row();
  for (const emoji of emojis) {
    personalizeMenu.text(
      (ctx) => getStatus(ctx, field, emoji),
      personalizeHandler(emoji, field)
    );
  }
}

// Возврат в меню
personalizeMenu
  .row()
  .back("Назад ↩️", async (ctx) => {
    local_x_emoji = (ctx.session as any).global_x_еmoji!;
    local_o_emoji = (ctx.session as any).global_o_еmoji!;
    await goToMainMenu(ctx);
  });


export const resultMenu = new Menu<MyContext>("result", { onMenuOutdated: false })
  .text("🔄 Главное меню", goToMainMenu);
