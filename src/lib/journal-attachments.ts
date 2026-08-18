import type { JournalAttachment } from "@/lib/types";

const DB_NAME = "practicora-attachments";
const STORE_NAME = "blobs";
const DB_VERSION = 1;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Unable to open attachment storage"));
  });
}

async function runRequest<T>(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = callback(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Attachment storage request failed"));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("Attachment storage transaction failed"));
    };
  });
}

export async function putAttachmentBlob(id: string, blob: Blob) {
  await runRequest("readwrite", (store) => store.put(blob, id));
}

export async function getAttachmentBlob(id: string) {
  return runRequest<Blob | undefined>("readonly", (store) => store.get(id));
}

export async function removeAttachmentBlob(id: string) {
  await runRequest("readwrite", (store) => store.delete(id));
}

export async function removeAttachmentBlobs(attachments: JournalAttachment[]) {
  await Promise.allSettled(attachments.map((attachment) => removeAttachmentBlob(attachment.id)));
}
