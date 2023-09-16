class OverlappingHierarchyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class LoopError extends OverlappingHierarchyError {}
export class CycleError extends OverlappingHierarchyError {}
export class TransitiveReductionError extends OverlappingHierarchyError {} // https://en.wikipedia.org/wiki/Transitive_reduction#In_directed_acyclic_graphs

export default class OverlappingHierarchy<Node> {
  #childrenMap: Map<Node | undefined, Set<Node>> = new Map();

  #intersection(a: Set<Node>, b: Set<Node>): Set<Node> {
    return new Set([...a].filter((x) => b.has(x)));
  }

  constructor(source?: OverlappingHierarchy<Node>) {
    source?.nodes().forEach((node) => {
      this.#childrenMap.set(node, source.children(node) || new Set());
    });
  }

  #add(node: Node | undefined): void {
    this.#childrenMap.set(node, this.#childrenMap.get(node) || new Set());
  }

  // todo: add?
  attach(node: Node, parent: Node | undefined = undefined): OverlappingHierarchyError | void {
    if (node === parent) return new LoopError("Cannot attach node to itself");
    if (
      this.nodes().has(node) &&
      parent &&
      this.descendants(node)?.has(parent)
    )
      return new CycleError("Cannot attach ancestor as a child");
    if (
      parent &&
      !this.children(parent)?.has(node) &&
      this.descendants(parent)?.has(node)
    )
      return new TransitiveReductionError(
        "Cannot attach non-child descendant as a child"
      );
    if (
      this.#intersection(
        this.descendants(node) || new Set(),
        this.children(parent) || new Set()
      ).size > 0
    )
      return new TransitiveReductionError(
        "Cannot attach child whose descendant is a child of the parent"
      );

    if (this.#childrenMap.get(parent) === undefined) this.#add(parent);

    this.#childrenMap.get(parent)?.add(node);
    this.#add(node);
  }

  children = (parent: Node | undefined = undefined): Set<Node> | undefined => // todo return frozen object?
    this.#childrenMap.has(parent)
      ? new Set(this.#childrenMap.get(parent))
      : undefined;

  nodes = (): Set<Node> =>
    new Set(
      Array.from(this.#childrenMap.keys()).filter(
        (n) => n !== undefined
      ) as Node[]
    );

  descendants(node: Node): Set<Node> | undefined {
    if (!this.children(node)) return undefined;

    const children = new Set(this.children(node));
    const childrenDescendants = Array.from(children).flatMap((child) =>
      Array.from(this.descendants(child) || [])
    );

    return new Set([...children, ...childrenDescendants]);
  }

  ancestors(node: Node): Set<Node> | undefined {
    if (!this.children(node)) return undefined;

    const parents = new Set(this.parents(node));
    const parentsAncestors = Array.from(parents).flatMap((parent) =>
      Array.from(this.ancestors(parent) || [])
    );

    return new Set([...parents, ...parentsAncestors]);
  }

  parents(child: Node): Set<Node> | undefined {
    if (!this.children(child)) return undefined;

    return new Set(
      Array.from(this.nodes()).filter((node) => this.children(node)?.has(child))
    );
  }

  // todo: delete?
  // todo: when detach from undefined parent (default) - delete node, consider new api to replace delete
  detach = (parent: Node, node: Node): void => // TODO consider changing argument order to be consistent with attach
    this.#childrenMap.get(parent)?.delete(node) as unknown as void;

  delete(node: Node): void {
    this.#childrenMap.delete(node);
    this.nodes().forEach((parent) => this.detach(parent, node));
  }
}
