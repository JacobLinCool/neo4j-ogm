# typed-cypher

Typed Cypher is a TypeScript library for analyzing Cypher query in the compile-time type system.

## Features

- [x] Parse parameters from a Cypher query
- [x] Parse living variables in a Cypher query
- [x] Parse return types from a Cypher query

## Usage

### Parse parameters from a Cypher query

```ts
import { Params } from "typed-cypher";

type Q = "MATCH (n:Person {name: $name})-[:ACTED_IN]->(m:Movie {title: $title}) RETURN n.`$id`, m";

type P = Params<Q>;
//   ^? type P = { name: unknown; title: unknown; }
```

### Parse living variables in a Cypher query

It now supports `MATCH`, `MERGE`, `CREATE`, `WITH`, and `RETURN` clauses.

```ts
import { Vars } from "typed-cypher";

type Q = "PROFILE MATCH (person:Person)-[r]->(other:Person:Public {prop: 123}) WITH *, r AS x, type(r) AS types RETURN *";

type V = Vars<Q>;
//   ^? type V = {
//          person: Node;
//          other: Node;
//          r: Relationship;
//          x: Relationship;
//          types: Unknown;
//      }
```

### Parse return types from a Cypher query

`Returns` is just a type alias of `Vars`, so it supports the same clauses.

The only difference is that it will escape the **`** in keys.

```ts
import { Returns } from "typed-cypher";

type Q = "MATCH (n:Person {name: $name})-[:ACTED_IN]->(m:Movie {title: $title}) RETURN n.`$id`, m";

type R = Returns<Q>;
//   ^? type R = { "n.$id": unknown; m: Node; }
```
