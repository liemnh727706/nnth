const router = require('express').Router();
const crypto = require('crypto');
const qs = require('querystring');
const { query } = require('../utils/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Helper: update enrollment after successful payment
const confirmEnrollmentPayment = async (enrollmentId, paymentId, adminId = null) => {
  await query(
    `UPDATE payments SET status = 'completed', paid_at = NOW(), confirmed_by = $1 WHERE id = $2`,
    [adminId, paymentId]
  );
  await query(
    `UPDATE enrollments SET status = 'confirmed', confirmed_at = NOW(), confirmed_by = $1 WHERE id = $2`,
    [adminId, enrollmentId]
  );
};

// POST /api/payments/stripe/create-intent
router.post('/stripe/create-intent', authenticate, async (req, res) => {
  const { enrollment_id } = req.body;

  const enroll = await query(
    `SELECT e.*, c.tuition_fee, c.name_vi, c.name_en FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.id = $1 AND e.student_id = $2`,
    [enrollment_id, req.user.id]
  );
  if (!enroll.rows[0]) return res.status(404).json({ error: 'Enrollment not found' });
  const enrollment = enroll.rows[0];

  const paymentIntent = await stripe.paymentIntents.create({
    amount: parseInt(enrollment.tuition_fee) * 100, // cents for USD or VND
    currency: 'vnd',
    metadata: { enrollment_id, student_id: req.user.id },
    description: `Học phí ${enrollment.name_vi}`,
  });

  const payment = await query(
    `INSERT INTO payments (enrollment_id, amount, currency, method, status, transaction_id)
     VALUES ($1, $2, 'VND', 'stripe', 'pending', $3) RETURNING id`,
    [enrollment_id, enrollment.tuition_fee, paymentIntent.id]
  );

  res.json({ clientSecret: paymentIntent.client_secret, payment_id: payment.rows[0].id });
});

// POST /api/payments/stripe/webhook
router.post('/stripe/webhook', require('express').raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).send('Webhook signature failed');
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const payment = await query(
      'SELECT * FROM payments WHERE transaction_id = $1',
      [pi.id]
    );
    if (payment.rows[0]) {
      await confirmEnrollmentPayment(payment.rows[0].enrollment_id, payment.rows[0].id);
    }
  }

  res.json({ received: true });
});

