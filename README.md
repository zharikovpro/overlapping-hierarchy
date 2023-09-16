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
hierarchy.add('A', 'C')
hierarchy.add('B', 'C')
hierarchy.add('C', 'D')
hierarchy.add('C', 'E')
hierarchy.add('F')
hierarchy.add('G')
hierarchy.add('F', 'H')
hierarchy.add('G', 'H')
hierarchy.add('H', 'I')
hierarchy.add('H', 'J')
```

## API

### Initialize

`const empty = new OverlappingHierarchy()`

`const clone = new OverlappingHierarchy(source)`

### Mutate

`hierarchy.add(node) // hierarch`

`hierarchy.add(node, parent) // child`

`hierarchy.remove(node, parent)`

`hierarchy.delete(node)`

### Traverse

`hierarchy.descendants() // all nodes`

`hierarchy.descendants(node) // descendants`

`hierarchy.descendants(node, 1) // children`

`hierarchy.descendants(undefined, 1) // hierarchs`

`hierarchy.ancestors(node) // ancestors`

`hierarchy.ancestors(node, 1) // parents`

### Errors

#### LoopError

```typescript
hierarchy.add('A', 'A') // LoopError: Cannot add node to itself
```

#### CycleError

```typescript
hierarchy.add('D', 'A') // CycleError: Cannot add ancestor as a child
```

#### TransitiveReductionError

```typescript
hierarchy.add('A', 'D') // TransitiveReductionError: Cannot attach non-child descendant as a child
hierarchy.add('A', 'B') // TransitiveReductionError: Cannot attach child whose descendant is a child of the parent
```
