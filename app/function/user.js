const {VK} = require('vk-io'),
      config = require('../../config');

const vk = new VK({
    token: 'f7e4e634d396e45c9b6780cfcf0bd2724191066c27b030c0ca004a226842d3801c71cfb5f3503a2a46046',
  });


module.exports = {
  /*Проверка юзера на подписку*/
  isMember: async function(userID) {
    const isMember = await vk.api.groups.isMember({
      group_id: config.id.groupId,
      user_id: userID
    });
    return isMember;
  },

}
