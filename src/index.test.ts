import OverlappingHierarchy, {
  CycleError,
  LoopError,
  TransitiveReductionError,
} from "./index";

const CHILD = "child";
const PARENT = "parent";
const GRANDPARENT = "grandparent";

describe("OverlappingHierarchy", () => {
  let family: OverlappingHierarchy<string>;

  beforeEach(() => {
    family = new OverlappingHierarchy();
    family.add(GRANDPARENT);
    family.add(PARENT, GRANDPARENT);
    family.add(CHILD, PARENT);
  });

  describe("new OverlappingHierarchy(source)", () => {
    let clone: OverlappingHierarchy<string>;

    beforeEach(() => {
      clone = new OverlappingHierarchy(family);
    });

    test("Has the same nodes", () => {
      expect(clone.nodes()).toStrictEqual(family.nodes());
    });

    test("Has the same relationships", () => {
      for (const node of family.nodes()) {
        expect(clone.ancestors(node)).toStrictEqual(family.ancestors(node));
      }
    });

    test("Restructuring a clone keeps the source structure intact", () => {
      const originalNodes = family.nodes();
      for (const node of clone.nodes()) {
        clone.delete(node);
      }
      clone.add("New Child");
      clone.add("New Parent", "New Child");
      expect(originalNodes).toStrictEqual(family.nodes());
    });
  });

  describe(".attach()", () => {
    describe("hierarch", () => {
      // todo: make parent second optional argument
      test("Adds string node", () => {
        family.add("relative");
        expect(family.nodes().has("relative")).toStrictEqual(true);
      });

      test("Adds null node", () => {
        const hierarchy = new OverlappingHierarchy<null>();
        hierarchy.add(null);
        expect(hierarchy.nodes()).toStrictEqual(new Set([null]));
      });

      test("Adds object node", () => {
        const hierarchy = new OverlappingHierarchy<object>();
        hierarchy.add({});
        expect(hierarchy.nodes()).toStrictEqual(new Set([{}]));
      });

      test("Adding existing node does not change hierarchy", () => {
        const originalNodes = family.nodes();
        family.add(CHILD);
        expect(originalNodes).toStrictEqual(family.nodes());
      });
    });

    describe("child", () => {
      test("Attaching node to itself returns LoopError", () => {
        expect(family.add(CHILD, CHILD)).toStrictEqual(
          new LoopError("Cannot attach node to itself")
        );
      });

      test("Attaching ancestor as a child returns CycleError", () => {
        expect(family.add(GRANDPARENT, CHILD)).toStrictEqual(
          new CycleError("Cannot attach ancestor as a child")
        );
      });

      test("Attaching non-child descendant as a child returns TransitiveReductionError", () => {
        expect(family.add(CHILD, GRANDPARENT)).toStrictEqual(
          new TransitiveReductionError(
            `Cannot attach non-child descendant as a child`
          )
        );
      });

      test("Attaching bottom of the diamond to the top returns TransitiveReductionError", () => {
        family.add("p2");
        family.add("p2", GRANDPARENT);
        family.add(CHILD, "p2");
        expect(family.add(CHILD, GRANDPARENT)).toStrictEqual(
          new TransitiveReductionError(
            `Cannot attach non-child descendant as a child`
          )
        );
      });

      test("Attaching another ancestor of a child returns TransitiveReductionError", () => {
        family.add("p2");
        family.add(CHILD, "p2");
        expect(family.add("p2", PARENT)).toStrictEqual(
          new TransitiveReductionError(
            `Cannot attach child whose descendant is a child of the parent`
          )
        );
      });

      test("Attaches node to the parent as a child", () => {
        family.add("grandchild", CHILD);
        expect(family.descendants(CHILD)).toStrictEqual(
          new Set(["grandchild"])
        );
      });

      test("Attaching the same child again does not return error", () => {
        family.add("grandchild", CHILD);
        expect(family.add("grandchild", CHILD)).toBeUndefined();
      });

      test("Adding to a non-existing parent also adds parent", () => {
        family.add(CHILD, "missing");
        expect(family.descendants(undefined, 1)?.has("missing")).toStrictEqual(true);
      });

      test("Attaches node to another parent as a child", () => {
        family.add("another parent", GRANDPARENT);
        family.add(CHILD, "another parent");
        expect(family.descendants("another parent")?.has(CHILD)).toStrictEqual(
          true
        );
      });

      test("Attached child has a parent", () => {
        const GREAT_GRANDPARENT = "great-grandparent";
        family.add(GREAT_GRANDPARENT);
        family.add(GRANDPARENT, GREAT_GRANDPARENT);
        expect(family.ancestors(GRANDPARENT)).toStrictEqual(
          new Set([GREAT_GRANDPARENT])
        );
      });
    });
  });

  describe(".nodes()", () => {
    test("Returns nodes", () => {
      expect(family.nodes()).toStrictEqual(
        new Set([GRANDPARENT, PARENT, CHILD])
      );
    });
  });

  describe(".descendants()", () => {
    test("Without arguments, returns all nodes", () => {
      expect(family.descendants()).toStrictEqual(
        new Set([GRANDPARENT, PARENT, CHILD])
      );
    });

    test("When parent is undefined, returns all nodes", () => {
      expect(family.descendants(undefined)).toStrictEqual(
        new Set([GRANDPARENT, PARENT, CHILD])
      );
    });

    test("When parent is undefined and depth is 1, returns hierarchs", () => {
      expect(family.descendants(undefined, 1)).toStrictEqual(
        new Set([GRANDPARENT])
      );
    });

    test("When parent does not exist, returns undefined", () => {
      expect(family.descendants("missing")).toBeUndefined();
    });

    test("When parent is defined, returns its descendants", () => {
      expect(family.descendants(GRANDPARENT)).toStrictEqual(
        new Set([PARENT, CHILD])
      );
    });

    test("When parent is defined and depth is 1, returns its children", () => {
      expect(family.descendants(PARENT, 1)).toStrictEqual(new Set([CHILD]));
    });

    test("Mutating returned set does not affect hierarchy", () => {
      const children = family.descendants(PARENT);
      children?.clear();
      expect(family.descendants(PARENT, 1)?.has(CHILD)).toStrictEqual(true);
    });
  });

  describe(".ancestors()", () => {
    test("Given hierarch, returns empty set", () => {
      expect(family.ancestors(GRANDPARENT)).toStrictEqual(new Set());
    });

    test("Returns undefined for non-member", () => {
      expect(family.ancestors("missing")).toBeUndefined();
    });

    test("Given node, returns node ancestors", () => {
      expect(family.ancestors(CHILD)).toStrictEqual(
        new Set([GRANDPARENT, PARENT])
      );
    });

    test("When depth is 1, returns node parents", () => {
      expect(family.ancestors(CHILD, 1)).toStrictEqual(new Set([PARENT]));
    });
  });

  describe(".parents()", () => {
    test("Given top-level node, returns nothing", () => {
      expect(family.ancestors(GRANDPARENT)).toStrictEqual(new Set());
    });

    test("Given child, returns its parents", () => {
      expect(family.ancestors(CHILD, 1)).toStrictEqual(new Set([PARENT]));
    });

    test("Returns undefined for non-member", () => {
      expect(family.ancestors("missing")).toBeUndefined();
    });
  });

  describe(".detach()", () => {
    test("Parent no longer has detached child", () => {
      family.remove(CHILD, PARENT);
      expect(family.descendants(PARENT, 1)?.has(CHILD)).toStrictEqual(false);
    });

    test("Detached child still belongs to another parent", () => {
      family.add("parent2");
      family.add(CHILD, "parent2");
      family.remove(CHILD, PARENT);
      expect(family.descendants("parent2", 1)?.has(CHILD)).toStrictEqual(true);
    });

    test("Child detached from the only parent still belongs to the hierarchy", () => {
      family.remove(CHILD, PARENT);
      expect(family.nodes().has(CHILD)).toStrictEqual(true);
    });
  });

  describe(".delete()", function () {
    test("Detaches all children from the parent", () => {
      family.delete(PARENT);
      expect(family.ancestors(CHILD)).toEqual(new Set([]));
    });

    test("Detaches child from all parents", () => {
      family.delete(PARENT);
      expect(family.descendants(GRANDPARENT)?.has(PARENT)).toStrictEqual(false);
    });

    test("Hierarchy no longer has removed node", () => {
      family.delete(PARENT);
      expect(family.nodes().has(PARENT)).toStrictEqual(false);
    });

    test("Removing the only node of the hierarchy empties the hierarchy", () => {
      const hierarchy = new OverlappingHierarchy<string>();
      hierarchy.add("orphan");
      hierarchy.delete("orphan");
      expect(hierarchy.nodes()).toStrictEqual(new Set());
    });
  });
});
