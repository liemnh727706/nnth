const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendVerificationEmail = async (email, token, firstName) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Xác nhận tài khoản - NNTH HCMUAF',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0F172A; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 20px;">TRUNG TÂM NGOẠI NGỮ - TIN HỌC</h1>
          <p style="color: #94A3B8; margin: 4px 0 0;">Đại học Nông Lâm TP.HCM</p>
        </div>
        <div style="padding: 32px 24px;">
          <p>Xin chào <strong>${firstName}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấn vào nút bên dưới để xác nhận địa chỉ email:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${url}" style="background: #0369A1; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Xác nhận Email
            </a>
          </div>
          <p style="color: #64748B; font-size: 14px;">Link có hiệu lực trong 24 giờ. Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
        </div>
      </div>
    `,
  });
};

const sendEnrollmentConfirmation = async (email, studentName, courseName, courseCode) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Xác nhận ghi danh - ${courseCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0F172A; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 20px;">TRUNG TÂM NGOẠI NGỮ - TIN HỌC</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p>Xin chào <strong>${studentName}</strong>,</p>
          <p>Bạn đã ghi danh thành công vào khóa học:</p>
          <div style="background: #F1F5F9; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>${courseName}</strong> (${courseCode})
          </div>
          <p>Vui lòng đăng nhập để xem chi tiết lịch học và thông tin khóa học.</p>
        </div>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendEnrollmentConfirmation };
