---
"neo4j-ogm": major
---

First release

Define models and relationships:

```ts
const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

const db = new DB(driver)
    .define("User", {
        name: String(),
        email: String(),
        FOLLOWS: MANY("User", { since: new Date() }),
        POSTS: MANY("Post", { at: new Date() }),
        LIKES: MANY("Post", { at: new Date() }),
    })
    .define("Post", {
        title: String(),
        content: String(),
        INCLUDES: MANY("Media"),
    })
    .define("Media", {
        url: String(),
        type: String(),
        size: BigInt(0),
        UPLOADED_BY: ONE("User"),
    });
```

Create nodes:

```ts
const jacob = await db.add("User", {
    name: "Jacob",
    email: "hi@jacoblin.cool",
});

jacob.name; // "Jacob"
jacob.email; // "hi@jacoblin.cool"

const post = await db.add("Post", {
    title: "Hello World",
    content: "This is my first post!",
});

post.title; // "Hello World"
post.content; // "This is my first post!"
```

Create relationships:

```ts
const rel = await jacob.POSTS(post, { at: new Date() });

rel.$from(); // jacob
rel.$to(); // post
rel.at; // Date
```

Get relationships:

```ts
const posts = await jacob.POSTS();

(await posts[0].$to()).title; // "Hello World"
```
