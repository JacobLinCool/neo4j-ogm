---
"neo4j-ogm": major
---

Define models:

Use `zod` to define types.

```ts
const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

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

Create nodes:

```ts
const jacob = await db.create("User", {
    name: "Jacob",
    email: "hi@jacoblin.cool",
});

jacob.name; // "Jacob"
jacob.email; // "hi@jacoblin.cool"

const post = await db.create("Post", {
    title: "Hello World",
    content: "This is my first post!",
});

post.title; // "Hello World"
post.content; // "This is my first post!"
```

Create relationships:

```ts
const rel = await jacob.POSTS(post, { at: new Date() });

// rel.$from(); // jacob
// rel.$to(); // post
// rel.at; // Date
```

Get relationships:

```ts
const posts = await jacob.POSTS();

// (await posts[0].$to()).title; // "Hello World"
```
