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

  #upsert(node: Node | undefined): void {
    !this.#childrenMap.has(node) && this.#childrenMap.set(node, new Set());
  }

  #parents(child: Node): Set<Node> | undefined {
    if (!this.#childrenMap.get(child)) return undefined;

    return new Set(
        Array.from(this.nodes()).filter((node) =>
            this.#childrenMap.get(node)?.has(child)
        )
    );
  }

  #intersection(a: Set<Node>, b: Set<Node>): Set<Node> {
    return new Set([...a].filter((x) => b.has(x)));
  }

  constructor(source?: OverlappingHierarchy<Node>) {
    source?.nodes().forEach((node) => {
      this.#childrenMap.set(node, source?.descendants(node, 1) || new Set());
    });
  }

  add(
    node: Node,
    parent: Node | undefined = undefined
  ): OverlappingHierarchyError | void {
    if (node === parent) return new LoopError("Cannot attach node to itself");
    if (this.nodes().has(node) && parent && this.descendants(node)?.has(parent))
      return new CycleError("Cannot attach ancestor as a child");
    if (
      parent &&
      !this.#childrenMap.get(parent)?.has(node) &&
      this.descendants(parent)?.has(node)
    )
      return new TransitiveReductionError(
        "Cannot attach non-child descendant as a child"
      );
    if (
      this.#intersection(
        this.descendants(node) || new Set(),
        this.#childrenMap.get(parent) || new Set()
      ).size > 0
    )
      return new TransitiveReductionError(
        "Cannot attach child whose descendant is a child of the parent"
      );

    this.#upsert(parent);
    this.#upsert(node);
    this.#childrenMap.get(parent)?.add(node);
  }

  nodes = (): Set<Node> => // TODO: almost the same as descendants(parent = undefined) but always defined
    new Set(
      Array.from(this.#childrenMap.keys()).filter(
        (n) => n !== undefined
      ) as Node[]
    );

  #recursiveTraverse = (set: Set<Node>, traverseFunction: any, depth: typeof Infinity | 1 = Infinity): Set<Node> => {
    if (depth === 1) {
      return set;
    }
    const traversedNodes = Array.from(set).flatMap((child) =>
        Array.from(traverseFunction(child) || [])
    );
    return new Set([...set, ...traversedNodes]) as Set<Node>;
  }

  descendants(
    node: Node | undefined = undefined,
    depth: typeof Infinity | 1 = Infinity
  ): Set<Node> | undefined {
    if (!this.#childrenMap.has(node)) return undefined;

    const set = new Set(this.#childrenMap.get(node));
    return this.#recursiveTraverse(set, this.descendants.bind(this), depth);
  }

  ancestors(node: Node, depth: typeof Infinity | 1 = Infinity): Set<Node> | undefined {
    if (!this.#childrenMap.has(node)) return undefined;

    const set = new Set(this.#parents(node))
    return this.#recursiveTraverse(set, this.ancestors.bind(this), depth);
  }

  // todo: delete without second argument?
  // todo: when detach from undefined parent (default) - delete node, consider new api to replace delete
  remove = (node: Node, parent: Node): void =>
    this.#childrenMap.get(parent)?.delete(node) as unknown as void; // TODO consider changing argument order to be consistent with attach

  delete(node: Node): void {
    // todo: deprecate after (detach from undefined)?
    // const parents = this.parents(node);
    // parents?.forEach((parent) => this.detach(node, parent));
    this.#childrenMap.delete(node);
    this.nodes().forEach((parent) => this.remove(node, parent));
  }
}
