import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar a SQLite (creará database.sqlite en la carpeta server si no existe)
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Configurar timeout y habilitar foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Inicializar Tablas
    db.serialize(() => {
      // 1. Usuarios
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'CUSTOMER',
        name TEXT DEFAULT '',
        last_name TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        street TEXT DEFAULT '',
        city TEXT DEFAULT '',
        state TEXT DEFAULT '',
        zip_code TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Agregar columnas individualmente si la tabla ya existía para migración transparente
      const cols = ['name', 'last_name', 'phone', 'street', 'city', 'state', 'zip_code'];
      cols.forEach(col => {
        db.run(`ALTER TABLE users ADD COLUMN ${col} TEXT DEFAULT ''`, (err) => {
          // Silenciosamente ignorar si la columna ya existe
        });
      });

      // 2. Códigos OTP para Login
      db.run(`CREATE TABLE IF NOT EXISTS otps (
        email TEXT PRIMARY KEY,
        code TEXT,
        expires_at DATETIME
      )`);

      // 3. Productos (Inventario)
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT,
        price REAL,
        category TEXT,
        image_url TEXT,
        description TEXT,
        stock INTEGER,
        expansion TEXT,
        is_promo BOOLEAN,
        region TEXT DEFAULT '',
        pulled_from TEXT DEFAULT '',
        card_condition TEXT DEFAULT '',
        game_type TEXT DEFAULT 'POKEMON',
        gallery_images TEXT DEFAULT '[]',
        is_active BOOLEAN DEFAULT 1
      )`);

      // Agregar columnas adicionales a productos de forma tolerante si ya existía la tabla
      const productCols = [
        'region', 'pulled_from', 'card_condition', 'game_type', 'gallery_images', 
        'platform', 'completeness', 'is_tournament_staple', 'is_first_edition',
        'subcategory', 'market_price', 'market_price_low', 'market_price_high'
      ];
      productCols.forEach(col => {
        db.run(`ALTER TABLE products ADD COLUMN ${col} TEXT DEFAULT ''`, (err) => {
          // Silenciosamente ignorar si la columna ya existe
        });
      });
      // Asegurarnos que game_type tenga un default útil si ya existía la tabla pero no la columna (SQLite requiere default en alters o un update posterior, acá el alter ya lo incluye).
      db.run(`UPDATE products SET game_type = 'POKEMON' WHERE game_type = '' OR game_type IS NULL`);

      // 4. Órdenes
      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        total REAL,
        status TEXT,
        tracking_number TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      // Agregar tracking_number de forma transparente si la tabla de órdenes ya existe
      db.run(`ALTER TABLE orders ADD COLUMN tracking_number TEXT DEFAULT ''`, (err) => {
        // Silenciosamente ignorar si la columna ya existe
      });

      // 5. Detalles de la orden
      db.run(`CREATE TABLE IF NOT EXISTS order_items (
        order_id TEXT,
        product_id TEXT,
        quantity INTEGER,
        price_at_purchase REAL,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`);

      // 6. Favoritos de Usuario
      db.run(`CREATE TABLE IF NOT EXISTS user_favorites (
        user_id TEXT,
        product_id TEXT,
        PRIMARY KEY (user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      )`);

      // 7. Configuración de Tienda
      db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )`);

      // 8. Recompra (Buyback Requests)
      db.run(`CREATE TABLE IF NOT EXISTS buyback_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        customer_name TEXT DEFAULT '',
        customer_email TEXT DEFAULT '',
        customer_phone TEXT DEFAULT '',
        payout_method TEXT DEFAULT 'credit',
        total_value REAL DEFAULT 0,
        status TEXT DEFAULT 'PENDIENTE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      // 9. Recompra Items (Buyback Items)
      db.run(`CREATE TABLE IF NOT EXISTS buyback_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyback_id TEXT,
        name TEXT,
        expansion TEXT,
        condition TEXT,
        game_type TEXT DEFAULT 'POKEMON',
        market_price REAL,
        estimated_value REAL,
        FOREIGN KEY (buyback_id) REFERENCES buyback_requests (id) ON DELETE CASCADE
      )`);

      // 10. Auditoría de Administración (Admin Logs)
      db.run(`CREATE TABLE IF NOT EXISTS admin_logs (
        id TEXT PRIMARY KEY,
        admin_email TEXT,
        action TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // 11. Card Catalog (Catálogo Global Multi-TCG)
      db.run(`CREATE TABLE IF NOT EXISTS card_catalog (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        game_type TEXT NOT NULL,
        expansion TEXT,
        image_url TEXT,
        market_price REAL DEFAULT 0
      )`);

      // 12. Categorías y Subcategorías Dinámicas
      db.run(`CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        parent_id TEXT DEFAULT NULL,
        icon TEXT DEFAULT 'Package',
        color TEXT DEFAULT '#3b82f6',
        order_index INTEGER DEFAULT 0,
        is_content_bar INTEGER DEFAULT 1
      )`);
      db.run(`ALTER TABLE categories ADD COLUMN is_content_bar INTEGER DEFAULT 1`, () => {});

      // Seedar categorías iniciales si la tabla está vacía
      db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
        if (!err && row && row.count === 0) {
          const initialCategories = [
            // Principales
            { id: 'cat_tcg', name: 'Cartas & TCGs', slug: 'tcg', parent_id: null, icon: 'Sparkles', color: '#ffcb05', order_index: 1 },
            { id: 'cat_videogames', name: 'Videojuegos & Consolas', slug: 'videogames', parent_id: null, icon: 'Gamepad2', color: '#a855f7', order_index: 2 },
            { id: 'cat_accessories', name: 'Accesorios & Protección', slug: 'accessories', parent_id: null, icon: 'ShieldCheck', color: '#3b82f6', order_index: 3 },
            { id: 'cat_collectibles', name: 'Coleccionables & Figuras', slug: 'collectibles', parent_id: null, icon: 'Package', color: '#10b981', order_index: 4 },
            // Subcategorías TCG
            { id: 'sub_pokemon', name: 'Pokémon TCG', slug: 'pokemon', parent_id: 'cat_tcg', icon: 'Sparkles', color: '#ffcb05', order_index: 1 },
            { id: 'sub_magic', name: 'Magic: The Gathering', slug: 'magic', parent_id: 'cat_tcg', icon: 'Flame', color: '#f97316', order_index: 2 },
            { id: 'sub_yugioh', name: 'Yu-Gi-Oh!', slug: 'yugioh', parent_id: 'cat_tcg', icon: 'Swords', color: '#ef4444', order_index: 3 },
            { id: 'sub_onepiece', name: 'One Piece Card Game', slug: 'onepiece', parent_id: 'cat_tcg', icon: 'Ship', color: '#06b6d4', order_index: 4 },
            { id: 'sub_lorcana', name: 'Disney Lorcana', slug: 'lorcana', parent_id: 'cat_tcg', icon: 'Wand2', color: '#8b5cf6', order_index: 5 },
            // Subcategorías Videojuegos
            { id: 'sub_switch', name: 'Nintendo Switch', slug: 'switch', parent_id: 'cat_videogames', icon: 'Gamepad2', color: '#ef4444', order_index: 1 },
            { id: 'sub_playstation', name: 'PlayStation (PS5 / PS4)', slug: 'playstation', parent_id: 'cat_videogames', icon: 'Gamepad2', color: '#2563eb', order_index: 2 },
            { id: 'sub_xbox', name: 'Xbox Series & One', slug: 'xbox', parent_id: 'cat_videogames', icon: 'Gamepad2', color: '#16a34a', order_index: 3 },
            { id: 'sub_retro', name: 'Retro Gaming (N64, GBA, SNES)', slug: 'retro', parent_id: 'cat_videogames', icon: 'Gamepad2', color: '#f59e0b', order_index: 4 },
            // Subcategorías Accesorios
            { id: 'sub_sleeves', name: 'Micas Protectoras (Sleeves)', slug: 'sleeves', parent_id: 'cat_accessories', icon: 'ShieldCheck', color: '#3b82f6', order_index: 1 },
            { id: 'sub_binders', name: 'Carpetas & Portafolios (Binders)', slug: 'binders', parent_id: 'cat_accessories', icon: 'BookOpen', color: '#6366f1', order_index: 2 },
            { id: 'sub_toploaders', name: 'Toploaders & Cajas Acrílicas', slug: 'toploaders', parent_id: 'cat_accessories', icon: 'Box', color: '#14b8a6', order_index: 3 },
            { id: 'sub_playmats', name: 'Playmats & Tapetes Oficiales', slug: 'playmats', parent_id: 'cat_accessories', icon: 'Layers', color: '#ec4899', order_index: 4 }
          ];

          initialCategories.forEach(cat => {
            db.run(
              `INSERT OR IGNORE INTO categories (id, name, slug, parent_id, icon, color, order_index)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [cat.id, cat.name, cat.slug, cat.parent_id, cat.icon, cat.color, cat.order_index]
            );
          });
          console.log('🌱 Base de datos seedada con categorías y subcategorías iniciales.');
        }
      });

      // Seedar configuraciones de banco si está vacía
      db.get('SELECT COUNT(*) as count FROM settings', (err, row) => {
        if (!err && row && row.count === 0) {
          const defaultSettings = [
            { key: 'bank_name', value: 'BBVA' },
            { key: 'clabe', value: '012180012345678901' },
            { key: 'account_number', value: '1234567890' },
            { key: 'beneficiary', value: 'PokéVault México' },
            { key: 'whatsapp', value: '' }
          ];
          defaultSettings.forEach(s => {
            db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [s.key, s.value]);
          });
          console.log('🌱 Base de datos seedada con configuraciones bancarias.');
        }
      });

      // Insertar Admin por defecto si no existe
      db.run(`INSERT OR IGNORE INTO users (id, email, role) VALUES ('admin_001', 'admin@pokevault.com', 'ADMIN')`);

      // Seedar productos iniciales si la tabla está vacía (Desactivado por el administrador para catálogo limpio)
      /*
      db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
        if (!err && row && row.count === 0) {
          const mockProducts = [
            ...
          ];

          mockProducts.forEach(p => {
            db.run(
              `INSERT INTO products (id, name, price, category, image_url, description, stock, expansion, is_promo)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [p.id, p.name, p.price, p.category, p.image_url, p.description, p.stock, p.expansion, p.is_promo]
            );
          });
          console.log('🌱 Base de datos seedada con productos iniciales.');
        }
      });
      */
    });
  }
});

// Helpers para convertir callbacks de sqlite3 a Promesas (para usar async/await)
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};
export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

export const logAdminAction = (adminEmail, action, details) => {
  const logId = 'log_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  return run(
    'INSERT INTO admin_logs (id, admin_email, action, details) VALUES (?, ?, ?, ?)',
    [logId, adminEmail || 'system', action, details]
  );
};

// Exponer la instancia db por si necesitamos transacciones complejas
export default db;
