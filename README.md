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
hierarchy.add(undefined, 'A')
hierarchy.add(undefined, 'B')
hierarchy.add('A', 'C')
hierarchy.add('B', 'C')
hierarchy.add('C', 'D')
hierarchy.add('C', 'E')
hierarchy.add(undefined, 'F')
hierarchy.add(undefined, 'G')
hierarchy.add('F', 'H')
hierarchy.add('G', 'H')
hierarchy.add('H', 'I')
hierarchy.add('H', 'J')
```

## API

### Initialization

`const empty = new OverlappingHierarchy()`

`const clone = new OverlappingHierarchy(source)`

### Mutation

`hierarchy.add(node, parent)`

`hierarchy.remove(node, parent)`

`hierarchy.delete(node)`

### Traversal

`hierarchy.nodes()`

`hierarchy.descendants(node)`

`hierarchy.ancestors(node)`

`hierarchy.children(node)`

`hierarchy.parents(node)`

### Errors

### LoopError

```typescript
hierarchy.add('A', 'A') // LoopError: Cannot add node to itself
```

### CycleError

```typescript
hierarchy.add('D', 'A') // CycleError: Cannot add ancestor as a child
```

### TransitiveReductionError

```typescript
hierarchy.add('A', 'D') // TransitiveReductionError: Cannot attach non-child descendant as a child
hierarchy.add('A', 'B') // TransitiveReductionError: Cannot attach child whose descendant is a child of the parent
```
