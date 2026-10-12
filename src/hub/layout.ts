import type { LabMeta } from '../labs/registry';

export interface NodePosition {
  id: string;
  /** Column = length of the longest prerequisite chain. */
  depth: number;
  x: number;
  y: number;
}

/** Lay labs out left→right by prerequisite depth; labs at the same depth stack vertically. */
export function layoutLabs(labs: LabMeta[], spacingX = 2.6, spacingY = 1.8): NodePosition[] {
  const byId = new Map(labs.map((l) => [l.id, l]));
  const depthMemo = new Map<string, number>();

  const depthOf = (id: string, visiting: Set<string>): number => {
    const cached = depthMemo.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) throw new Error(`Prerequisite cycle at "${id}"`);
    const lab = byId.get(id);
    if (!lab) throw new Error(`Unknown prerequisite "${id}"`);
    visiting.add(id);
    const d = lab.prerequisites.length
      ? 1 + Math.max(...lab.prerequisites.map((p) => depthOf(p, visiting)))
      : 0;
    visiting.delete(id);
    depthMemo.set(id, d);
    return d;
  };

  const columns = new Map<number, LabMeta[]>();
  for (const lab of [...labs].sort((a, b) => a.order - b.order)) {
    const d = depthOf(lab.id, new Set());
    columns.set(d, [...(columns.get(d) ?? []), lab]);
  }

  const maxDepth = Math.max(...columns.keys());
  const out: NodePosition[] = [];
  for (const [depth, col] of columns) {
    col.forEach((lab, i) => {
      out.push({
        id: lab.id,
        depth,
        x: (depth - maxDepth / 2) * spacingX,
        y: ((col.length - 1) / 2 - i) * spacingY,
      });
    });
  }
  return out;
}
