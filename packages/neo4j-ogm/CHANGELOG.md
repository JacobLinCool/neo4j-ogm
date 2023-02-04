# neo4j-ogm

## 1.0.0-dev.0

### Major Changes

-   [`8267937`](https://github.com/JacobLinCool/neo4j-ogm/commit/82679379d7e473ea405c3b207b31699e24e762eb) Thanks [@JacobLinCool](https://github.com/JacobLinCool)! - Define models:

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

### Minor Changes

-   [`8267937`](https://github.com/JacobLinCool/neo4j-ogm/commit/82679379d7e473ea405c3b207b31699e24e762eb) Thanks [@JacobLinCool](https://github.com/JacobLinCool)! - Support custom `$id` generator

-   [`8267937`](https://github.com/JacobLinCool/neo4j-ogm/commit/82679379d7e473ea405c3b207b31699e24e762eb) Thanks [@JacobLinCool](https://github.com/JacobLinCool)! - Find nodes

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

### Patch Changes

-   Updated dependencies [[`b771723`](https://github.com/JacobLinCool/neo4j-ogm/commit/b77172395627e93a8a3a32b54b4e670c49eae421)]:
    -   typed-cypher@1.0.0-dev.0
