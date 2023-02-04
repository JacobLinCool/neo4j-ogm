---
"neo4j-ogm": minor
---

Find nodes

Find all `User`:

```ts
const users = await db.find("User");
```

Find `User` by property:

```ts
const users = await db.find("User", {
    where: { name: "Jacob Lin" },
});
```

Sort the results:

```ts
const users = await db.find("User", {
    order: ["name", "ASC"],
});

// sort by multiple fields
const users = await db.find("User", {
    order: [
        ["name", "DESC"],
        ["email", "ASC"],
    ],
});
```

Limit the results:

```ts
const users = await db.find("User", {
    limit: 1,
});
```
