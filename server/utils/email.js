const nodemailer = require('nodemailer');

// 创建邮件传输器
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.163.com',
    port: process.env.EMAIL_PORT || '465',
    secure: (process.env.EMAIL_PORT === '465') || true,
    auth: {
      user: process.env.EMAIL_USER || '13779447487@163.com',
      pass: process.env.EMAIL_PASS || 'YOUR_EMAIL_PASSWORD',
    },
  });
};

// 发送重置密码邮件
const sendResetPasswordEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"anwei团队" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'anwei网站 - 重置密码',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0ea5e9; margin: 0; font-size: 28px;">anwei团队</h1>
              <p style="color: #64748b; margin: 10px 0 0 0;">找到本质，自己扩展，梦想巨大</p>
            </div>
            
            <h2 style="color: #1e293b; margin-bottom: 20px;">重置密码</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 25px;">
              您请求重置anwei网站的密码。请点击下面的按钮来设置新密码：
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background-color: #0ea5e9; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                重置密码
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">
              如果按钮无法点击，请复制以下链接到浏览器地址栏：
            </p>
            
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
              <p style="color: #475569; font-size: 14px; margin: 0; word-break: break-all;">
                ${resetUrl}
              </p>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                <strong>注意：</strong>此链接将在1小时后过期。如果您没有请求重置密码，请忽略此邮件。
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © 2024 anwei团队. 保留所有权利.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('重置密码邮件发送成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('发送重置密码邮件失败:', error);
    throw error;
  }
};

// 发送订单确认邮件
const sendOrderConfirmationEmail = async (email, orderData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"anwei团队" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'anwei网站 - 订单确认',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0ea5e9; margin: 0; font-size: 28px;">anwei团队</h1>
              <p style="color: #64748b; margin: 10px 0 0 0;">找到本质，自己扩展，梦想巨大</p>
            </div>
            
            <h2 style="color: #1e293b; margin-bottom: 20px;">订单确认</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 25px;">
              感谢您的购买！您的订单已确认，我们将尽快为您处理。
            </p>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #1e293b; margin: 0 0 15px 0;">订单详情</h3>
              <p style="color: #475569; margin: 5px 0;"><strong>订单号：</strong>${orderData.orderId}</p>
              <p style="color: #475569; margin: 5px 0;"><strong>产品：</strong>${orderData.productName}</p>
              <p style="color: #475569; margin: 5px 0;"><strong>价格：</strong>¥${orderData.price}</p>
              <p style="color: #475569; margin: 5px 0;"><strong>订单时间：</strong>${new Date(orderData.createdAt).toLocaleString()}</p>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                如有任何问题，请联系我们的客服团队。
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © 2024 anwei团队. 保留所有权利.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('订单确认邮件发送成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('发送订单确认邮件失败:', error);
    throw error;
  }
};

// 发送管理员通知邮件
const sendAdminNotificationEmail = async (subject, content) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"anwei网站系统" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `anwei网站 - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0ea5e9; margin: 0; font-size: 28px;">anwei网站</h1>
              <p style="color: #64748b; margin: 10px 0 0 0;">系统通知</p>
            </div>
            
            <h2 style="color: #1e293b; margin-bottom: 20px;">${subject}</h2>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              ${content}
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © 2024 anwei团队. 保留所有权利.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('管理员通知邮件发送成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('发送管理员通知邮件失败:', error);
    throw error;
  }
};

// 发送反馈回复通知邮件给用户
const sendFeedbackReplyNotification = async (email, feedbackSubject, replyContent) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"anwei团队" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'anwei网站 - 您的反馈有了回复',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0ea5e9; margin: 0; font-size: 28px;">anwei团队</h1>
              <p style="color: #64748b; margin: 10px 0 0 0;">找到本质，自己扩展，梦想巨大</p>
            </div>
            
            <h2 style="color: #1e293b; margin-bottom: 20px;">您的反馈有了回复</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 25px;">
              您好！您提交的关于 <strong>${feedbackSubject}</strong> 的反馈已经收到回复。请查看下面的回复内容：
            </p>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <p style="color: #475569; line-height: 1.6;">${replyContent.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 25px;">
              您可以通过登录我们的网站并访问 <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-feedback" style="color: #0ea5e9; text-decoration: none;">"我的反馈"</a> 页面查看完整的反馈历史。
            </p>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                如果您有任何其他问题，请随时联系我们的客服团队。
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © 2024 anwei团队. 保留所有权利.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('反馈回复通知邮件发送成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('发送反馈回复通知邮件失败:', error);
    throw error;
  }
};

module.exports = {
  sendResetPasswordEmail,
  sendOrderConfirmationEmail,
  sendAdminNotificationEmail,
  sendFeedbackReplyNotification
};