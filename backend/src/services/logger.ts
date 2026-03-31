import { prisma } from '../index';

export const logAudit = async (
  agentName: string,
  action: string,
  description: string,
  clientId?: string | null
) => {
  try {
    await prisma.auditLog.create({
      data: {
        agentName,
        action,
        description,
        clientId,
      }
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};
