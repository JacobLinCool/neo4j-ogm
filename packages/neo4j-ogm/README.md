# neo4j-ogm

Neo4j OGM for TypeScript / JavaScript

## Fetures

- [x] Type-safe query
- [ ] OGM

## Usage

### Define models

We use `zod` to define types.

```ts
// create a driver
const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

// create a DB instance
const db = new DB(driver)
    .define("User", {
        name: z.string(),
        email: z.string(),
        FOLLOWS: MANY("User", { since: z.date() }),
        POSTS: MANY("Post", { at: z.date() }),
        LIKES: MANY("Post", { at: z.date() }),
    })
    .define("Post", {
        title: z.string(),
        content: z.string(),
        INCLUDES: MANY("Media"),
    })
    .define("Media", {
        url: z.string(),
        type: z.string(),
        size: z.bigint(),
        UPLOADED_BY: ONE("User"),
    });
```

### Create nodes

```ts
const users = await db.create("User", [
    {
        name: "Jacob"
        email: "hi@jacoblin.cool",
    },
    {
        name: "Alice"
        email: "alice@jacoblin.cool",
    },
]);

// or if you only want to create one node
const [user] = await db.create("User", {
    name: "Jacob"
    email: "hi@jacoblin.cool",
});
```

### Create relationships

```ts
await jacob.FOLLOWS(alice, { since: new Date() });
```
