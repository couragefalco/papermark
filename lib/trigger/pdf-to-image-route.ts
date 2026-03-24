import { logger, task } from "@trigger.dev/sdk/v3";

import { getFile } from "@/lib/files/get-file";
import { updateStatus } from "@/lib/utils/generate-trigger-status";

type ConvertPdfToImagePayload = {
  documentId: string;
  documentVersionId: string;
  teamId: string;
  versionNumber?: number;
};

const baseUrl = () => process.env.NEXT_PUBLIC_BASE_URL;
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
});

export const convertPdfToImageRoute = task({
  id: "convert-pdf-to-image-route",
  run: async (payload: ConvertPdfToImagePayload) => {
    const { documentVersionId, teamId, documentId, versionNumber } = payload;

    updateStatus({ progress: 0, text: "Initializing..." });

    // 1. get file url from document version via internal API
    const dvResponse = await fetch(
      `${baseUrl()}/api/internal/document-version?id=${documentVersionId}`,
      { headers: authHeaders() },
    );

    if (!dvResponse.ok) {
      logger.error("Document version not found", { payload });
      updateStatus({ progress: 0, text: "Document not found" });
      return;
    }

    const documentVersion = (await dvResponse.json()) as {
      file: string;
      storageType: string;
      numPages: number | null;
    };

    logger.info("Document version", { documentVersion });
    updateStatus({ progress: 10, text: "Retrieving file..." });

    // 2. get signed url from file
    const signedUrl = await getFile({
      type: documentVersion.storageType,
      data: documentVersion.file,
    });

    logger.info("Retrieved signed url", { signedUrl });

    if (!signedUrl) {
      logger.error("Failed to get signed url", { payload });
      updateStatus({ progress: 0, text: "Failed to retrieve document" });
      return;
    }

    let numPages = documentVersion.numPages;

    // skip if the numPages are already defined
    if (!numPages || numPages === 1) {
      // 3. send file to api/convert endpoint in a task and get back number of pages
      logger.info("Sending file to api/get-pages endpoint");

      const response = await fetch(
        `${baseUrl()}/api/mupdf/get-pages`,
        {
          method: "POST",
          body: JSON.stringify({ url: signedUrl }),
          headers: authHeaders(),
        },
      );

      if (!response.ok) {
        logger.error("Failed to get number of pages", {
          signedUrl,
          response,
        });
        throw new Error("Failed to get number of pages");
      }

      const { numPages: numPagesResult } = (await response.json()) as {
        numPages: number;
      };

      logger.info("Received number of pages", { numPagesResult });

      if (numPagesResult < 1) {
        logger.error("Failed to get number of pages", { payload });
        updateStatus({ progress: 0, text: "Failed to get number of pages" });
        return;
      }

      numPages = numPagesResult;
    }

    updateStatus({ progress: 20, text: "Converting document..." });

    // 4. iterate through pages and upload to blob in a task
    let currentPage = 0;
    let conversionWithoutError = true;
    for (var i = 0; i < numPages; ++i) {
      if (!conversionWithoutError) {
        break;
      }

      // increment currentPage
      currentPage = i + 1;
      logger.info(`Converting page ${currentPage}`, {
        currentPage,
        numPages,
      });

      try {
        // send page number to api/convert-page endpoint in a task and get back page img url
        const response = await fetch(
          `${baseUrl()}/api/mupdf/convert-page`,
          {
            method: "POST",
            body: JSON.stringify({
              documentVersionId: documentVersionId,
              pageNumber: currentPage,
              url: signedUrl,
              teamId: teamId,
            }),
            headers: authHeaders(),
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // If document was blocked, stop processing entirely
          if (response.status === 400 && errorData.error?.includes("blocked")) {
            logger.error("Document blocked", {
              pageNumber: currentPage,
              matchedUrl: errorData.matchedUrl,
              matchedKeyword: errorData.matchedKeyword,
              payload,
            });

            updateStatus({
              progress: 0,
              text: `Document couldn't be processed`,
            });

            throw new Error("Document processing blocked");
          }

          throw new Error("Failed to convert page");
        }

        const { documentPageId } = (await response.json()) as {
          documentPageId: string;
        };

        logger.info(`Created document page for page ${currentPage}:`, {
          documentPageId,
          payload,
        });
      } catch (error: unknown) {
        conversionWithoutError = false;
        if (error instanceof Error) {
          logger.error("Failed to convert page", {
            error: error.message,
          });
        }
      }

      updateStatus({
        progress: (currentPage / numPages) * 100,
        text: `${currentPage} / ${numPages} pages processed`,
      });
    }

    if (!conversionWithoutError) {
      logger.error("Failed to process pages", { payload });
      updateStatus({
        progress: (currentPage / numPages) * 100,
        text: `Error processing page ${currentPage} of ${numPages}`,
      });
      return;
    }

    // 5. after all pages are uploaded, mark document version as processed via internal API
    const markResponse = await fetch(
      `${baseUrl()}/api/internal/document-version`,
      {
        method: "POST",
        body: JSON.stringify({
          action: "markProcessed",
          documentVersionId,
          documentId,
          numPages,
          versionNumber,
        }),
        headers: authHeaders(),
      },
    );

    if (!markResponse.ok) {
      logger.error("Failed to update document version", { payload });
      throw new Error("Failed to update document version");
    }

    logger.info("Enabling pages");
    updateStatus({
      progress: 90,
      text: "Enabling pages...",
    });

    logger.info("Revalidating link");
    updateStatus({
      progress: 95,
      text: "Revalidating link...",
    });

    // initialize link revalidation for all the document's links
    await fetch(
      `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${documentId}`,
    );

    updateStatus({
      progress: 100,
      text: "Processing complete",
    });

    logger.info("Processing complete");
    return {
      success: true,
      message: "Successfully converted PDF to images",
      totalPages: numPages,
    };
  },
});
