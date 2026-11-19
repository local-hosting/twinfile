export type ResolvedRef = {
  raw: string;
  registry?: string;
  namespace?: string;
  name?: string;
  tag?: string;
  digest?: string;
};

export type RefResolverOptions = {
  defaultRegistry?: string;
};

/** Resolves Twinfile unit refs (OCI default registry configurable). */
export class RefResolver {
  readonly #defaultRegistry: string;

  constructor(options: RefResolverOptions = {}) {
    this.#defaultRegistry = options.defaultRegistry ?? 'ghcr.io/local-hosting';
  }

  resolve(raw: string): ResolvedRef {
    const trimmed = raw.trim();
    if (trimmed.startsWith('oci:')) {
      return this.parseOci(trimmed.slice(4));
    }
    if (trimmed.startsWith('github:')) {
      return { raw: trimmed };
    }
    if (trimmed.includes('/') && trimmed.includes(':')) {
      return this.parseOci(`${this.#defaultRegistry}/${trimmed}`);
    }
    return { raw: trimmed };
  }

  unpin(resolved: ResolvedRef): string {
    if (resolved.digest) {
      return resolved.raw.replace(/@sha256:[a-f0-9]+$/, '');
    }
    return resolved.raw;
  }

  private parseOci(body: string): ResolvedRef {
    const [path, digestPart] = body.split('@sha256:');
    const digest = digestPart ? `sha256:${digestPart}` : undefined;
    const slash = path.lastIndexOf('/');
    const ns = slash >= 0 ? path.slice(0, slash) : '';
    const nameTag = slash >= 0 ? path.slice(slash + 1) : path;
    const colon = nameTag.lastIndexOf(':');
    const name = colon >= 0 ? nameTag.slice(0, colon) : nameTag;
    const tag = colon >= 0 ? nameTag.slice(colon + 1) : undefined;
    const registry = ns.includes('/') ? ns.split('/')[0] : this.#defaultRegistry;
    return {
      raw: `oci:${body}${digestPart ? `@sha256:${digestPart}` : ''}`,
      registry,
      namespace: ns,
      name,
      tag,
      digest,
    };
  }
}
