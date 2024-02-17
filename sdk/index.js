let sdk = class {
    constructor(options = {url: ""}){
        this.url = options.url;
    }

    collection(name) {
        let url = this.url +  "/api/collection/" + name; 
        return {
            async insertOne(query) {
                 await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({
                        method: "insertOne",
                        query
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                return this;
            },
            async insertMany(data) {
                data.forEach(d => {
                    this.insertOne(d);
                });
                return this;
            },
            async getAll() {
                const res = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({
                        method: "getAll"
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                return res.json();
            },
            async find(query) {
                const res = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({
                        method: "find",
                        query
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                return res.json();
            },
            deleteOne(query) {
                const res = fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({
                        method: "deleteOne",
                        query
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                return this;
            },
            async update(id, query) {
  
                const res = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({
                        method: "update",
                        query:{
                            id,
                            data: query
                        }
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                return res.json();
            },
            async findMany(query) {
                const res = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({
                        method: "findMany",
                        query
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                return res.json();
            },
        }
    }
  
}
export default sdk;
