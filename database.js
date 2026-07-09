const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const dbUrl = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: dbUrl,
  ssl: true
});

// Idempotent table check and initialization
async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create tables in a transaction
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS dishes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        description TEXT,
        description_ar TEXT,
        price REAL NOT NULL,
        photo_url TEXT,
        is_available INTEGER DEFAULT 1,
        is_chef_special INTEGER DEFAULT 0,
        is_vegetarian INTEGER DEFAULT 0,
        stock_limit INTEGER DEFAULT -1,
        week_identifier TEXT DEFAULT 'current'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        delivery_type TEXT NOT NULL,
        address TEXT,
        payment_method TEXT NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        dish_id INTEGER REFERENCES dishes(id),
        quantity INTEGER NOT NULL,
        price REAL NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_name_ar TEXT NOT NULL,
        customer_region TEXT,
        customer_region_ar TEXT,
        rating INTEGER NOT NULL,
        comment TEXT,
        comment_ar TEXT,
        is_approved INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    await client.query('COMMIT');

    // Seed data checking (idempotent)
    // Check settings
    const adminCheck = await client.query("SELECT value FROM settings WHERE key = 'admin_password_hash'");
    if (adminCheck.rows.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('haylakitchen123', salt);
      await client.query("INSERT INTO settings (key, value) VALUES ('admin_password_hash', $1)", [hash]);
      await client.query("INSERT INTO settings (key, value) VALUES ('deadline_day', 'Tuesday')");
      await client.query("INSERT INTO settings (key, value) VALUES ('deadline_day_ar', 'الثلاثاء')");
      await client.query("INSERT INTO settings (key, value) VALUES ('deadline_time', '8:00 PM')");
      await client.query("INSERT INTO settings (key, value) VALUES ('deadline_time_ar', '٨:٠٠ مساءً')");
      await client.query("INSERT INTO settings (key, value) VALUES ('delivery_date', 'Friday')");
      await client.query("INSERT INTO settings (key, value) VALUES ('delivery_date_ar', 'الجمعة')");
      await client.query("INSERT INTO settings (key, value) VALUES ('whatsapp_number', '')");
    }

    // Check dishes
    const dishCheck = await client.query("SELECT COUNT(*) as count FROM dishes");
    if (parseInt(dishCheck.rows[0].count) === 0) {
      const insertDishSql = `
        INSERT INTO dishes (name, name_ar, description, description_ar, price, photo_url, is_available, is_chef_special, is_vegetarian, stock_limit, week_identifier)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
      await client.query(insertDishSql, [
        "Mom's Classic Musakaa",
        "مسقعة أمي الكلاسيكية",
        "Roasted eggplant layers with seasoned minced beef in a rich, slow-simmered tomato reduction.",
        "طبقات من الباذنجان المشوي مع اللحم المفروم المتبل في صلصة طماطم غنية مطبوخة ببطء.",
        180.0,
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCK91NN04A4yYof7MzZcuHT_474MpgZ_WV70GA_gRdOa2B8s9NYw-ggQ-ipvGddZdppybCAhQe-dOiOynpLfsT0gicdj8OR4igQUUTbBJCgDrsMdT_w0iUcaYxD3K6h2pjvPB8GuBrrdPDpbEz_TEnXKZe0JL3eprO8YpPYkkU_yShWNv6LbO5LcHp3n5lP_igbiHJi_x3O8XhiHnqqhOQkHWhyGU4_ued3OFuzdgfdWDzagYLD2MJ_uondiviYdCInmwAgsk_rmKd6",
        1,
        1,
        0,
        15,
        "current"
      ]);

      await client.query(insertDishSql, [
        "Traditional Koshary",
        "كشري تقليدي",
        "Our signature blend of grains, pulses, and crispy onions served with secret-recipe tomato 'Dacca'.",
        "مزيجنا المميز من الحبوب والبقوليات والبصل المقرمش يقدم مع دقة الطماطم السرية.",
        120.0,
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAQ7rUfm3A7vkuis7w52g8v-DSdn2dDfCaujYCLYulQdbbc_kXbBl7bSN5UsdX-R0U_48e_AIGcKyg6hqyoc7ibd_bWhHWR6288NnrbC7tIageGj9RK8QY88e4QxjcP3ZGtbdSNuShwcH3nREVtKEnRmFqAO1Gh_nDc0QaGde8Ur1dvovxYGg5T5YzI0OzmLubJNvBwysu3eH0nVgOhMVc68xXvZfqAHTn6y-5SUeVwOEBAI5uURqxrOOeH8R_-8GkrKBrw_9cpO4Pz",
        1,
        0,
        1,
        -1,
        "current"
      ]);

      await client.query(insertDishSql, [
        "Grandma's Mahshi",
        "محشي الجدة",
        "Hand-rolled grape leaves and stuffed seasonal vegetables with a fragrant herb and rice filling.",
        "ورق عنب ملفوف يدوياً وخضروات موسمية محشية بخلطة الأرز والأعشاب العطرة.",
        210.0,
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCFld-nLtlTOkDUJSmX9kpQBOCWnTXe_gIIsFvIdEP1w8ExLP4Aeepbc1E67uHQM1qVM62zYrPH-opkjFQO7cniXg5td-s1I-pGUO9VfROVM1CK-iGjS-lPVTjmKKdNZEmrWfElcPk-AQMgw33SFqUUSkzRB0g722gDRj-nsC3uHPP6nueBOlpbBpWVeSemudyawUakCMq1o9luFaiZieydwd3W89sFlt6VJXb0wf8OyceOxLVAv7wDndFnXJz2LEEM01VPIqa1H4dp",
        1,
        0,
        0,
        20,
        "current"
      ]);

      await client.query(insertDishSql, [
        "Okra & Lamb Tajin",
        "طاجن بامية باللحم الضأن",
        "Small okra pods and tender lamb chunks slow-cooked in a rich coriander-garlic tomato stew.",
        "قرون بامية صغيرة وقطع لحم ضأن طرية مطبوخة ببطء في طاجن فخاري مع الكزبرة والثوم وصلصة الطماطم الغنية.",
        290.0,
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAX3SYYkpNqMMxkav41QOLyK23DPVAtqlu38zPSJuvDPjpMJR_nPWFcMP_baDszOPQ3CAObMbNgQqx_ElXQdvSvh868C2QNljTYasxQceGXyhMt4sFEwuzTBOPH72rxeEO7J2C1nhaKV6pDtrujuUJcgawqAEvFNLqia_RFqW_os2sa8aJ-8iCm5BG7r-XVROgbqFRhDosNQ_Uoy3AFHO2gKFh2GtWwZBHzQM0qPzjVd0Zlp9TMW-KJ67TjQBNK9MGS4fqyB00lhhDC",
        1,
        0,
        0,
        10,
        "current"
      ]);

      await client.query(insertDishSql, [
        "Macarona Béchamel",
        "مكرونة بالبشاميل",
        "Comforting baked pasta layers with seasoned beef and a creamy, golden-browned béchamel crust.",
        "طبقات مكرونة فرن مريحة مع اللحم المفروم المتبل مغطاة بطبقة بشاميل كريمية ذهبية.",
        210.0,
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCd63osNy0RAX4aT1zgJdndAuS1qS29N8JlmHEMF7xRkLHkll2bviVJDeIcevQlYMgehxKARpBXds3TQTXmOUVH0Jvj6C7XlWFVbZiVFqK1D12aBvc2N5tFXCEUJOZ3gCFZdMEcX2SOfbNoVV_IecQXJBrtrHaLxnC0wdpTUIj6ld4zPQ_jxyoYsndkRwmH509kdNNx118YtToKzgC98D_uDcMQbOKaw4MxwmUCAE-IZmsDS5eLRm9ScNCmEL4tMQQflZv4UtD9RorK",
        1,
        0,
        0,
        12,
        "current"
      ]);
    }

    // Check reviews
    const reviewCheck = await client.query("SELECT COUNT(*) as count FROM reviews");
    if (parseInt(reviewCheck.rows[0].count) === 0) {
      const insertReviewSql = `
        INSERT INTO reviews (customer_name, customer_name_ar, customer_region, customer_region_ar, rating, comment, comment_ar, is_approved)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
      `;
      await client.query(insertReviewSql, [
        "Noura El-Sayed",
        "نورا السيد",
        "Maadi",
        "المعادي",
        5,
        "The Mahshi took me back to my childhood in Cairo. You can truly taste the effort and love in every single bite. Hayla is now our weekly family tradition.",
        "المحشي رجعني لأيام طفولتي في القاهرة. بجد تحس بالطعم والحب في كل قضمية. هيلا بقت طقس أسبوعي لعيلتنا."
      ]);

      await client.query(insertReviewSql, [
        "Ahmed Ramy",
        "أحمد رامي",
        "Zamalek",
        "الزمالك",
        5,
        "The Macarona Béchamel is absolutely perfect. The crust, the creaminess, the spices. 10/10!",
        "المكرونة بالبشاميل طالعة مظبوطة جداً. البشاميل كريمي والوش لونه دهبي يجنن. ١٠/١٠!"
      ]);

      await client.query(insertReviewSql, [
        "Yasmin Tarek",
        "ياسمين طارق",
        "Heliopolis",
        "مصر الجديدة",
        4,
        "Amazing homemade Koshary. Tastes super clean and the crispy onions are next level. Will order again next week.",
        "كشري بيتي روعة ونظيف جداً، والبصل المقرمش حكاية. هطلب تاني الأسبوع الجاي أكيد."
      ]);
    }

  } catch (err) {
    console.error('Error during database initialization:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Call database setup
if (dbUrl) {
  initDatabase().then(() => {
    console.log('Neon Postgres connection pool initialized and verified.');
  }).catch((err) => {
    console.error('Failed to initialize Neon database:', err);
  });
} else {
  console.warn('Warning: DATABASE_URL environment variable is missing.');
}

module.exports = pool;
