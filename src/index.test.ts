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
    family.attach(GRANDPARENT);
    family.attach(PARENT, GRANDPARENT);
    family.attach(CHILD, PARENT);
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
        expect(clone.parents(node)).toStrictEqual(family.parents(node));
      }
    });

    test("Restructuring a clone keeps the source structure intact", () => {
      const originalNodes = family.nodes();
      for (const node of clone.nodes()) {
        clone.delete(node);
      }
      clone.attach("New Child");
      clone.attach( "New Parent", "New Child",);
      expect(originalNodes).toStrictEqual(family.nodes());
    });
  });

  describe(".children()", () => {
    test("Without argument, returns hierarchs", () => {
      expect(family.children()).toStrictEqual(new Set([GRANDPARENT]));
    });

    test("When parent is undefined, returns hierarchs", () => {
      expect(family.children(undefined)).toStrictEqual(new Set([GRANDPARENT]));
    });

    test("When parent does not exist, returns undefined", () => {
      expect(family.children("missing")).toBeUndefined();
    });

    test("When parent exists, returns children", () => {
      expect(family.children(PARENT)).toStrictEqual(new Set([CHILD]));
    });

    test("Mutating returned set does not affect hierarchy", () => {
      const children = family.children(PARENT);
      children?.clear();
      expect(family.children(PARENT)?.has(CHILD)).toStrictEqual(true);
    });
  });

  describe(".attach()", () => {
    describe("hierarch", () => {
      // todo: make parent second optional argument
      test("Adds string node", () => {
        family.attach("relative");
        expect(family.nodes().has("relative")).toStrictEqual(true);
      });

      test("Adds null node", () => {
        const hierarchy = new OverlappingHierarchy<null>();
        hierarchy.attach( null);
        expect(hierarchy.nodes()).toStrictEqual(new Set([null]));
      });

      test("Adds object node", () => {
        const hierarchy = new OverlappingHierarchy<object>();
        hierarchy.attach( {});
        expect(hierarchy.nodes()).toStrictEqual(new Set([{}]));
      });

      test("Adding existing node does not change hierarchy", () => {
        const originalNodes = family.nodes();
        family.attach(CHILD);
        expect(originalNodes).toStrictEqual(family.nodes());
      });
    });

    describe("child", () => {
      test("Attaching node to itself returns LoopError", () => {
        expect(family.attach(CHILD, CHILD)).toStrictEqual(
          new LoopError("Cannot attach node to itself")
        );
      });

      test("Attaching ancestor as a child returns CycleError", () => {
        expect(family.attach( GRANDPARENT, CHILD,)).toStrictEqual(
          new CycleError("Cannot attach ancestor as a child")
        );
      });

      test("Attaching non-child descendant as a child returns TransitiveReductionError", () => {
        expect(family.attach(CHILD, GRANDPARENT)).toStrictEqual(
          new TransitiveReductionError(
            `Cannot attach non-child descendant as a child`
          )
        );
      });

      test("Attaching bottom of the diamond to the top returns TransitiveReductionError", () => {
        family.attach( "p2");
        family.attach("p2", GRANDPARENT);
        family.attach(CHILD, "p2");
        expect(family.attach(CHILD, GRANDPARENT)).toStrictEqual(
          new TransitiveReductionError(
            `Cannot attach non-child descendant as a child`
          )
        );
      });

      test("Attaching another ancestor of a child returns TransitiveReductionError", () => {
        family.attach( "p2");
        family.attach(CHILD,"p2");
        expect(family.attach("p2", PARENT)).toStrictEqual(
          new TransitiveReductionError(
            `Cannot attach child whose descendant is a child of the parent`
          )
        );
      });

      test("Attaches node to the parent as a child", () => {
        family.attach("grandchild", CHILD);
        expect(family.children(CHILD)).toStrictEqual(new Set(["grandchild"]));
      });

      test("Attaching the same child again does not return error", () => {
        family.attach("grandchild", CHILD);
        expect(family.attach("grandchild",CHILD)).toBeUndefined();
      });

      test("Attaching node to a non-existing parent also adds parent", () => {
        family.attach(CHILD, "missing");
        expect(family.nodes()?.has("missing")).toStrictEqual(true);
      });

      test("Attaches node to another parent as a child", () => {
        family.attach("another parent",GRANDPARENT);
        family.attach(CHILD,"another parent");
        expect(family.children("another parent")?.has(CHILD)).toStrictEqual(
          true
        );
      });

      test("Attached child has a parent", () => {
        const GREAT_GRANDPARENT = "great-grandparent";
        family.attach( GREAT_GRANDPARENT);
        family.attach(GRANDPARENT,GREAT_GRANDPARENT);
        expect(family.parents(GRANDPARENT)).toStrictEqual(
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
    test("Returns descendants", () => {
      expect(family.descendants(GRANDPARENT)).toStrictEqual(
        new Set([PARENT, CHILD])
      );
    });

    test("Returns undefined for non-member", () => {
      expect(family.descendants("missing")).toBeUndefined();
    });
  });

  describe(".ancestors()", () => {
    test("Returns ancestors", () => {
      expect(family.ancestors(CHILD)).toStrictEqual(
        new Set([GRANDPARENT, PARENT])
      );
    });

    test("Returns undefined for non-member", () => {
      expect(family.ancestors("missing")).toBeUndefined();
    });
  });

  describe(".parents()", () => {
    test("Given top-level node, returns nothing", () => {
      expect(family.parents(GRANDPARENT)).toStrictEqual(new Set());
    });

    test("Given child, returns its parents", () => {
      expect(family.parents(CHILD)).toStrictEqual(new Set([PARENT]));
    });

    test("Returns undefined for non-member", () => {
      expect(family.parents("missing")).toBeUndefined();
    });
  });

  describe(".detach()", () => {
    test("Parent no longer has detached child", () => {
      family.detach(CHILD, PARENT);
      expect(family.children(PARENT)?.has(CHILD)).toStrictEqual(false);
    });

    test("Detached child still belongs to another parent", () => {
      family.attach( "parent2");
      family.attach(CHILD, "parent2");
      family.detach(CHILD, PARENT);
      expect(family.children("parent2")?.has(CHILD)).toStrictEqual(true);
    });

    test("Child detached from the only parent still belongs to the hierarchy", () => {
      family.detach(CHILD, PARENT);
      expect(family.nodes().has(CHILD)).toStrictEqual(true);
    });
  });

  describe(".delete()", function () {
    test("Detaches all children from the parent", () => {
      family.delete(PARENT);
      expect(family.parents(CHILD)).toEqual(new Set([]));
    });

    test("Detaches child from all parents", () => {
      family.delete(PARENT);
      expect(family.children(GRANDPARENT)?.has(PARENT)).toStrictEqual(false);
    });

    test("Hierarchy no longer has removed node", () => {
      family.delete(PARENT);
      expect(family.nodes().has(PARENT)).toStrictEqual(false);
    });

    test("Removing the only node of the hierarchy empties the hierarchy", () => {
      const hierarchy = new OverlappingHierarchy<string>();
      hierarchy.attach( "orphan");
      hierarchy.delete("orphan");
      expect(hierarchy.nodes()).toStrictEqual(new Set());
    });
  });
});
