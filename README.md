# PDB
Fast, simple, sqlite database 

```js
//pdb.config.ts
import pdb from "pdb";
export default {
    port: 3080, 
    collections:[
        pdb.collection('users', {
            name:  String,
            email:  String,
        }),
        pdb.collection('posts', {
            author: String,
            title: String,
            body: String,
        })
    ],
    dissalowDupes: true

}
```
```js
const collection =  pdb.collection('users', {
            name:  String,
            email:  String,
}),


let u1 = collection.insertOne({username:'hello world'})
```
