const VkBot = require('node-vk-bot-api'),
      Markup = require('node-vk-bot-api/lib/markup'),
      {VK}  = require('vk-io'),
      Session = require('node-vk-bot-api/lib/session'),
      Stage = require('node-vk-bot-api/lib/stage'),
      Scene = require('node-vk-bot-api/lib/scene'),
      config = require('./config'),
      attach = require('./lib/attachments'),
      wall = require('./app/function/wall');

const bot = new VkBot({
        token: config.token.groupToken
      }),
      vk = new VK({
        token: config.token.accountToken
      });
      session = new Session();

const deletePost = new Scene('deletePost',
  (ctx) => {
    ctx.scene.next();
    ctx.reply('Введите ссылку на пост\n _________________\n Пример: https://vk.com/rodino?w=wall-162104528_24114');
  },
  async (ctx) => {
    ctx.session.link = ctx.message.text;
    let result = ctx.session.link.match(/\d{1,15}/g);
    if (result[0] == config.id.groupId) {
      let post = await wall.getPostById(result[1]);
      if (post[0].signer_id == ctx.message.from_id) {
        let deletePost = await wall.deletePost(post[0])
        if (deletePost) {
          ctx.scene.leave();
          ctx.reply(`Запись успешно удалена :D`, null, Markup
            .keyboard([
              [
                Markup.button('Меню', 'primary')
              ],
            ])
          .oneTime());
        } else {
          ctx.reply('Не смог удалить пост' , null, Markup
            .keyboard([
              [
                Markup.button('Меню', 'primary')
              ],
            ])
          .oneTime());
        }
      } else {
        ctx.scene.leave();
        ctx.reply(`Простите, но это не Ваш пост или он опубликован анонимно. :(`, null, Markup
          .keyboard([
            [
              Markup.button('Меню', 'primary')
            ],
          ])
        .oneTime());
      }
    } else {
      ctx.scene.leave();
      ctx.reply(`Простите, но этот пост не из нашей группы :(`, null, Markup
        .keyboard([
          [
            Markup.button('Меню', 'primary')
          ],
        ])
      .oneTime());
    }
  });
const newPost = new Scene('newPost',
  (ctx) => {
    ctx.scene.next();
    ctx.reply('Сформируйте свой пост и отправьте его.\n ВНИМАНИЕ!!! Вы не сможете удалить этот пост через команду, /удалить');
  },
  (ctx) => {
    ctx.session.text = ctx.message.text;
    ctx.session.attachments = attach.attachPost(ctx.message);
    ctx.scene.next();
    ctx.reply('Анонимно публикуем?\n да/нет', null, Markup
      .keyboard([
        [
          Markup.button('Да', 'positive'),
          Markup.button('Нет', 'primary')
        ],
      ])
    .oneTime());
  },
  async (ctx) => {
    ctx.session.anonFlag = ctx.message.text;
    ctx.session.userId = ctx.message.from_id;
    let anonFlag = /да/i;
    let result = anonFlag.test(ctx.session.anonFlag);
    if (result) {
      await wall.wallPost(ctx.session.text, ctx.session.attachments);
    }else {
      let text = ctx.session.text + '\n________________________\nАвтор поста: '+ 'https://vk.com/id' + ctx.session.userId;
      await wall.wallPost(text, ctx.session.attachments);
    }
    ctx.scene.leave();
    ctx.reply(`Запись опубликована:\n ${ctx.session.text}\n  `, null, Markup
      .keyboard([
        [
          Markup.button('Меню', 'primary')
        ],
      ])
    .oneTime());
  });

const stage = new Stage(deletePost, newPost);

bot.use(session.middleware());
bot.use(stage.middleware());

console.log('_______________________');

/*_________________________КОМАНДЫ________________________*/
bot.command(/(\/опубликовать)|^(опубликовать)/, (ctx) => {
  ctx.scene.enter('newPost');
});
bot.command(/^(прив)|^(здрав)|^(здоров)|^(здаров)/ui, (ctx) => {
  ctx.reply('Приветствую Вас')
});
bot.command(/^(\/меню)|^(меню)|^(начать)/i,(ctx) => {
  ctx.reply('Выберите интересующую вас категорию: '
    + '\n_____________________________________________________\n'
    + '\n/Объявления - доска объявлений Родинского района(работа,куплю/продам и тд.)\n',
    null, Markup
    .keyboard([
      [
        Markup.button('/объявления', 'primary'),
      ],
    ])
  .oneTime());
});
bot.command(/(\/объявления)|^(объявления)/, (ctx) => {
  ctx.reply('Раздел временно не работает.', null, Markup
    .keyboard([
      [
        Markup.button('Как опубликовать новость/объявление?', 'positive'),
      ],
      [
        Markup.button('Как удалить свою новость?', 'positive'),
      ],
      [
        Markup.button('Платное размещение рекламы', 'negative'),
      ],
      [
        Markup.button('/меню', 'primary'),
      ],
    ])
  .oneTime());
});
bot.command('Как опубликовать новость/объявление?', (ctx) => {
  ctx.reply('Свою новость вы сможете предложить в раздел "предложить новость" на главной странице В Родино [Подслушано].', null, Markup
    .keyboard([
      [
        Markup.button('/опубликовать', 'positive'),
      ],
      [
        Markup.button('/меню', 'primary'),
      ],
    ])
  .oneTime());
});
bot.command('Как удалить свою новость?', (ctx) => {
  ctx.reply('Свою новость вы сможете удалить, написав нашему боту: /удалить.', null, Markup
    .keyboard([
      [
        Markup.button('/удалить', 'negative'),
      ],
      [
        Markup.button('/меню', 'primary'),
      ],
    ])
  .oneTime());
});
bot.command('Платное размещение рекламы', (ctx) => {
  ctx.reply('Раздел временно не работает', null, Markup
    .keyboard([
      [
        Markup.button('/меню', 'primary'),
      ],
    ])
  .oneTime());
});
bot.command(/(\/удалить)|^(удалить)/, (ctx) => {
  ctx.scene.enter('deletePost');
});
/*_______________________END КОМАНДЫ______________________*/

/*_________________________СОБЫТИЯ________________________*/
bot.event('wall_reply_new', (ctx) => {
  wall.checkTextSpam(ctx.message);
});
bot.event('wall_post_new', (ctx) => {
  wall.suggests(ctx.message);
});
/*_______________________END СОБЫТИЯ______________________*/


bot.startPolling(() => {
  console.log('Bot started')
})
