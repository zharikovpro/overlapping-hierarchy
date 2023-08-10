# Overlapping hierarchy

Library for modeling [overlapping hierarchy](https://en.wikipedia.org/wiki/Hierarchy#Degree_of_branching), in which nodes can have multiple parents.

Equivalent of [transitively reduced](https://en.wikipedia.org/wiki/Transitive_reduction) [directed acyclic graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph), in which edges represent parenthood.

## Example

```text
A  B F  G
 \ | | /
   C H
 / | | \
D  E I  J
```

```typescript
const hierarchy = new OverlappingHierarchy()
hierarchy.add('A')
hierarchy.add('B')
hierarchy.attach('A', 'C')
hierarchy.attach('B', 'C')
hierarchy.attach('C', 'D')
hierarchy.attach('C', 'E')
hierarchy.add('F')
hierarchy.add('G')
hierarchy.attach('F', 'H')
hierarchy.attach('G', 'H')
hierarchy.attach('H', 'I')
hierarchy.attach('H', 'J')
```

## API

### Initialization

`const empty = new OverlappingHierarchy()`

`const cloned = new OverlappingHierarchy(source)`

### Mutation

`hierarchy.add(node)`

`hierarchy.attach(parent, child)`

`hierarchy.detach(parent, child)`

`hierarchy.remove(node)`

### Traversal

`hierarchy.nodes()`

`hierarchy.hierarchs()`

`hierarchy.children(parent)`

`hierarchy.parents(child)`

`hierarchy.descendants(ancestor)`

`hierarchy.ancestors(descendant)`

### Errors

### LoopError

```typescript
hierarchy.attach('A', 'A') // LoopError: Cannot add node to itself
```

### CycleError

```typescript
hierarchy.attach('D', 'A') // CycleError: Cannot add ancestor as a child
```

### ConflictingParentsError

```typescript
hierarchy.attach('A', 'D') // ConflictingParentsError: Cannot attach child to parent's ancestor
```
