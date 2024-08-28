import { Client } from "@microsoft/microsoft-graph-client";
import { AuthenticationProvider } from "@microsoft/microsoft-graph-client";

export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenExpiredError";
  }
}

class AuthProvider implements AuthenticationProvider {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  public async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

function initClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

async function handleGraphRequest(requestFn: () => Promise<any>) {
  try {
    return await requestFn();
  } catch (error) {
    if ((error as any).statusCode === 401) {
      throw new TokenExpiredError("Access token has expired");
    }
    throw error;
  }
}

export async function getDriveContents(accessToken: string, path: string = "") {
  const client = initClient(accessToken);

  return handleGraphRequest(async () => {
    let response;
    if (path) {
      response = await client
        .api(`/me/drive/root:/${path}:/children`)
        .select("id,name,folder,file,lastModifiedDateTime,size")
        .get();
    } else {
      response = await client
        .api("/me/drive/root/children")
        .select("id,name,folder,file,lastModifiedDateTime,size")
        .get();
    }

    return response.value.map((item: any) => ({
      id: item.id,
      name: item.name,
      folder: item.folder,
      file: item.file,
      lastModifiedDateTime: item.lastModifiedDateTime,
      size: item.size || 0,
    }));
  });
}

export async function getDriveItem(accessToken: string, path: string) {
  const client = initClient(accessToken);

  try {
    const response = await client
      .api(`/me/drive/root:/${path}`)
      .select("id,name,file,size,lastModifiedDateTime,webUrl")
      .get();

    return {
      id: response.id,
      name: response.name,
      mimeType: response.file ? response.file.mimeType : "folder",
      size: response.size || 0,
      lastModifiedDateTime: response.lastModifiedDateTime,
      webUrl: response.webUrl,
    };
  } catch (error) {
    console.error("Error getting drive item:", error);
    throw error;
  }
}

export async function getFilePath(accessToken: string, itemId: string) {
  const client = initClient(accessToken);

  try {
    const response = await client
      .api(`/me/drive/items/${itemId}`)
      .select("name,parentReference")
      .get();
    let path = response.name;
    let parent = response.parentReference;

    while (parent && parent.id !== parent.driveId) {
      const parentItem = await client
        .api(`/me/drive/items/${parent.id}`)
        .select("name,parentReference")
        .get();
      path = `${parentItem.name}/${path}`;
      parent = parentItem.parentReference;
    }

    return path;
  } catch (error) {
    console.error("Error getting file path:", error);
    throw error;
  }
}

export async function downloadFile(accessToken: string, path: string) {
  const client = initClient(accessToken);

  try {
    const response = await client.api(`/me/drive/root:/${path}:/content`).get();
    return response;
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
}
