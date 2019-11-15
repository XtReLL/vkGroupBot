module.exports = {
  attachPost:  function (content) {
    if (content.attachments == null) {
      return null;
    }
    const attachments = content.attachments
          .map((o) => `${o.type}${o[o.type].owner_id}_${o[o.type].id}`)
          .join(',');
    return attachments;
  }

}
