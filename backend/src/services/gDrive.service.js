import { google } from "googleapis";
import { Readable } from "stream";
// Función para obtener un cliente de Google Drive autenticado
const getDriveClient = () => {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_REDIRECT_URI } = process.env;

    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI 
    );

    oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

    return google.drive({ version: "v3", auth: oauth2Client });
};

// Helper para convertir Buffer a Stream
const bufferToStream = (buffer) => {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
};

/**
 * Busca una carpeta por nombre y si no existe la crea.
 */
const findOrCreateFolder = async (drive, folderName) => {
    try {
        const q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
        const res = await drive.files.list({
            q,
            fields: 'files(id, name)',
            spaces: 'drive',
        });
        
        if (res.data.files.length > 0) {
            return res.data.files[0].id;
        }
        
        const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        };
        const file = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id',
        });
        console.log(`📂 Carpeta '${folderName}' creada automáticamente (ID: ${file.data.id})`);
        return file.data.id;
    } catch (error) {
        console.error("Error buscando/creando carpeta:", error);
        throw error;
    }
};

/**
 * Sube un archivo a una carpeta específica en Google Drive.
 * @param {Buffer} fileBuffer El buffer del archivo a subir.
 * @param {string} fileName El nombre con el que se guardará el archivo.
 * @param {string} [folderName] Ignorado. Se usa GOOGLE_DRIVE_FOLDER_ID.
 * @returns {Promise<object>} La respuesta de la API de Drive con los detalles del archivo subido.
 */
export const uploadFileToGoogleDrive = async (fileBuffer, fileName) => {
    try {
        const drive = getDriveClient();
        let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!folderId) {
            // Si no hay ID configurado, buscamos o creamos una carpeta por defecto
            folderId = await findOrCreateFolder(drive, "PriorityGroup_CVs");
        }

        const fileMetadata = {
            name: fileName,
            parents: [folderId],
        };

        const media = {
            mimeType: "application/octet-stream",
            body: bufferToStream(fileBuffer),
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: "id, webViewLink, webContentLink"
            
        });
        
        // --- PERMISOS PÚBLICOS ---
        // Hacemos que el archivo sea legible por "cualquiera con el link".
        // Esto evita el error 403 al intentar descargarlo desde la app.
        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
            
        });

        console.log(`Archivo ${fileName} subido a Google Drive con éxito.`);
        return response.data;

    } catch (error) {
        console.error("Error al subir el archivo a Google Drive:", error);
        // Propagamos el mensaje original (ej: API disabled, Quota exceeded) para facilitar el debug
        throw new Error(error.message || "No se pudo subir el archivo.");
    }
};
/**
 * Obtiene una URL de descarga para un archivo en Google Drive.
 * @param {string} fileId - El ID del archivo en Google Drive.
 * @returns {Promise<string|null>} La URL de descarga o null si hay un error.
 */
export const getDownloadUrlForFile = async (fileId) => {
  try {
    const drive = getDriveClient();

    const response = await drive.files.get({
      fileId: fileId,
      fields: "webContentLink, webViewLink",
    });
    
    return response.data.webContentLink || response.data.webViewLink;

  } catch (error) {
    console.error("Error al obtener la URL de descarga de Google Drive:", error);
    return null;
  }
};

/**
 * Elimina un archivo de Google Drive usando su ID.
 * @param {string} fileId - El ID del archivo en Google Drive.
 * @returns {Promise<boolean>} True si se eliminó, false si hubo un error.
 */
export const deleteFileFromGoogleDrive = async (fileId) => {
  if (!fileId) return false;
  try {
    const drive = getDriveClient();

    await drive.files.delete({ fileId: fileId });
    console.log(`Archivo con ID ${fileId} eliminado de Google Drive.`);
    return true;
  } catch (error) {
    console.error(`Error al eliminar el archivo ${fileId} de Google Drive:`, error);
    return false;
  }
};