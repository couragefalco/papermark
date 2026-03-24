import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Check if the API Key matches (skip if INTERNAL_API_KEY not configured for self-hosted)
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (process.env.INTERNAL_API_KEY && token !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "GET") {
    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Missing id" });
    }

    const documentVersion = await prisma.documentVersion.findUnique({
      where: { id },
      select: { file: true, storageType: true, numPages: true },
    });

    if (!documentVersion) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.status(200).json(documentVersion);
  }

  if (req.method === "POST") {
    const { action, documentVersionId, documentId, numPages, versionNumber } =
      req.body;

    if (action === "markProcessed") {
      await prisma.documentVersion.update({
        where: { id: documentVersionId },
        data: { numPages, hasPages: true, isPrimary: true },
      });

      if (versionNumber) {
        await prisma.documentVersion.updateMany({
          where: {
            documentId,
            versionNumber: { not: versionNumber },
          },
          data: { isPrimary: false },
        });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
