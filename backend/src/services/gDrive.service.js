import { google } from "googleapis";
import { Readable } from "stream";
// Función para obtener un cliente de Google Drive autenticado
const getDriveClient = () => {
    // Opción Prioritaria: OAuth2 (Para cuentas personales @gmail.com)
    // Las cuentas personales NO pueden usar Service Accounts para subir archivos (error de cuota).
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_REDIRECT_URI } = process.env;

    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN) {
        const oauth2Client = new google.auth.OAuth2(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            GOOGLE_REDIRECT_URI || "https://developers.google.com/oauthplayground"
        );
        oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
        return google.drive({ version: "v3", auth: oauth2Client });
    }

    // Opción 1: Contenido del JSON en variable de entorno (GOOGLE_SERVICE_ACCOUNT_JSON)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        let credentials;
        try {
            credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        } catch (error) {
            throw new Error(`Error crítico en GOOGLE_SERVICE_ACCOUNT_JSON: El formato JSON es inválido. Asegúrate de que todas las claves estén entre comillas dobles ("). Detalle: ${error.message}`);
        }

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        return google.drive({ version: "v3", auth });
    }

    // Opción 2: Ruta al archivo definida en GOOGLE_APPLICATION_CREDENTIALS (automático)
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return google.drive({ version: "v3", auth });
};

// Helper para convertir Buffer a Stream
const bufferToStream = (buffer) => {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
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
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!folderId) {
            throw new Error("Falta la variable de entorno GOOGLE_DRIVE_FOLDER_ID");
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
            fields: "id, webViewLink, webContentLink",
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