import { Menu } from "@grammyjs/menu";
import { resultMenu } from "./personalize";
import type { MyContext } from "./main";

export const game = new Menu<MyContext>("Игра", { onMenuOutdated: false });

// Проверка выигрыша
export function checkWinner(field: string[]): string | null {
  const winLines = [
    [0,1,2], [3,4,5], [6,7,8],    
    [0,3,6], [1,4,7], [2,5,8], 
    [0,4,8], [2,4,6]             
  ];
  
  for (const [a, b, c] of winLines) {
    if (field[a] !== '_' && field[a] === field[b] && field[a] === field[c]) {
      return field[a];
    }
  }
  return field.includes('_') ? null : 'draw';
}

// Вывод эмодзи
const getEmoji = (ctx: MyContext, cell: string) => 
  cell === "_" ? "⬜" : 
  cell === "X" ? (ctx.session as any).global_x_еmoji! : 
                 (ctx.session as any).global_o_еmoji!;

// Обработка клика
const handleCellClick = (cellId: number) => async (ctx: MyContext) => {
  const field = [...ctx.session.field!];
  
  if (field[cellId] !== "_") {
    return ctx.answerCallbackQuery("Занято!");
  }
  
  field[cellId] = ctx.session.userChoice!;
  ctx.session.field = field;
  
  await ctx.answerCallbackQuery();
  
  let winner = checkWinner(field);
  if (winner) {
    await ctx.editMessageText(
      winner === 'draw' ? "Ничья!" : `Победа игрока (${winner})!`,
      { reply_markup: resultMenu }
    );
    return;
  }
  
  // Ход бота только если есть пустые клетки
  const emptyCells = field.map((cell, i) => cell === "_" ? i : -1).filter(i => i !== -1);
  if (emptyCells.length) {
    const rand = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    field[rand] = ctx.session.botChoice!;
    ctx.session.field = field;
    
    winner = checkWinner(field);
    if (winner) {
      await ctx.editMessageText(
        winner === 'draw' ? "Ничья!" : `Победа бота (${winner})!`,
        { reply_markup: resultMenu }
      );
      return;
    }
  }
  
  ctx.menu!.update();
};

// Создание поля
for (let row = 0; row < 3; row++) {
  game.row();
  for (let col = 0; col < 3; col++) {
    const cellId = row * 3 + col;
    game.text(
      (ctx) => getEmoji(ctx, ctx.session.field![cellId]), 
      handleCellClick(cellId)
    );
  }
}

// Инициализация игры
const initGame = async (ctx: MyContext, userChoice: string) => {
  ctx.session.userChoice = userChoice;
  ctx.session.botChoice = userChoice === "X" ? "O" : "X";
  ctx.session.field = Array(9).fill("_");
  
  await ctx.answerCallbackQuery();
  
  if (userChoice === "X") {
    const emoji = (ctx.session as any).global_x_еmoji!;
    await ctx.editMessageText(`Твой выбор ${userChoice}: ${emoji}`);
  } else {
    const field = [...ctx.session.field];
    const emptyCells = field.map((cell, i) => cell === "_" ? i : -1).filter(i => i !== -1);
    const rand = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    field[rand] = ctx.session.botChoice!;
    ctx.session.field = field;
    
    const emoji = (ctx.session as any).global_o_еmoji!;
    await ctx.editMessageText(`Твой выбор ${userChoice}: ${emoji}`);
  }
  
  ctx.menu!.nav("Игра");
};


export const choiceMenu = new Menu<MyContext>("choice", { onMenuOutdated: false })
  .row()
  .text("X", async (ctx) => initGame(ctx, "X"))
  .text("O", async (ctx) => initGame(ctx, "O"));