// POST /api/payments/vnpay/create
router.post('/vnpay/create', authenticate, async (req, res) => {
  const { enrollment_id } = req.body;
  const enroll = await query(
    'SELECT e.*, c.tuition_fee FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.id = $1 AND e.student_id = $2',
    [enrollment_id, req.user.id]
  );
  if (!enroll.rows[0]) return res.status(404).json({ error: 'Enrollment not found' });
  const enrollment = enroll.rows[0];

  const payment = await query(
    `INSERT INTO payments (enrollment_id, amount, currency, method, status)
     VALUES ($1, $2, 'VND', 'vnpay', 'pending') RETURNING id`,
    [enrollment_id, enrollment.tuition_fee]
  );

  const date = new Date();
  const createDate = date.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const orderId = `${payment.rows[0].id.slice(0, 8)}-${Date.now()}`;

  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_Amount: parseInt(enrollment.tuition_fee) * 100,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Hoc phi khoa hoc - ${enrollment_id}`,
    vnp_OrderType: 'billpayment',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
    vnp_IpAddr: req.ip,
    vnp_CreateDate: createDate,
  };

  const sorted = Object.keys(params).sort().reduce((obj, key) => {
    obj[key] = params[key];
    return obj;
  }, {});

  const signData = qs.stringify(sorted);
  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  sorted.vnp_SecureHash = signed;

  const paymentUrl = `${process.env.VNPAY_URL}?${qs.stringify(sorted)}`;

  await query('UPDATE payments SET transaction_id = $1 WHERE id = $2', [orderId, payment.rows[0].id]);

  res.json({ paymentUrl, payment_id: payment.rows[0].id });
});

// GET /api/payments/vnpay/return
router.get('/vnpay/return', async (req, res) => {
  const params = { ...req.query };
  const secureHash = params.vnp_SecureHash;
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sorted = Object.keys(params).sort().reduce((obj, key) => {
    obj[key] = params[key];
    return obj;
  }, {});

  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET);
  const signed = hmac.update(Buffer.from(qs.stringify(sorted), 'utf-8')).digest('hex');

  if (signed !== secureHash) {
    return res.redirect(`${process.env.CLIENT_URL}/payment/result?status=error&message=invalid_signature`);
  }

  if (params.vnp_ResponseCode === '00') {
    const payment = await query('SELECT * FROM payments WHERE transaction_id = $1', [params.vnp_TxnRef]);
    if (payment.rows[0]) {
      await confirmEnrollmentPayment(payment.rows[0].enrollment_id, payment.rows[0].id);
    }
    res.redirect(`${process.env.CLIENT_URL}/payment/result?status=success`);
  } else {
    res.redirect(`${process.env.CLIENT_URL}/payment/result?status=failed&code=${params.vnp_ResponseCode}`);
  }
});

// POST /api/payments/momo/create
router.post('/momo/create', authenticate, async (req, res) => {
  try {
    const { enrollment_id } = req.body;
    const enroll = await query(
      'SELECT e.*, c.tuition_fee, c.name_vi FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.id = $1 AND e.student_id = $2',
      [enrollment_id, req.user.id]
    );
    if (!enroll.rows[0]) return res.status(404).json({ error: 'Enrollment not found' });
    const enrollment = enroll.rows[0];

    const payment = await query(
      `INSERT INTO payments (enrollment_id, amount, currency, method, status) VALUES ($1, $2, 'VND', 'momo', 'pending') RETURNING id`,
      [enrollment_id, enrollment.tuition_fee]
    );
    const paymentId = payment.rows[0].id;

    const partnerCode  = process.env.MOMO_PARTNER_CODE;
    const accessKey    = process.env.MOMO_ACCESS_KEY;
    const secretKey    = process.env.MOMO_SECRET_KEY;
    const orderId      = `NNTH-${paymentId.slice(0, 8)}-${Date.now()}`;
    const orderInfo    = `Hoc phi: ${enrollment.name_vi}`;
    const redirectUrl  = `${process.env.CLIENT_URL}/payment/result`;
    const ipnUrl       = `${process.env.SERVER_URL}/api/payments/momo/ipn`;
    const amount       = String(enrollment.tuition_fee);
    const requestId    = orderId;
    const requestType  = 'payWithMethod';
    const extraData    = Buffer.from(JSON.stringify({ enrollment_id, payment_id: paymentId })).toString('base64');

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const body = {
      partnerCode, accessKey, requestId, amount, orderId, orderInfo,
      redirectUrl, ipnUrl, extraData, requestType, signature,
      lang: 'vi',
    };

    const momoRes = await fetch('https://payment.momo.vn/v2/gateway/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const momoData = await momoRes.json();

    if (momoData.resultCode !== 0) {
      return res.status(400).json({ error: momoData.message || 'MoMo error' });
    }

    await query('UPDATE payments SET transaction_id = $1 WHERE id = $2', [orderId, paymentId]);
    res.json({ paymentUrl: momoData.payUrl, payment_id: paymentId });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khởi tạo MoMo' });
  }
});

// POST /api/payments/momo/ipn - MoMo IPN callback
router.post('/momo/ipn', async (req, res) => {
  try {
    const { orderId, resultCode, signature, amount, extraData } = req.body;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const partnerCode = process.env.MOMO_PARTNER_CODE;

    // Verify signature
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${req.body.message}&orderId=${orderId}&orderInfo=${req.body.orderInfo}&orderType=${req.body.orderType}&partnerCode=${partnerCode}&payType=${req.body.payType}&requestId=${req.body.requestId}&responseTime=${req.body.responseTime}&resultCode=${resultCode}&transId=${req.body.transId}`;
    const expectedSig = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    if (signature !== expectedSig) return res.status(400).json({ message: 'invalid signature' });

    if (resultCode === 0) {
      const payment = await query('SELECT * FROM payments WHERE transaction_id = $1', [orderId]);
      if (payment.rows[0]) {
        await confirmEnrollmentPayment(payment.rows[0].enrollment_id, payment.rows[0].id);
      }
    }

    res.json({ message: 'OK' });
  } catch {
    res.status(500).json({ message: 'error' });
  }
});

