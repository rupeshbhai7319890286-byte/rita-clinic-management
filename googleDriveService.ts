/**
 * Google Drive API v3 Service
 * Integrates directly with https://www.googleapis.com/drive/v3/
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

const CLINIC_FOLDER_NAME = 'Rita_Clinic_Medical_Records';

/**
 * Gets or creates the main Rita Clinic folder on the user's Google Drive
 */
export async function getOrCreateClinicFolder(accessToken: string): Promise<string> {
  // Check if folder already exists
  const query = encodeURIComponent(
    `name = '${CLINIC_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!searchRes.ok) {
    throw new Error(`Failed to query Google Drive: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: CLINIC_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Medical Records, Prescriptions, and Backups for Rita Clinic (Dr. Rupesh Kumar Poddar)',
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Clinic folder: ${createRes.statusText}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Lists files in Google Drive (optionally inside the Clinic folder or by search query)
 */
export async function listClinicFiles(
  accessToken: string,
  folderId?: string,
  searchQuery?: string
): Promise<DriveFile[]> {
  let q = 'trashed = false';

  if (folderId) {
    q += ` and '${folderId}' in parents`;
  }

  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.trim().replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    q
  )}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink)&orderBy=modifiedTime desc&pageSize=50`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list files from Google Drive: ${res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Uploads a file (text, JSON, or binary PDF Blob) to Google Drive using multipart upload
 */
export async function uploadToDrive(
  accessToken: string,
  filename: string,
  mimeType: string,
  content: Blob | string,
  parentFolderId?: string
): Promise<DriveFile> {
  const metadata: Record<string, any> = {
    name: filename,
    mimeType: mimeType,
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let bodyBlob: Blob;

  const contentBlob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;

  // Metadata part
  const metadataPart = new Blob(
    [
      delimiter,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      delimiter,
      `Content-Type: ${mimeType}\r\n\r\n`,
    ],
    { type: 'text/plain' }
  );

  const closePart = new Blob([closeDelimiter], { type: 'text/plain' });

  bodyBlob = new Blob([metadataPart, contentBlob, closePart]);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,modifiedTime,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: bodyBlob,
    }
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Upload to Drive failed: ${uploadRes.status} ${errorText}`);
  }

  return await uploadRes.json();
}

/**
 * Deletes a file from Google Drive
 * NOTE: User confirmation dialog MUST be prompted before calling this!
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete file from Google Drive: ${res.statusText}`);
  }

  return true;
}
