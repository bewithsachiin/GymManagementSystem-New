import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from '../src/routes/auth.routes.js';
import superAdminRoutes from '../src/routes/superAdmin.routes.js';
import branchRoutes from '../src/routes/branch.routes.js';
import adminUserRoutes from '../src/routes/admin.routes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/admin/branches', branchRoutes);
app.use('/api/admin/users', adminUserRoutes);

export default app;
