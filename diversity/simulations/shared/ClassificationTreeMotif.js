// Shared drawing helper (plain functions, not a scene) - the course's one
// recurring visual throughline: a small branching tree that grows by one
// lesson's worth of nodes at a time. Each lesson's own close scene imports
// this, builds its own explicit node/edge list (no auto-layout - matches
// this codebase's existing hand-positioned-schematic style) and calls
// treeMarkup(). No state is shared between mounts; every call is a fresh,
// fully-described snapshot, per the cross-mount rule.
//
// node: { id, x, y, label, state }
//   state: 'root'       - the single starting node ("Living things")
//           'placeholder' - a branch that exists but has no name yet (dashed)
//           'named'      - a labelled, settled branch from an earlier lesson
//           'new'        - the branch this lesson just added (filled, glow)
// edge: [fromId, toId]

const R = 15; // node radius, design px

function nodeMarkup(n) {
  const cls = `ctm-node ctm-node--${n.state}`;
  // R + 16 measured too tight in Chromium: `.ctm-label`'s 15-unit font-size
  // scales with the same viewBox->viewport factor as the node geometry (SVG
  // text isn't exempt from that scaling the way a DOM overlay label would
  // be - see PhotoDiagram.js's own unrelated but analogous gotcha), so a
  // 15-unit font on a 16-unit gap left only ~4 real px of clearance below a
  // 15-unit-radius node - ascenders/descenders on a labeled node (any
  // 'new'/'named' state; every lesson using this motif labels a fresh node)
  // visibly brushed the circle. +22 confirmed clear via direct rect
  // measurement (no overlap) against "Living things", the longest label in
  // this course's own use of the motif.
  const label = n.label
    ? `<text class="ctm-label" x="${n.x}" y="${n.y + R + 22}" text-anchor="middle">${n.label}</text>`
    : '';
  const mark = n.state === 'placeholder'
    ? `<text class="ctm-q" x="${n.x}" y="${n.y + 5}" text-anchor="middle">?</text>`
    : '';
  return `<circle class="${cls}" cx="${n.x}" cy="${n.y}" r="${R}" />${mark}${label}`;
}

function edgeMarkup(edge, nodesById) {
  const a = nodesById.get(edge[0]);
  const b = nodesById.get(edge[1]);
  if (!a || !b) return '';
  const dashed = b.state === 'placeholder' ? ' ctm-edge--dashed' : '';
  return `<line class="ctm-edge${dashed}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
}

/**
 * @param {{width:number, height:number, nodes:Array, edges:Array, caption?:string}} spec
 * @returns {string} an inline <svg> markup string
 */
export function treeMarkup({ width, height, nodes, edges, caption }) {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const edgeSvg = edges.map((e) => edgeMarkup(e, nodesById)).join('');
  const nodeSvg = nodes.map(nodeMarkup).join('');
  const cap = caption ? `<text class="ctm-caption" x="${width / 2}" y="${height - 6}" text-anchor="middle">${caption}</text>` : '';
  return `<svg class="ctm-tree" viewBox="0 0 ${width} ${height}" role="img" aria-label="${caption || 'Classification tree, current state'}">
    ${edgeSvg}${nodeSvg}${cap}
  </svg>`;
}

export const TREE_MOTIF_CSS = `
  .ctm-tree { width: 100%; height: auto; overflow: visible; }
  .ctm-edge { stroke: var(--sim-stroke); stroke-width: 2; }
  .ctm-edge--dashed { stroke: var(--sim-label-muted); stroke-dasharray: 4 4; }
  .ctm-node { stroke-width: 2; }
  .ctm-node--root { fill: var(--sim-bg-cell); stroke: var(--sim-accent); }
  .ctm-node--placeholder { fill: var(--sim-bg-surface); stroke: var(--sim-label-muted); stroke-dasharray: 3 3; }
  .ctm-node--named { fill: var(--sim-bg-cell); stroke: var(--sim-stroke); }
  .ctm-node--new { fill: var(--sim-accent); stroke: var(--sim-accent); animation: ctm-pulse 1600ms ease-in-out infinite; }
  .ctm-q { fill: var(--sim-label-muted); font: 700 15px var(--sim-font); }
  /* A node with children directly below it (the root, or any already-
     branched node like Animalia once it grows its own phyla) sits with its
     label right in the path of the edges fanning out to those children -
     the label is centered on the same x as the node, and a wide label
     ("Living things") spans wide enough to cross the diagonal edges too,
     not just the straight one below it. Confirmed by rendering: the edge
     line was visibly crossing through several letters. A halo (an opaque
     stroke behind the fill, via paint-order) is the standard fix for a
     label that may sit over other content, rather than trying to route
     edges or reposition labels around an arbitrary tree shape. Defaults to
     the --sim-bg-deep token, matching most scenes using this motif's own
     root background; a scene whose tree sits on a different surface (e.g.
     --sim-bg-surface) should set --ctm-label-halo to match on its own
     wrapper - see WormSegmentationQuestionScene.js for an example. */
  .ctm-label { fill: var(--sim-label); font: 15px var(--sim-font);
    paint-order: stroke; stroke: var(--ctm-label-halo, var(--sim-bg-deep)); stroke-width: 5px; stroke-linejoin: round; }
  .ctm-caption { fill: var(--sim-label-muted); font: 15px var(--sim-font); }
  @keyframes ctm-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
  @media (prefers-reduced-motion: reduce) { .ctm-node--new { animation: none; } }
`;
