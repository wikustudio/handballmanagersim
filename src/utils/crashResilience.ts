/**
 * Crash resilience utilities protecting the simulation against:
 * 1. Non-string country / club metadata payloads (e.g., HMS-MWI2JDIQ-CMV1: country.trim is not a function)
 * 2. Browser extensions & Google Translate DOM mutations breaking React fiber reconciliation
 *    (e.g., HMS-MWI3UJTQ-I6KG, HMS-MWI4GKBT-FL6E, HMS-MWI3K0O6-PN9D:
 *     NotFoundError on Node.prototype.insertBefore / Node.prototype.removeChild)
 */

const PATCH_MARKER = '__hmsDomResiliencePatched__';

export function coerceCountryString(input: unknown, fallback: string = 'GER'): string {
  if (typeof input === 'string') {
    const trimmed = input.trim().toUpperCase();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    const obj = input as Record<string, unknown>;
    const candidate = obj.country ?? obj.code ?? obj.iso ?? obj.countryCode;
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim().toUpperCase();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return fallback;
}

export function isTransientDomMutationError(error: unknown): boolean {
  if (!error) return false;
  const name = typeof error === 'object' && 'name' in error ? String((error as any).name || '') : '';
  const msg =
    typeof error === 'string'
      ? error
      : typeof error === 'object' && 'message' in error
      ? String((error as any).message || '')
      : String(error);

  const lower = msg.toLowerCase();
  const isNodeMismatch =
    lower.includes("failed to execute 'insertbefore' on 'node'") ||
    lower.includes("failed to execute 'removechild' on 'node'") ||
    lower.includes('the node before which the new node is to be inserted is not a child of this node') ||
    lower.includes('the node to be removed is not a child of this node');

  if (isNodeMismatch) return true;
  if (name === 'NotFoundError' && (lower.includes('insertbefore') || lower.includes('removechild'))) {
    return true;
  }
  return false;
}

export function isExternalExtensionOnlyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const stack = 'stack' in error ? String((error as any).stack || '') : '';
  if (!stack) return false;

  const hasExtensionFrame =
    stack.includes('chrome-extension://') ||
    stack.includes('moz-extension://') ||
    stack.includes('safari-extension://') ||
    stack.includes('safari-web-extension://');

  if (!hasExtensionFrame) return false;

  if (isTransientDomMutationError(error)) {
    return true;
  }

  const lines = stack
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('at '));
  if (lines.length === 0) return false;

  const hasAppFrame = lines.some(
    (l) =>
      (l.includes('/src/') || l.includes('/assets/index-')) &&
      !l.includes('chrome-extension://') &&
      !l.includes('moz-extension://')
  );
  return !hasAppFrame;
}

export interface PatchableNodeProto {
  removeChild: <T extends Node>(child: T) => T;
  insertBefore: <T extends Node>(node: T, child: Node | null) => T;
}

/**
 * Safely wraps a Node-like prototype's `removeChild` and `insertBefore` methods so that
 * React reconciliation never crashes with `NotFoundError` when Chrome Translate (`<font>` wrappers)
 * or injected browser extensions (`chrome-extension://...`) reparent or detach DOM nodes.
 */
export function patchNodeDomMethods(proto: PatchableNodeProto): void {
  if (!proto) return;

  const origRemoveChild = proto.removeChild;
  if (typeof origRemoveChild === 'function' && !(origRemoveChild as any)[PATCH_MARKER]) {
    const safeRemoveChild = function <T extends Node>(this: Node, child: T): T {
      if (!child) return child;
      if (child.parentNode !== this) {
        try {
          if (typeof this.contains === 'function' && this.contains(child) && child.parentNode) {
            const actualParent = child.parentNode;
            actualParent.removeChild(child);
            if (
              actualParent !== this &&
              actualParent.nodeName === 'FONT' &&
              actualParent.childNodes.length === 0 &&
              actualParent.parentNode
            ) {
              actualParent.parentNode.removeChild(actualParent);
            }
          }
        } catch {
          // Ignore nested cleanup failures on extension-owned nodes
        }
        return child;
      }
      try {
        return origRemoveChild.call(this, child) as T;
      } catch (err) {
        if (isTransientDomMutationError(err)) {
          return child;
        }
        throw err;
      }
    };
    Object.defineProperty(safeRemoveChild, PATCH_MARKER, { value: true, configurable: true });
    proto.removeChild = safeRemoveChild;
  }

  const origInsertBefore = proto.insertBefore;
  if (typeof origInsertBefore === 'function' && !(origInsertBefore as any)[PATCH_MARKER]) {
    const safeInsertBefore = function <T extends Node>(
      this: Node,
      newNode: T,
      referenceNode: Node | null
    ): T {
      if (!newNode) return newNode;
      if (referenceNode && referenceNode.parentNode !== this) {
        // Walk up in case Chrome Translate wrapped referenceNode inside <font> under `this`
        let anchor: Node | null = referenceNode.parentNode;
        while (anchor && anchor.parentNode && anchor.parentNode !== this) {
          anchor = anchor.parentNode;
        }
        try {
          if (anchor && anchor.parentNode === this) {
            return origInsertBefore.call(this, newNode, anchor) as T;
          }
          return origInsertBefore.call(this, newNode, null) as T;
        } catch (err) {
          if (isTransientDomMutationError(err)) {
            return newNode;
          }
          throw err;
        }
      }
      try {
        return origInsertBefore.call(this, newNode, referenceNode) as T;
      } catch (err) {
        if (isTransientDomMutationError(err)) {
          try {
            return origInsertBefore.call(this, newNode, null) as T;
          } catch {
            return newNode;
          }
        }
        throw err;
      }
    };
    Object.defineProperty(safeInsertBefore, PATCH_MARKER, { value: true, configurable: true });
    proto.insertBefore = safeInsertBefore;
  }
}

export function installDomMutationResilience(): void {
  if (typeof window === 'undefined' || typeof Node === 'undefined' || !Node.prototype) {
    return;
  }
  patchNodeDomMethods(Node.prototype);
}
