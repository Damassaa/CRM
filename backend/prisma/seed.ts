import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/shared/utils/crypto';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Super Admin if not exists
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@crm.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123456';

  const existingSuperAdmin = await prisma.superAdmin.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await hashPassword(superAdminPassword);

    await prisma.superAdmin.create({
      data: {
        email: superAdminEmail,
        password: hashedPassword,
        name: 'Super Admin',
      },
    });

    console.log('✅ Super Admin created');
    console.log(`   Email: ${superAdminEmail}`);
    console.log(`   Password: ${superAdminPassword}`);
  } else {
    console.log('ℹ️  Super Admin already exists');
  }

  // Create a demo tenant (optional)
  if (process.env.CREATE_DEMO_TENANT === 'true') {
    const demoTenantEmail = 'demo@company.com';
    const existingTenant = await prisma.tenant.findUnique({
      where: { email: demoTenantEmail },
    });

    if (!existingTenant) {
      const tenant = await prisma.tenant.create({
        data: {
          companyName: 'Demo Company',
          email: demoTenantEmail,
          phone: '+55 62 99999-9999',
          status: 'ACTIVE',
          plan: 'PRO',
          maxUsers: 10,
          maxLeads: 5000,
          maxPipelines: 10,
          schemaName: `tenant_demo_${Date.now()}`,
        },
      });

      // Create admin user for demo tenant
      const demoAdminPassword = await hashPassword('demo123456');
      const demoAdmin = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: 'admin@demo.com',
          password: demoAdminPassword,
          name: 'Demo Admin',
          role: 'ADMIN',
          canCreateLeads: true,
          canEditLeads: true,
          canDeleteLeads: true,
          canMoveLeads: true,
          viewAllLeads: true,
        },
      });

      // Create demo user
      const demoUserPassword = await hashPassword('user123456');
      await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: 'user@demo.com',
          password: demoUserPassword,
          name: 'Demo User',
          role: 'USER',
          canCreateLeads: true,
          canEditLeads: true,
          canDeleteLeads: false,
          canMoveLeads: true,
          viewAllLeads: true,
        },
      });

      // Create default columns
      const columns = await prisma.column.createMany({
        data: [
          {
            tenantId: tenant.id,
            name: 'Novo Lead',
            color: '#3B82F6',
            icon: '📋',
            position: 0,
          },
          {
            tenantId: tenant.id,
            name: 'Contato Realizado',
            color: '#8B5CF6',
            icon: '📞',
            position: 1,
          },
          {
            tenantId: tenant.id,
            name: 'Proposta Enviada',
            color: '#EC4899',
            icon: '📄',
            position: 2,
          },
          {
            tenantId: tenant.id,
            name: 'Negociação',
            color: '#F59E0B',
            icon: '💬',
            position: 3,
          },
          {
            tenantId: tenant.id,
            name: 'Ganho',
            color: '#10B981',
            icon: '✅',
            position: 4,
            isWinColumn: true,
          },
          {
            tenantId: tenant.id,
            name: 'Perdido',
            color: '#EF4444',
            icon: '❌',
            position: 5,
            isLostColumn: true,
          },
        ],
      });

      // Get first column for demo leads
      const firstColumn = await prisma.column.findFirst({
        where: { tenantId: tenant.id },
        orderBy: { position: 'asc' },
      });

      if (firstColumn) {
        // Create some demo leads
        await prisma.lead.createMany({
          data: [
            {
              tenantId: tenant.id,
              name: 'João Silva',
              email: 'joao@example.com',
              phone: '(62) 99999-1111',
              company: 'Empresa ABC',
              position: 'Gerente de TI',
              estimatedValue: 5000,
              columnId: firstColumn.id,
              positionInColumn: 0,
              responsibleId: demoAdmin.id,
              tags: ['urgente', 'vip'],
              source: 'manual',
              createdBy: demoAdmin.id,
            },
            {
              tenantId: tenant.id,
              name: 'Maria Santos',
              email: 'maria@example.com',
              phone: '(62) 99999-2222',
              company: 'Tech Solutions',
              estimatedValue: 10000,
              columnId: firstColumn.id,
              positionInColumn: 1,
              responsibleId: demoAdmin.id,
              tags: ['follow-up'],
              source: 'manual',
              createdBy: demoAdmin.id,
            },
            {
              tenantId: tenant.id,
              name: 'Pedro Oliveira',
              email: 'pedro@example.com',
              phone: '(62) 99999-3333',
              company: 'StartupXYZ',
              estimatedValue: 7500,
              columnId: firstColumn.id,
              positionInColumn: 2,
              responsibleId: demoAdmin.id,
              source: 'manual',
              createdBy: demoAdmin.id,
            },
          ],
        });
      }

      console.log('✅ Demo tenant created');
      console.log(`   Company: ${tenant.companyName}`);
      console.log(`   Admin Email: admin@demo.com`);
      console.log(`   Admin Password: demo123456`);
      console.log(`   User Email: user@demo.com`);
      console.log(`   User Password: user123456`);
    } else {
      console.log('ℹ️  Demo tenant already exists');
    }
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
