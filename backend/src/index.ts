import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;
export const prisma = new PrismaClient();

import clientRouter from './routes/clients';
import uploadRouter from './routes/upload';
import aiRouter from './routes/ai';
import dashboardRouter from './routes/dashboard';

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());

// Basic Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TaxPilot TS Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// APIs
app.use('/api/clients', clientRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/ai', aiRouter);
app.use('/api/dashboard', dashboardRouter);

// Live Endpoints for Analytics, Returns, and Audit
app.get('/api/returns/gst', async (req, res) => {
  const returns = await prisma.gSTSummary.findMany({
    orderBy: { createdAt: 'desc' },
    include: { client: true }
  });
  
  const mapped = returns.map(r => ({
    id: r.id,
    period: r.period,
    client: r.client?.name || 'Unknown',
    status: 'Ready to File',
    totalSales: r.totalSales,
    totalPurchases: r.totalPurchases,
    outputGST: r.outputGst,
    inputGST: r.inputGst,
    netPayable: r.netPayable,
    carryForward: r.carryForward
  }));
  res.json({ returns: mapped });
});

app.get('/api/returns/itr', (req, res) => res.json({ returns: [] }));
app.get('/api/returns/tds', (req, res) => res.json({ returns: [] }));

app.get('/api/audit-logs', async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: { client: true }
  });
  res.json({ logs });
});

app.get('/api/analytics', async (req, res) => {
  const summaries = await prisma.gSTSummary.findMany({ orderBy: { createdAt: 'asc' } });
  const totalSales = summaries.reduce((acc, s) => acc + s.totalSales, 0);
  const totalPurchases = summaries.reduce((acc, s) => acc + s.totalPurchases, 0);
  const totalGst = summaries.reduce((acc, s) => acc + s.outputGst, 0);
  const transactions = await prisma.invoice.count();
  
  res.json({
    insights: [
      { label: 'Total Sales', value: totalSales },
      { label: 'Total Purchases', value: totalPurchases },
      { label: 'Total GST', value: totalGst },
      { label: 'Transactions', value: transactions }
    ],
    trend: summaries.slice(-5).map(s => ({ month: s.period, sales: s.totalSales, gst: s.netPayable }))
  });
});

// Tax Calculator Endpoint
app.get('/api/tax-calculator', (req, res) => {
  const income = parseFloat(req.query.income as string) || 0;
  const regime = req.query.regime as string || 'new';
  
  let tax = 0;
  
  if (regime === 'new') {
    // Simplified 2024 New Regime Slabs
    if (income <= 300000) tax = 0;
    else if (income <= 600000) tax = (income - 300000) * 0.05;
    else if (income <= 900000) tax = 15000 + (income - 600000) * 0.10;
    else if (income <= 1200000) tax = 45000 + (income - 900000) * 0.15;
    else if (income <= 1500000) tax = 90000 + (income - 1200000) * 0.20;
    else tax = 150000 + (income - 1500000) * 0.30;
    
    // Rebate under 87A for new regime (income <= 7L is tax free)
    if (income <= 700000) tax = 0;
  } else {
    // Old Regime Slabs (Under 60 years)
    if (income <= 250000) tax = 0;
    else if (income <= 500000) tax = (income - 250000) * 0.05;
    else if (income <= 1000000) tax = 12500 + (income - 500000) * 0.20;
    else tax = 112500 + (income - 1000000) * 0.30;
    
    // Rebate 87A (income <= 5L tax free)
    if (income <= 500000) tax = 0;
  }
  
  const cess = tax * 0.04; // 4% Health and Education Cess
  const total = tax + cess;
  
  res.json({ income, regime, tax, surcharge: 0, cess, total_tax: total });
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
