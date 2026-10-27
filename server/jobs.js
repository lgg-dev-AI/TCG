import { run, query } from './db.js';

// Tareas por lote (Jobs) en segundo plano
export function startBackgroundJobs() {
  console.log('⏳ Iniciando tareas por lote (Database Jobs) en segundo plano...');

  // 1. Limpieza de OTPs expirados (Cada 5 minutos)
  setInterval(async () => {
    try {
      const result = await run("DELETE FROM otps WHERE expires_at < DATETIME('now')");
      if (result.changes > 0) {
        console.log(`🧹 [Job - Limpieza] Se eliminaron ${result.changes} OTPs expirados de la base de datos.`);
      }
    } catch (err) {
      console.error('✖ Error en Job de limpieza de OTPs:', err);
    }
  }, 5 * 60 * 1000); // 5 minutos

  // 2. Simulación de actualizaciones de precios de mercado e inventarios (Cada 10 minutos)
  // Revisa si hay propuestas de recompra "ACEPTADA" para transferir al inventario automáticamente
  setInterval(async () => {
    try {
      // Por ejemplo, auto-aprobar solicitudes de recompra simuladas o actualizar stock si hay lotes
      const pendingBuybacks = await query("SELECT * FROM buyback_requests WHERE status = 'APROBADA'");
      for (const buyback of pendingBuybacks) {
        // Transferir los items aprobados al catálogo si no existen o actualizar stock
        const items = await query("SELECT * FROM buyback_items WHERE buyback_id = ?", [buyback.id]);
        for (const item of items) {
          // Intentar insertar en products o incrementar stock
          const existing = await query("SELECT * FROM products WHERE name = ? AND expansion = ?", [item.name, item.expansion]);
          if (existing.length > 0) {
            const prod = existing[0];
            await run("UPDATE products SET stock = stock + 1 WHERE id = ?", [prod.id]);
          } else {
            const prodId = 'prod_' + Math.random().toString(36).substring(2, 9);
            await run(
              `INSERT INTO products (id, name, price, category, image_url, description, stock, expansion, is_promo, card_condition, is_active)
               VALUES (?, ?, ?, 'Cartas Sueltas', '/images/placeholder.png', ?, 1, ?, 0, ?, 1)`,
              [prodId, item.name, item.market_price || 10, `Carta traída de recompra aprobada (${buyback.id})`, item.expansion, item.condition]
            );
          }
        }
        // Cambiar estatus de la recompra a 'PROCESADA' para no repetir
        await run("UPDATE buyback_requests SET status = 'PROCESADA' WHERE id = ?", [buyback.id]);
        console.log(`📦 [Job - Recompra] Procesados e incorporados los productos de la recompra ${buyback.id} al inventario.`);
      }
    } catch (err) {
      console.error('✖ Error en Job de integración de recompras:', err);
    }
  }, 10 * 60 * 1000); // 10 minutos

  // Log inicial de que los jobs están activos y funcionando
  console.log('✅ Todos los Jobs de Base de Datos y Tareas por Lote están activos.');
}
