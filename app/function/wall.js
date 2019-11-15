const {VK} = require('vk-io'),
      user = require('./user.js'),
      attach = require('../../lib/attachments'),
      config = require('../../config');

const vk = new VK({
        token: 'f7e4e634d396e45c9b6780cfcf0bd2724191066c27b030c0ca004a226842d3801c71cfb5f3503a2a46046',
      });

module.exports = {
  /*Получение поста*/
  getPost: async function() {
    const content = await vk.api.wall.get({
      owner_id: `-${config.id.groupId}`,
      filter: 'suggests'
    });
    return content;
  },

  wallPost: async function(...args) {
    let [message, attachments] = args;
    const content = await vk.api.wall.post({
      owner_id: `-${config.id.groupId}`,
      message: message,
      attachments: attachments,
      from_group: 1
    });
  },

  /*Получение поста по ID*/
  getPostById: async function(postId) {
    const content = await vk.api.wall.getById({
      posts: `-${config.id.groupId}_${postId}`
    });
    return content;
  },

  /*Удаление поста*/
  deletePost: async function(content) {
    const deletePost = await vk.api.wall.delete({
      owner_id: '-' + config.id.groupId,
      post_id: content.id
    });
    return deletePost;
  },

  /*Удаление комментария*/
  deleteComment: async function(content) {
    const deleteComment = await vk.api.wall.deleteComment({
      owner_id: '-' + config.id.groupId,
      comment_id: content.id
    });
    console.log(deleteComment);
    return deleteComment;
  },

  /*Обработка поста*/
  suggests: async function(content) {
    if (content.post_type == 'suggest') {
      let deletePostFlag = await this.checkTextSpam(content);
      if (deletePostFlag == 0) {
        this.suggestsPost(content);
      }
    }
  },

  /*Анти-спам система. (писалась на скорую руку, через год переделаю)*/
  checkTextSpam: async function(content) {
    let text = 0,
        textFromCommentFlag = 0,
        spamPoint = 0,
        textFromContentFlag = 0;
    //если на проверку попал комментарий, то проверяем его, иначе проверяем пост.
    if (content.type === 'wall_reply_new') {
      text = content.text;
      textFromCommentFlag = 1;
      //Является ли юзер подписчиком
      let userID = content.from_id
      if (userID > 0) {
        let isMember = user.isMember(userID);
        if (!isMember) {
          spamPoint = spamPoint + 1;
        }
      }
    } else {
      text = content.text;
      textFromContentFlag = 1;
    }
    let spamWords = {
      levelOne: [
          /заработок/i, /замужем/i,/Вакансия/i,
          /ЖМИТЕ ТЫК СЮДА|ЖМИТЕ СЮДА|ЖМИ СЮДА/i, /ЖДУ ВАС ТУТ|ЖДУ ТУТ/i,
          /есть ребёнок/i, /зарабатывать/i,
          /подработк. в интернете/i,/Требуются девушки/i,
          /требуются сотрудники/i, /желание зарабатывать/i,
          /Обучение бесплатно/i,
          /Даю работу/i, /Выплаты/i, /добавляйтесь в друзья/i,
          /на вашу карту|на вашу банковскую карту/i,
          /постоянную подработку|постоянная подработка/i,
          /График гибкий|График/i,  /изменяю мужу/i,
          /НЕ ЖДИТЕ 3 ГОДА/i, /МАТЕРИНСКИЙ КАПИТАЛ/i, /НАЧНИТЕ ЖИТЬ ЛУЧШЕ/i,
          /перестала что-либо испытывать|перестала испытывать/i,
          /должен быть отец/i, /РЕДКОЗЕМЕЛЬНЫЕ МЕТАЛЛЫ/i,
          /совмещение с декретом|совмещение с основной работой/i,
          /никaкиx нapекaний нeт|Teлeфoн paбoтaeт oтлично/i, /Пpoдaм iPhone/i,
          /СХЕМА ЗАРАБОТКА/i, /написани. курсовых|помощь при поступлении|студенчески. работ/i,
          /точная Копия/i
      ],
      levelTwo: [
        /http./i, /интернет. магазин./i,
        /Пo вceм вoпpocaм мoжнo пиcaть в лc|Пo вceм вoпpocaм пиcaть в лc|Пишите в ЛС/i,
        /пoлный oригинaльный комплeкт|oригинaльный комплeкт/i, /Oтпeчaтoк cкaниpуeт мoмeнтaльнo/i,
        /Советские радиодетали/i, /Хочешь заработать/i, /по доступным ценам/i, /ВЫГОДНЫЕ УСЛОВИЯ/i
      ],
      levelThree: [
        /Админ. пропусти/i, /развод/i
      ]
      };

    for (var i = 0; i < spamWords.levelOne.length; i++) {
      let result = 0;
      result = spamWords.levelOne[i].test(text);
      if (result) {
        spamPoint = spamPoint + 4;
      }
    }
    for (var i = 0; i < spamWords.levelTwo.length; i++) {
      let result = 0;
      result = spamWords.levelTwo[i].test(text);
      if (result) {
        spamPoint = spamPoint + 2;
      }
    }
    for (var i = 0; i < spamWords.levelThree.length; i++) {
      let result = 0;
      result = spamWords.levelThree[i].test(text);
      if (result) {
        spamPoint = spamPoint + 1;
      }
    }
    if (spamPoint > 7) {
      if (textFromCommentFlag) {
        let deleteComment = this.deleteComment(content);
        (deleteComment) ? console.log('Комментарий содержал спам и был удален.') : console.log('Не смог удалить комментарий');
      }else if (textFromContentFlag) {
        let deletePost = this.deletePost(content);
        (deletePost) ? console.log('Пост содержал спам и был удален.') : console.log('Не смог удалить пост');
        //Флаг, который дает понять, что пост был удален
        return 1;
      }else {
        console.log('Критическая ошибка');
      }
    } else {
      //Флаг, который дает понять, что пост не был удален
      return 0;
    }
  },

  /*Опубликование поста + проверка на анон*/
  suggestsPost: async function(content) {
    let from_groupFlag = 1,
        signedFlag = 0,
        pattern = /анон/ui,
        testText = content.text,
        exists = pattern.test(testText);

    if(!exists) {
      from_groupFlag = 0;
      signedFlag = 1;
    }

    let attachments = attach.attachPost(content);


    const suggestsPost = await vk.api.wall.post({
      owner_id: '-' + config.id.groupId,
      post_id: content.id,
      message: content.text,
      attachments: attachments,
      from_group: from_groupFlag,
      signed: signedFlag
    });
  }

}
