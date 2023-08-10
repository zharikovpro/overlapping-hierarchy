import OverlappingHierarchy, {
  CycleError,
  LoopError,
  ConflictingParentsError,
} from "./index";

const CHILD = "child";
const PARENT = "parent";
const GRANDPARENT = "grandparent";

describe("OverlappingHierarchy", () => {
  let family: OverlappingHierarchy<string>;

  beforeEach(() => {
    family = new OverlappingHierarchy();
    family.add(GRANDPARENT);
    family.attachChild(GRANDPARENT, PARENT);
    family.attachChild(PARENT, CHILD);
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
        clone.remove(node);
      }
      clone.add("New Child");
      clone.attachChild("New Child", "New Parent");
      expect(originalNodes).toStrictEqual(family.nodes());
    });
  });

  describe(".children()", () => {
    test("Returns children", () => {
      expect(family.children(PARENT)).toStrictEqual(new Set([CHILD]));
    });

    test("When parent does not exist, returns undefined", () => {
      expect(family.children("missing")).toBeUndefined();
    });

    test("Mutating returned set does not affect hierarchy", () => {
      const children = family.children(PARENT);
      children?.clear();
      expect(family.children(PARENT)?.has(CHILD)).toStrictEqual(true);
    });
  });

  describe(".add()", () => {
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

  describe(".attachChild()", () => {
    test("Attaching node to itself returns LoopError", () => {
      expect(family.attachChild(CHILD, CHILD)).toStrictEqual(
        new LoopError("Cannot attach node to itself")
      );
    });

    test("Attaching ancestor as a child returns CycleError", () => {
      expect(family.attachChild(CHILD, GRANDPARENT)).toStrictEqual(
        new CycleError("Cannot attach ancestor as a child")
      );
    });

    test("Attaching non-child descendant as a child returns ConflictingParentsError", () => {
      expect(family.attachChild(GRANDPARENT, CHILD)).toStrictEqual(
        new ConflictingParentsError(`Cannot attach child to parent's ancestor`)
      );
    });

    test("Attaches node to the parent as a child", () => {
      family.attachChild(CHILD, "grandchild");
      expect(family.children(CHILD)).toStrictEqual(new Set(["grandchild"]));
    });

    test("Attaching node to a non-existing parent also adds parent", () => {
      family.attachChild("missing", CHILD);
      expect(family.nodes()?.has("missing")).toStrictEqual(true);
    });

    test("Attaches node to another parent as a child", () => {
      family.attachChild(GRANDPARENT, "another parent");
      family.attachChild("another parent", CHILD);
      expect(family.children("another parent")?.has(CHILD)).toStrictEqual(true);
    });

    test("Attached child has a parent", () => {
      const GREAT_GRANDPARENT = "great-grandparent";
      family.add(GREAT_GRANDPARENT);
      family.attachChild(GREAT_GRANDPARENT, GRANDPARENT);
      expect(family.parents(GRANDPARENT)).toStrictEqual(
        new Set([GREAT_GRANDPARENT])
      );
    });
  });

  describe(".nodes()", () => {
    test("Returns all nodes", () => {
      expect(family.nodes()).toStrictEqual(
        new Set([GRANDPARENT, PARENT, CHILD])
      );
    });
  });

  describe(".hierarchs()", () => {
    test("Returns all hierarchs", () => {
      expect(family.hierarchs()).toStrictEqual(new Set([GRANDPARENT]));
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

  describe(".detachChild()", () => {
    test("Parent no longer has detached child", () => {
      family.detachChild(PARENT, CHILD);
      expect(family.children(PARENT)?.has(CHILD)).toStrictEqual(false);
    });

    test("Detached child still belongs to another parent", () => {
      family.add("parent2");
      family.attachChild("parent2", CHILD);
      family.detachChild(PARENT, CHILD);
      expect(family.children("parent2")?.has(CHILD)).toStrictEqual(true);
    });

    test("Child detached from the only parent still belongs to the hierarchy", () => {
      family.detachChild(PARENT, CHILD);
      expect(family.nodes().has(CHILD)).toStrictEqual(true);
    });
  });

  describe(".remove()", function () {
    test("Detaches all children from the parent", () => {
      family.remove(PARENT);
      expect(family.parents(CHILD)).toEqual(new Set([]));
    });

    test("Detaches child from all parents", () => {
      family.remove(PARENT);
      expect(family.children(GRANDPARENT)?.has(PARENT)).toStrictEqual(false);
    });

    test("Hierarchy no longer has removed node", () => {
      family.remove(PARENT);
      expect(family.nodes().has(PARENT)).toStrictEqual(false);
    });

    test("Removing the only node of the hierarchy empties the hierarchy", () => {
      const hierarchy = new OverlappingHierarchy<string>();
      hierarchy.add("orphan");
      hierarchy.remove("orphan");
      expect(hierarchy.nodes()).toStrictEqual(new Set());
    });
  });
});