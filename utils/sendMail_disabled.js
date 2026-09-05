// Disabled mail sender: replaces real sending in development/testing
const transporter = {
  sendMail: async (mailOptions) => {
    console.log('[MAILER][DISABLED] Skipping sendMail. To:', mailOptions && mailOptions.to, 'Subject:', mailOptions && mailOptions.subject);
    return { accepted: mailOptions && [mailOptions.to], messageId: 'disabled-mailer' };
  },
};

const sendMail = async ({ to, subject, html } = {}) => {
  console.log('[MAILER][DISABLED] Skipping sendMail. To:', to, 'Subject:', subject);
  return { accepted: to ? [to] : [], messageId: 'disabled-mailer' };
};

module.exports = sendMail;
module.exports.transporter = transporter;
