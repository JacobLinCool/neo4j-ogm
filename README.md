# Neo4j OGM & Typed Cypher

_Neo4j OGM for TypeScript / JavaScript_ & _Cypher Query Analyzer for TypeScript_

<!-- ## Features

- [ ] Create Node
- [ ] Find Node
- [ ] Update Node
- [ ] Delete Node
- [ ] Create Relationship
- [ ] Find Relationship
- [ ] Update Relationship
- [ ] Delete Relationship
- [ ] Create Index
- [ ] Create Constraint

## Usage

`db.define`: Build meta graph models (node, relationship, index, constraint).

`db.verify`: Check if the current meta graph in the database is capable with the application defined models.

`db.create`: Create nodes. _It will not auto sync with the database by default, use `.$push()` to sync it._

It returns _Unsynced_ **Solid** nodes.

`db.find`: Find nodes that already exist in the database and match the query.

It returns _Unsynced_ **Virtual** nodes.

`db.count`: Count nodes that already exist in the database and match the query.

> It can be useful if you want to check if a node exists in the database.

## About Nodes

There are two types of nodes: **Solid** and **Virtual**.

**Solid** nodes are nodes with _id_, _labels_ and _properties_.

**Virtual** nodes are nodes with nothing, they are just a placeholder for futher operations.

## Examples

### Get posts with comments from friends

```ts
const posts = await db.query("MATCH (me:User {id: $id})-[:FRIEND]->(friend:User)-[:POST]->(post:Post)<-[:COMMENT]-(comment:Comment) RETURN post, comment", { id: 1 });
``` -->