// POST /api/payments/zalopay/create
router.post('/zalopay/create', authenticate, async (req, res) => {
  try {
    const { enrollment_id } = req.body;
    const enroll = await query(
      'SELECT e.*, c.tuition_fee, c.name_vi FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.id = $1 AND e.student_id = $2',
      [enrollment_id, req.user.id]
    );
    if (!enroll.rows[0]) return res.status(404).json({ error: 'Enrollment not found' });
    const enrollment = enroll.rows[0];

    const payment = await query(
      `INSERT INTO payments (enrollment_id, amount, currency, method, status) VALUES ($1, $2, 'VND', 'zalopay', 'pending') RETURNING id`,
      [enrollment_id, enrollment.tuition_fee]
    );
    const paymentId = payment.rows[0].id;

    const appId    = process.env.ZALOPAY_APP_ID;
    const key1     = process.env.ZALOPAY_KEY1;
    const appTime  = Date.now();
    const appTransId = `${new Date().toISOString().slice(0,10).replace(/-/g,'')}_${paymentId.slice(0,8)}`;
    const embedData = JSON.stringify({ enrollment_id, payment_id: paymentId, redirecturl: `${process.env.CLIENT_URL}/payment/result` });
    const items    = JSON.stringify([{ itemid: enrollment_id, itename: enrollment.name_vi, itemprice: enrollment.tuition_fee, itemquantity: 1 }]);
    const amount   = enrollment.tuition_fee;

    const hmacInput = `${appId}|${appTransId}|${req.user.email}|${amount}|${appTime}|${embedData}|${items}`;
    const mac = crypto.createHmac('sha256', key1).update(hmacInput).digest('hex');

    const body = new URLSearchParams({
      app_id: appId,
      app_trans_id: appTransId,
      app_user: req.user.email,
      app_time: appTime,
      amount,
      item: items,
      embed_data: embedData,
      description: `NNTH - Hoc phi ${enrollment.name_vi}`,
      bank_code: '',
      mac,
      callback_url: `${process.env.SERVER_URL}/api/payments/zalopay/callback`,
    });

    const zaloRes = await fetch('https://sb-openapi.zalopay.vn/v2/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const zaloData = await zaloRes.json();

    if (zaloData.return_code !== 1) {
      return res.status(400).json({ error: zaloData.return_message || 'ZaloPay error' });
    }

    await query('UPDATE payments SET transaction_id = $1 WHERE id = $2', [appTransId, paymentId]);
    res.json({ paymentUrl: zaloData.order_url, payment_id: paymentId });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khởi tạo ZaloPay' });
  }
});

// POST /api/payments/zalopay/callback - ZaloPay IPN
router.post('/zalopay/callback', async (req, res) => {
  try {
    const key2 = process.env.ZALOPAY_KEY2;
    const { data, mac } = req.body;

    const expectedMac = crypto.createHmac('sha256', key2).update(data).digest('hex');
    if (mac !== expectedMac) {
      return res.json({ return_code: -1, return_message: 'mac not equal' });
    }

    const dataJson = JSON.parse(data);
    if (dataJson.return_code === 1) {
      const payment = await query('SELECT * FROM payments WHERE transaction_id = $1', [dataJson.app_trans_id]);
      if (payment.rows[0]) {
        await confirmEnrollmentPayment(payment.rows[0].enrollment_id, payment.rows[0].id);
      }
    }

    res.json({ return_code: 1, return_message: 'success' });
  } catch {
    res.json({ return_code: 0, return_message: 'error' });
  }
});

// PATCH /api/payments/:id/admin-confirm - admin manual confirmation
router.patch('/:id/admin-confirm', authenticate, requireAdmin, async (req, res) => {
  const payment = await query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
  if (!payment.rows[0]) return res.status(404).json({ error: 'Payment not found' });

  await confirmEnrollmentPayment(payment.rows[0].enrollment_id, req.params.id, req.user.id);
  res.json({ message: 'Đã xác nhận thanh toán' });
});

// GET /api/payments - admin list
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const where = [];
  let pi = 1;

  if (status) { where.push(`p.status = $${pi++}`); params.push(status); }

  const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const result = await query(
    `SELECT p.*,
            u.first_name || ' ' || u.last_name AS student_name,
            u.email AS student_email,
            c.name_vi AS course_name, c.code AS course_code
     FROM payments p
     JOIN enrollments e ON e.id = p.enrollment_id
     JOIN users u ON u.id = e.student_id
     JOIN courses c ON c.id = e.course_id
     ${wc}
     ORDER BY p.created_at DESC
     LIMIT $${pi} OFFSET $${pi + 1}`,
    [...params, parseInt(limit), offset]
  );

  res.json({ data: result.rows });
});

module.exports = router;
