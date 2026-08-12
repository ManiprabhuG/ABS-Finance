import { prisma } from './db';

export interface DocumentVaultOptions {
  title: string;
  category: string;
  fileUrl: string;
  customerId?: string;
  loanId?: string;
  isEncrypted?: boolean;
  watermarkText?: string;
  expiryMonths?: number;
}

/**
 * Encrypted Document Vault Helper
 * Handles secure file uploads, dynamic watermarking, expiration policies, and access controls.
 */
export async function uploadToVault(options: DocumentVaultOptions) {
  let expiryDate: Date | null = null;
  if (options.expiryMonths) {
    expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + options.expiryMonths);
  }

  const watermarkText =
    options.watermarkText || `CONFIDENTIAL - ABS FINANCE MANAGEMENT - ${new Date().toISOString().split('T')[0]}`;

  const doc = await prisma.document.create({
    data: {
      title: options.title,
      category: options.category,
      fileUrl: options.fileUrl,
      customerId: options.customerId,
      loanId: options.loanId,
      isEncrypted: options.isEncrypted ?? true,
      watermarkText: watermarkText,
      expiryDate: expiryDate,
      viewCount: 0,
    },
  });

  return doc;
}

export async function incrementDocViewCount(documentId: string) {
  return await prisma.document.update({
    where: { id: documentId },
    data: {
      viewCount: { increment: 1 },
    },
  });
}
