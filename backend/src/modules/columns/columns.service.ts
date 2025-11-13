import prisma from '../../config/database';
import { NotFoundError, AuthorizationError, ValidationError } from '../../shared/errors/AppError';

interface CreateColumnData {
  name: string;
  color: string;
  icon?: string;
  position?: number;
  isWinColumn: boolean;
  isLostColumn: boolean;
}

interface UpdateColumnData {
  name?: string;
  color?: string;
  icon?: string;
  isWinColumn?: boolean;
  isLostColumn?: boolean;
}

export class ColumnService {
  async list(tenantId: string) {
    const columns = await prisma.column.findMany({
      where: { tenantId },
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: {
            leads: true,
          },
        },
      },
    });

    return columns;
  }

  async getById(id: string, tenantId: string) {
    const column = await prisma.column.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            leads: true,
          },
        },
      },
    });

    if (!column) {
      throw new NotFoundError('Column');
    }

    return column;
  }

  async create(tenantId: string, data: CreateColumnData, userId: string) {
    // Get the current max position
    const maxPositionColumn = await prisma.column.findFirst({
      where: { tenantId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = data.position ?? (maxPositionColumn ? maxPositionColumn.position + 1 : 0);

    const column = await prisma.column.create({
      data: {
        tenantId,
        name: data.name,
        color: data.color,
        icon: data.icon,
        position,
        isWinColumn: data.isWinColumn,
        isLostColumn: data.isLostColumn,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'CREATE',
        resource: 'column',
        resourceId: column.id,
        metadata: { columnName: column.name },
      },
    });

    return column;
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateColumnData,
    userId: string
  ) {
    const column = await prisma.column.findFirst({
      where: { id, tenantId },
    });

    if (!column) {
      throw new NotFoundError('Column');
    }

    const updatedColumn = await prisma.column.update({
      where: { id },
      data,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'UPDATE',
        resource: 'column',
        resourceId: column.id,
        metadata: { changes: data },
      },
    });

    return updatedColumn;
  }

  async delete(id: string, tenantId: string, userId: string) {
    const column = await prisma.column.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    if (!column) {
      throw new NotFoundError('Column');
    }

    // Check if column has leads
    if (column._count.leads > 0) {
      throw new ValidationError(
        `Cannot delete column with ${column._count.leads} leads. Please move or delete leads first.`
      );
    }

    await prisma.column.delete({
      where: { id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'DELETE',
        resource: 'column',
        resourceId: id,
        metadata: { columnName: column.name },
      },
    });
  }

  async reorder(tenantId: string, columnIds: string[], userId: string) {
    // Verify all columns belong to this tenant
    const columns = await prisma.column.findMany({
      where: {
        id: { in: columnIds },
        tenantId,
      },
    });

    if (columns.length !== columnIds.length) {
      throw new ValidationError('Some columns do not exist or do not belong to this tenant');
    }

    // Update positions in a transaction
    await prisma.$transaction(
      columnIds.map((columnId, index) =>
        prisma.column.update({
          where: { id: columnId },
          data: { position: index },
        })
      )
    );

    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'UPDATE',
        resource: 'column',
        metadata: { action: 'reorder', columnIds },
      },
    });
  }
}
