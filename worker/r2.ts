export async function getEvidenceObject(bucket: R2Bucket, key: string) {
  try {
    return await bucket.get(key);
  } catch {
    return null;
  }
}

export function evidenceApiPath(r2Key: string): string {
  return `/api/evidence/${encodeURIComponent(r2Key)}`;
}
