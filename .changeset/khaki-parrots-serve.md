---
"neo4j-ogm": minor
---

Update props of nodes and edges

Update node:

```ts
await jacob.$update({ name: "Jacob Lin" });
```

Update edge:

```ts
const follows_rel = await alice.FOLLOWS();
await follows_rel[0].$update({ since: new Date() });
```
