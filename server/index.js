import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import buybackRoutes from './routes/buyback.js';
import catalogRoutes from './routes/catalog.js';
import { startBackgroundJobs } from './jobs.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Permitir Base64 grandes por ahora

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/buyback', buybackRoutes);
app.use('/api/catalog', catalogRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor PokéVault Backend corriendo en http://localhost:${PORT}`);
  // Iniciar tareas por lote
  startBackgroundJobs();
});
