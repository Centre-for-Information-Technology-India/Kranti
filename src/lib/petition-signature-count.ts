export async function updateSignatureCountAfterSave(
  updateCount: () => Promise<unknown>,
  logFailure: (error: unknown) => void,
): Promise<boolean> {
  try {
    await updateCount();
    return true;
  } catch (error) {
    // The signature is already stored. Do not report that the signing failed.
    logFailure(error);
    return false;
  }
}
