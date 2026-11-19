import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';

export type RegistryAuth = {
  token?: string;
  username?: string;
};

export type OciRegistryClientOptions = {
  registry: string;
  repository: string;
  auth?: RegistryAuth;
};

function registryError(status: number, body: string, context: string): Result<never> {
  return err([
    {
      code: 'E_BUILD',
      message: `Registry ${context} failed: HTTP ${status}`,
      hint: body.slice(0, 200),
    },
  ]);
}

function resolveCredentials(auth: RegistryAuth | undefined): { token?: string; username?: string } {
  const token = auth?.token ?? process.env.OCI_REGISTRY_TOKEN ?? process.env.GITHUB_TOKEN;
  const username = auth?.username ?? process.env.GHCR_USERNAME ?? process.env.GITHUB_ACTOR;
  return { token, username };
}

async function ghcrBearerToken(
  repository: string,
  username: string,
  password: string,
): Promise<Result<string>> {
  const scope = `repository:${repository}:pull,push`;
  const url = `https://ghcr.io/token?service=ghcr.io&scope=${encodeURIComponent(scope)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    const text = await response.text();
    return registryError(response.status, text, 'token exchange');
  }
  const json = (await response.json()) as { token?: string };
  if (!json.token) {
    return err([{ code: 'E_BUILD', message: 'Registry token response missing token field' }]);
  }
  return ok(json.token);
}

/** Minimal OCI Distribution v2 client (blob + twinfile). */
export class OciRegistryClient {
  readonly #base: string;
  readonly #repository: string;
  readonly #registry: string;
  readonly #auth?: RegistryAuth;
  #ghcrBearer?: Promise<Result<string>>;

  constructor(options: OciRegistryClientOptions) {
    this.#registry = options.registry;
    this.#base = `https://${options.registry}/v2`;
    this.#repository = options.repository;
    this.#auth = options.auth;
  }

  async blobExists(digest: string): Promise<boolean> {
    const headers = await this.#headersRecord();
    if (!headers.ok) return false;
    const url = `${this.#base}/${this.#repository}/blobs/${digest}`;
    const response = await fetch(url, { method: 'HEAD', headers: headers.value });
    return response.status === 200;
  }

  async uploadBlob(digest: string, body: Buffer): Promise<Result<{ digest: string }>> {
    if (await this.blobExists(digest)) {
      return ok({ digest });
    }

    const headers = await this.#headersRecord();
    if (!headers.ok) return headers;

    const start = await fetch(`${this.#base}/${this.#repository}/blobs/uploads/`, {
      method: 'POST',
      headers: headers.value,
    });
    if (!start.ok) {
      const text = await start.text();
      return registryError(start.status, text, 'blob upload start');
    }

    const location = start.headers.get('location');
    if (!location) {
      return err([{ code: 'E_BUILD', message: 'Registry missing upload Location header' }]);
    }

    const uploadUrl = new URL(location, `${this.#base}/`);
    uploadUrl.searchParams.set('digest', digest);

    const put = await fetch(uploadUrl.toString(), {
      method: 'PUT',
      headers: {
        ...headers.value,
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(body.length),
      },
      body: new Uint8Array(body),
    });
    if (!put.ok) {
      const text = await put.text();
      return registryError(put.status, text, 'blob upload');
    }

    return ok({ digest });
  }

  async putManifest(reference: string, manifestBody: Buffer): Promise<Result<{ digest: string }>> {
    const headers = await this.#headersRecord();
    if (!headers.ok) return headers;

    const url = `${this.#base}/${this.#repository}/manifests/${reference}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers.value,
        'Content-Type': 'application/vnd.oci.image.twinfile.v1+json',
      },
      body: new Uint8Array(manifestBody),
    });
    if (!response.ok) {
      const text = await response.text();
      return registryError(response.status, text, 'manifest upload');
    }
    const digest = response.headers.get('docker-content-digest') ?? reference;
    return ok({ digest });
  }

  async getManifest(reference: string): Promise<Result<{ manifest: unknown; digest: string; raw: Buffer }>> {
    const headers = await this.#headersRecord();
    if (!headers.ok) return headers;

    const url = `${this.#base}/${this.#repository}/manifests/${reference}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers.value,
        Accept: 'application/vnd.oci.image.twinfile.v1+json, application/vnd.docker.distribution.twinfile.v2+json',
      },
    });
    if (!response.ok) {
      const text = await response.text();
      return registryError(response.status, text, 'manifest fetch');
    }
    const raw = Buffer.from(await response.arrayBuffer());
    const manifest = JSON.parse(raw.toString('utf8')) as unknown;
    const digest = response.headers.get('docker-content-digest') ?? reference;
    return ok({ manifest, digest, raw });
  }

  async fetchBlob(digest: string): Promise<Result<Buffer>> {
    const headers = await this.#headersRecord();
    if (!headers.ok) return headers;

    const url = `${this.#base}/${this.#repository}/blobs/${digest}`;
    const response = await fetch(url, { method: 'GET', headers: headers.value });
    if (!response.ok) {
      const text = await response.text();
      return registryError(response.status, text, 'blob fetch');
    }
    return ok(Buffer.from(await response.arrayBuffer()));
  }

  async #authorizationHeader(): Promise<Result<string | undefined>> {
    const { token, username } = resolveCredentials(this.#auth);
    if (!token) return ok(undefined);

    if (this.#registry === 'ghcr.io' && username) {
      if (!this.#ghcrBearer) {
        this.#ghcrBearer = ghcrBearerToken(this.#repository, username, token);
      }
      const exchanged = await this.#ghcrBearer;
      if (!exchanged.ok) return exchanged;
      return ok(`Bearer ${exchanged.value}`);
    }

    if (username) {
      return ok(`Basic ${Buffer.from(`${username}:${token}`, 'utf8').toString('base64')}`);
    }

    return ok(`Bearer ${token}`);
  }

  async #headersRecord(): Promise<Result<Record<string, string>>> {
    const auth = await this.#authorizationHeader();
    if (!auth.ok) return auth;
    const headers: Record<string, string> = {};
    if (auth.value) headers.Authorization = auth.value;
    return ok(headers);
  }
}

export function resolveRegistryAuth(explicit?: RegistryAuth): RegistryAuth | undefined {
  const { token, username } = resolveCredentials(explicit);
  if (!token) return explicit;
  return { ...explicit, token, ...(username ? { username } : {}) };
}
