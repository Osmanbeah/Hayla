const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const { put } = require('@vercel/blob');
const db = require('./database');
const translations = require('./translations');

const app = express();
const port = process.env.PORT || 3000;

// Setup EJS views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware for admin & language state
app.use(session({
  secret: 'hayla-kitchen-secret-key-1873291',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// Language preference and helpers middleware
app.use((req, res, next) => {
  if (!req.session.lang) {
    req.session.lang = 'ar'; // Main language is Arabic by default
  }
  
  // WhatsApp link formatter helper
  res.locals.getWhatsappLink = (phone, text = '') => {
    if (!phone) return '#';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('01') && cleaned.length === 11) {
      cleaned = '2' + cleaned;
    } else if (cleaned.startsWith('1') && cleaned.length === 10) {
      cleaned = '20' + cleaned;
    }
    const base = `https://wa.me/${cleaned}`;
    return text ? `${base}?text=${encodeURIComponent(text)}` : base;
  };
  
  next();
});

// Multer in-memory storage for Vercel Blob uploads
const upload = multer({ storage: multer.memoryStorage() });

// Helper to get settings asynchronously
async function getSettings() {
  const result = await db.query('SELECT key, value FROM settings');
  const settings = {};
  result.rows.forEach(row => {
    settings[row.key] = row.value;
  });
  return settings;
}

// ── TEMPORARY DIAGNOSTIC ROUTE ── remove after diagnosis ──────────────────────
app.get('/debug-encoding', async (req, res) => {
  try {
    const client = await db.connect();
    try {
      // 1. Server + client encoding settings
      const encRes = await client.query(`
        SELECT current_setting('server_encoding') AS server_encoding,
               current_setting('client_encoding') AS client_encoding
      `);

      // 2. Raw bytes of a settings value via encode()
      const settingsRes = await client.query(`
        SELECT key,
               value,
               encode(convert_to(value, 'UTF8'), 'hex') AS utf8_hex,
               encode(value::bytea, 'hex')              AS raw_pg_hex
        FROM settings
        WHERE key IN ('deadline_day_ar','delivery_date_ar','deadline_time_ar')
      `);

      // 3. Raw bytes of a dish arabic name
      const dishRes = await client.query(`
        SELECT id,
               name_ar,
               encode(convert_to(name_ar, 'UTF8'), 'hex') AS utf8_hex,
               encode(name_ar::bytea, 'hex')              AS raw_pg_hex
        FROM dishes
        LIMIT 2
      `);

      // 4. What Node receives — charCodes of each character
      const nodeView = settingsRes.rows.map(r => ({
        key: r.key,
        value: r.value,
        charCodes: [...r.value].map(c => c.codePointAt(0).toString(16)),
        utf8_hex: r.utf8_hex,
        raw_pg_hex: r.raw_pg_hex
      }));

      res.json({
        pg_encoding: encRes.rows[0],
        settings_raw: settingsRes.rows,
        dishes_raw: dishRes.rows,
        node_charCodes: nodeView
      });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});
// ── END TEMPORARY DIAGNOSTIC ROUTE ────────────────────────────────────────────

// Localization helpers
function localizeDish(dish, lang) {
  return {
    ...dish,
    name: lang === 'ar' ? dish.name_ar : dish.name,
    description: lang === 'ar' ? dish.description_ar : dish.description
  };
}

function localizeReview(review, lang) {
  return {
    ...review,
    customer_name: lang === 'ar' ? review.customer_name_ar : review.customer_name,
    customer_region: lang === 'ar' ? review.customer_region_ar : review.customer_region,
    comment: lang === 'ar' ? review.comment_ar : review.comment
  };
}

// Language switch route
app.get('/lang/:lang', (req, res) => {
  const chosen = req.params.lang;
  if (translations[chosen]) {
    req.session.lang = chosen;
  }
  const backURL = req.header('Referer') || '/';
  res.redirect(backURL);
});

// -------------------------------------------------------------
// PUBLIC ROUTES
// -------------------------------------------------------------

// Home page
app.get('/', async (req, res) => {
  try {
    const settings = await getSettings();
    const lang = req.session.lang;
    const t = translations[lang];

    const chefSpecialsRaw = await db.query('SELECT * FROM dishes WHERE is_available = 1 AND is_chef_special = 1 LIMIT 3');
    const chefSpecials = chefSpecialsRaw.rows.map(dish => localizeDish(dish, lang));

    const featuredReviewsRaw = await db.query('SELECT * FROM reviews WHERE is_approved = 1 ORDER BY id DESC LIMIT 3');
    const featuredReviews = featuredReviewsRaw.rows.map(rev => localizeReview(rev, lang));
    
    res.render('index', { settings, chefSpecials, featuredReviews, lang, t });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Menu page
app.get('/menu', async (req, res) => {
  try {
    const settings = await getSettings();
    const lang = req.session.lang;
    const t = translations[lang];

    const dishesRaw = await db.query("SELECT * FROM dishes WHERE week_identifier = 'current'");
    const dishes = dishesRaw.rows.map(dish => localizeDish(dish, lang));

    res.render('menu', { settings, dishes, lang, t });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// About page
app.get('/about', async (req, res) => {
  try {
    const settings = await getSettings();
    const lang = req.session.lang;
    const t = translations[lang];

    res.render('about', { settings, lang, t });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Reviews page
app.get('/reviews', async (req, res) => {
  try {
    const settings = await getSettings();
    const lang = req.session.lang;
    const t = translations[lang];

    const approvedReviewsRaw = await db.query('SELECT * FROM reviews WHERE is_approved = 1 ORDER BY id DESC');
    const approvedReviews = approvedReviewsRaw.rows.map(rev => localizeReview(rev, lang));
    
    const submitted = req.query.submitted === 'true';
    res.render('reviews', { settings, reviews: approvedReviews, submitted, lang, t });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Submit review
app.post('/reviews', async (req, res) => {
  try {
    const { customer_name, customer_region, rating, comment } = req.body;
    
    if (!customer_name || !rating) {
      return res.status(400).send('Name and rating are required.');
    }

    const insertSql = `
      INSERT INTO reviews (customer_name, customer_name_ar, customer_region, customer_region_ar, rating, comment, comment_ar, is_approved)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
    `;

    await db.query(insertSql, [
      customer_name,
      customer_name,
      customer_region || '',
      customer_region || '',
      parseInt(rating),
      comment || '',
      comment || ''
    ]);

    res.redirect('/reviews?submitted=true');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Contact page
app.get('/contact', async (req, res) => {
  try {
    const settings = await getSettings();
    const lang = req.session.lang;
    const t = translations[lang];

    res.render('contact', { settings, lang, t });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Checkout page
app.get('/checkout', async (req, res) => {
  try {
    const settings = await getSettings();
    const lang = req.session.lang;
    const t = translations[lang];

    res.render('checkout', { settings, lang, t });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Process Checkout
app.post('/checkout', async (req, res) => {
  const { customer_name, customer_phone, delivery_type, address, payment_method, cart_data } = req.body;
  const lang = req.session.lang;
  
  if (!customer_name || !customer_phone || !delivery_type || !payment_method || !cart_data) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  let cart = [];
  try {
    cart = JSON.parse(cart_data);
  } catch (err) {
    return res.status(400).json({ success: false, error: 'Invalid cart data.' });
  }

  if (cart.length === 0) {
    return res.status(400).json({ success: false, error: 'Cart is empty.' });
  }

  // Verification & Transaction scope
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    let totalAmount = 0;
    const itemsToInsert = [];

    for (const item of cart) {
      const dishResult = await client.query('SELECT * FROM dishes WHERE id = $1', [item.id]);
      const dish = dishResult.rows[0];

      if (!dish || dish.is_available === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: `Dish "${item.name}" is no longer available.` });
      }

      if (dish.stock_limit !== -1) {
        const orderCountResult = await client.query(`
          SELECT COALESCE(SUM(quantity), 0) as total FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.dish_id = $1 AND o.status != 'Cancelled'
        `, [item.id]);

        const orderedCount = parseInt(orderCountResult.rows[0].total);
        const remaining = dish.stock_limit - orderedCount;
        
        if (item.quantity > remaining) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            error: lang === 'ar' 
              ? `عذراً! المتبقي من "${dish.name_ar}" هو ${remaining} وجبة فقط.`
              : `Sorry! Only ${remaining} portions of "${dish.name}" are left to order.`
          });
        }
      }

      totalAmount += dish.price * item.quantity;
      itemsToInsert.push({
        dish_id: dish.id,
        quantity: item.quantity,
        price: dish.price
      });
    }

    const status = payment_method === 'cod' ? 'Cash on Delivery – Confirmed' : 'Pending Payment Confirmation';

    const insertOrderSql = `
      INSERT INTO orders (customer_name, customer_phone, delivery_type, address, payment_method, total_amount, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const orderResult = await client.query(insertOrderSql, [
      customer_name,
      customer_phone,
      delivery_type,
      delivery_type === 'delivery' ? address : '',
      payment_method,
      totalAmount,
      status
    ]);

    const orderId = orderResult.rows[0].id;

    const insertItemSql = `
      INSERT INTO order_items (order_id, dish_id, quantity, price)
      VALUES ($1, $2, $3, $4)
    `;

    for (const item of itemsToInsert) {
      await client.query(insertItemSql, [orderId, item.dish_id, item.quantity, item.price]);
    }

    await client.query('COMMIT');
    res.json({ success: true, orderId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, error: 'Checkout transaction failed.' });
  } finally {
    client.release();
  }
});

// Confirmation page
app.get('/confirmation', async (req, res) => {
  try {
    const settings = await getSettings();
    const lang = req.session.lang;
    const t = translations[lang];
    
    const orderId = req.query.orderId;
    if (!orderId) {
      return res.redirect('/');
    }

    const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderResult.rows[0];
    if (!order) {
      return res.redirect('/');
    }

    const itemsRaw = await db.query(`
      SELECT oi.*, d.name, d.name_ar FROM order_items oi
      JOIN dishes d ON oi.dish_id = d.id
      WHERE oi.order_id = $1
    `, [orderId]);

    const items = itemsRaw.rows.map(item => ({
      ...item,
      name: lang === 'ar' ? item.name_ar : item.name
    }));

    res.render('confirmation', { settings, order, items, lang, t });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// -------------------------------------------------------------
// ADMIN ROUTES
// -------------------------------------------------------------

// Middleware to check admin session
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

// Admin login page
app.get('/admin/login', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin');
  }
  const error = req.query.error === '1';
  res.render('admin/login', { error });
});

// Process admin login
app.post('/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    const hashObj = await db.query("SELECT value FROM settings WHERE key = 'admin_password_hash'");
    
    if (hashObj.rows[0] && bcrypt.compareSync(password, hashObj.rows[0].value)) {
      req.session.isAdmin = true;
      return res.redirect('/admin');
    }
    res.redirect('/admin/login?error=1');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/login?error=1');
  }
});

// Admin logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Admin dashboard + tabs
app.get('/admin', requireAdmin, async (req, res) => {
  try {
    const settings = await getSettings();
    
    // Stats queries
    const orderCountRes = await db.query("SELECT COUNT(*) as count FROM orders");
    const orderCount = orderCountRes.rows[0].count;

    const revenueRes = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'Cancelled'");
    const totalRevenue = revenueRes.rows[0].total;

    const mostOrderedRes = await db.query(`
      SELECT d.name, SUM(oi.quantity) as qty FROM order_items oi
      JOIN dishes d ON oi.dish_id = d.id
      GROUP BY d.name, oi.dish_id
      ORDER BY qty DESC
      LIMIT 1
    `);
    const mostOrdered = mostOrderedRes.rows[0];
    const topDish = mostOrdered ? `${mostOrdered.name} (${mostOrdered.qty} portions)` : 'N/A';

    // Tables data
    const dishesRes = await db.query('SELECT * FROM dishes ORDER BY id DESC');
    const dishes = dishesRes.rows;
    
    const ordersRes = await db.query('SELECT * FROM orders ORDER BY id DESC');
    const orders = ordersRes.rows;

    for (const order of orders) {
      const itemsRes = await db.query(`
        SELECT oi.*, d.name FROM order_items oi
        JOIN dishes d ON oi.dish_id = d.id
        WHERE oi.order_id = $1
      `, [order.id]);
      order.items = itemsRes.rows;
    }

    const reviewsRes = await db.query('SELECT * FROM reviews ORDER BY id DESC');
    const reviews = reviewsRes.rows;

    res.render('admin/dashboard', {
      settings,
      stats: { orderCount, totalRevenue, topDish },
      dishes,
      orders,
      reviews,
      success: req.query.success
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Admin view initialization error.');
  }
});

// Admin Update Settings
app.post('/admin/settings', requireAdmin, async (req, res) => {
  try {
    const { deadline_day, deadline_day_ar, deadline_time, deadline_time_ar, delivery_date, delivery_date_ar, whatsapp_number, new_password } = req.body;
    
    await db.query("INSERT INTO settings (key, value) VALUES ('deadline_day', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [deadline_day]);
    await db.query("INSERT INTO settings (key, value) VALUES ('deadline_day_ar', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [deadline_day_ar]);
    await db.query("INSERT INTO settings (key, value) VALUES ('deadline_time', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [deadline_time]);
    await db.query("INSERT INTO settings (key, value) VALUES ('deadline_time_ar', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [deadline_time_ar]);
    await db.query("INSERT INTO settings (key, value) VALUES ('delivery_date', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [delivery_date]);
    await db.query("INSERT INTO settings (key, value) VALUES ('delivery_date_ar', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [delivery_date_ar]);
    await db.query("INSERT INTO settings (key, value) VALUES ('whatsapp_number', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [whatsapp_number || '']);

    if (new_password && new_password.trim() !== '') {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(new_password.trim(), salt);
      await db.query("INSERT INTO settings (key, value) VALUES ('admin_password_hash', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [hash]);
    }

    res.redirect('/admin?success=settings');
  } catch (err) {
    console.error(err);
    res.status(500).send('Settings update failed.');
  }
});

// Admin Add Dish (Direct upload to Vercel Blob)
app.post('/admin/dishes/add', requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { name, name_ar, description, description_ar, price, is_available, is_chef_special, is_vegetarian, stock_limit } = req.body;
    
    let photo_url = 'https://images.unsplash.com/photo-1544025162-d76694265947';
    if (req.file) {
      const blob = await put(`dish-${Date.now()}-${req.file.originalname}`, req.file.buffer, {
        access: 'public'
      });
      photo_url = blob.url;
    }

    const insertSql = `
      INSERT INTO dishes (name, name_ar, description, description_ar, price, photo_url, is_available, is_chef_special, is_vegetarian, stock_limit, week_identifier)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'current')
    `;
    
    await db.query(insertSql, [
      name,
      name_ar,
      description || '',
      description_ar || '',
      parseFloat(price),
      photo_url,
      is_available ? 1 : 0,
      is_chef_special ? 1 : 0,
      is_vegetarian ? 1 : 0,
      stock_limit ? parseInt(stock_limit) : -1
    ]);

    res.redirect('/admin?success=dish_added');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to add dish.');
  }
});

// Admin Edit Dish
app.post('/admin/dishes/edit/:id', requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const id = req.params.id;
    const { name, name_ar, description, description_ar, price, is_available, is_chef_special, is_vegetarian, stock_limit } = req.body;
    
    let updateQuery = `
      UPDATE dishes 
      SET name = $1, name_ar = $2, description = $3, description_ar = $4, price = $5, is_available = $6, is_chef_special = $7, is_vegetarian = $8, stock_limit = $9
    `;
    const params = [
      name,
      name_ar,
      description || '',
      description_ar || '',
      parseFloat(price),
      is_available ? 1 : 0,
      is_chef_special ? 1 : 0,
      is_vegetarian ? 1 : 0,
      stock_limit ? parseInt(stock_limit) : -1
    ];

    if (req.file) {
      const blob = await put(`dish-${Date.now()}-${req.file.originalname}`, req.file.buffer, {
        access: 'public'
      });
      updateQuery += ', photo_url = $10';
      params.push(blob.url);
    }

    updateQuery += ` WHERE id = $${params.length + 1}`;
    params.push(id);

    await db.query(updateQuery, params);
    res.redirect('/admin?success=dish_edited');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to edit dish.');
  }
});

// Admin Delete Dish
app.post('/admin/dishes/delete/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM dishes WHERE id = $1', [req.params.id]);
    res.redirect('/admin?success=dish_deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete dish.');
  }
});

// Admin Update Order Status
app.post('/admin/orders/status/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.redirect('/admin?success=order_updated');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to update order status.');
  }
});

// Admin Delete Order
app.post('/admin/orders/delete/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM orders WHERE id = $1', [req.params.id]);
    res.redirect('/admin?success=order_deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete order.');
  }
});

// Admin Approve/Hide Review
app.post('/admin/reviews/toggle/:id', requireAdmin, async (req, res) => {
  try {
    const { is_approved } = req.body;
    await db.query('UPDATE reviews SET is_approved = $1 WHERE id = $2', [parseInt(is_approved), req.params.id]);
    res.redirect('/admin?success=review_updated');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to update review status.');
  }
});

// Admin Delete Review
app.post('/admin/reviews/delete/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.redirect('/admin?success=review_deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete review.');
  }
});

app.listen(port, () => {
  console.log(`Hayla Kitchen server running at http://localhost:${port}`);
});
