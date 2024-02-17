//@ts-ignore
import * as Bun from 'bun';
enum ErrorCodes{
    NO_COLLECTION_NAME_PROVIDED = 400,
    NO_COLLECTION_FOUND = 404,
    NO_QUERY_PROVIDED = 400,
    NO_RESULTS_FOUND = 404,
    DUPLICATE_ENTRY = 400,
    DUPLICATE_ENTRIES = 400

}
enum ErrorMessages{
    NO_COLLECTION_NAME_PROVIDED = "No Collection Name Provided",
    NO_COLLECTION_FOUND = "No Collection Found",
    NO_QUERY_PROVIDED = "No Query Provided",
    NO_RESULTS_FOUND = "No Results Found",
    DUPLICATE_ENTRY = "Duplicate Entry",
    DUPLICATE_ENTRIES = "Duplicate Entries"

}
class Serve{
    port:number;
    config:Object;
    serverInstance:any;
    constructor(options:{port:number, config:Object}){
        this.port = options.port;
        this.config = options.config;
        this.serverInstance = null;
    }

    start(){
        let scope = this;
        this.serverInstance = Bun.serve({
            port: this.port,
            async fetch(req,res){
                let url = new URL(req.url);
                if(url.pathname === '/'){
                    return new Response(JSON.stringify({message: "All Systems Go"}), {
                        headers: {
                            'content-type': 'application/json'
                        }
                    });
                }

                switch(true){
                    case url.pathname.includes('/api/'):
                        let isSearchingCollection  = url.pathname.split('/api/')[1].split('/')[0] === 'collection'; 
                        if(isSearchingCollection){
                              let hasName = url.pathname.split('/api/collection/')[1]  !== '';
                            if(!hasName){
                                return new Response(JSON.stringify({message:  ErrorMessages.NO_COLLECTION_NAME_PROVIDED, code: ErrorCodes.NO_COLLECTION_NAME_PROVIDED}), {
                                    status: 400,
                                    headers: {
                                        'content-type': 'application/json'
                                    }
                                })
                            } 
                            let collectionName = url.pathname.split('/api/collection/')[1]; 
                            let collection = scope.config['collections'].find((collection:any) => {
                                return collection.collectionName === collectionName;
                            });
                            if(collection === undefined){
                                return new Response(JSON.stringify({message: ErrorMessages.NO_COLLECTION_FOUND, code: ErrorCodes.NO_COLLECTION_FOUND}), {
                                    status: 404,
                                    headers: {
                                        'content-type': 'application/json'
                                    }
                                })
                            }
                            
                            if(req.method === 'POST'){
                                let body =  await req.json();
                                let method = body.method;
                                let query = body.query;
                                 switch(method){
                                    case 'getOne': 
                                        let result = collection.getOne(query); 
                                        return new Response(result === null ? JSON.stringify({message: ErrorMessages.NO_RESULTS_FOUND, code: ErrorCodes.NO_RESULTS_FOUND}) : JSON.stringify(result), {
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        })
                                    case 'getAll':
                                        let results = collection.getAll();
                                        return new Response(JSON.stringify(results), {
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        })


                                    case 'update':
                                        if(!query.id || !query.data) return new Response(JSON.stringify({message: ErrorMessages.NO_QUERY_PROVIDED, code: ErrorCodes.NO_QUERY_PROVIDED}), {
                                            status: 400,
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        });
                                        let updated = collection.update(query.id, query.data); 
                                        return new Response(JSON.stringify(updated.getOne(query.data)), {
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        })
                                  
                                    case 'insertMany': 
                                        let shouldReturn = false;
                                        query.forEach((item) => {   
                                            if(collection.includes(item))  shouldReturn = true;
                                        })
                                        if(shouldReturn) return new Response(JSON.stringify({ message: ErrorMessages.DUPLICATE_ENTRIES, code: ErrorCodes.DUPLICATE_ENTRIES}), {
                                            status: 400,
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        });
                                        let createdMany = collection.insertMany(query, scope.config['dissalowDupes'] || false, scope.config['dissalowDupes'] || JSON.stringify({}));
                                        return new Response(JSON.stringify(createdMany), {
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        })
                                    case 'find':
                                        let found = collection.getOne(query);
                                        return new Response(JSON.stringify(found), {
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        })

                                    case 'insertOne':
                                        console.log(collection.includes(query), query);
                                        if(collection.includes(query)) return new Response(JSON.stringify({message: ErrorMessages.DUPLICATE_ENTRY, code: ErrorCodes.DUPLICATE_ENTRY}), {
                                            status: 400,
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        });
                                        
                                    case 'findMany':
                                        let foundMany = collection.matchAll(query);
                                        return new Response(JSON.stringify(foundMany), {
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        })
                                    case 'deleteOne':
                                        let deleted = collection.deleteOne(query);
                                        return new Response(JSON.stringify(deleted), {
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        })

                                    default:
                                        return new Response(JSON.stringify({message: "Invalid Method", code: 400}), {
                                            status: 400,
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        })
                                 }

                                
                            }else if(req.method === 'GET'){
                                let query = url.searchParams.get('query') 
                                let method = url.searchParams.get('method');
                                let sort = url.searchParams.get('sort');
                                let collection = scope.config['collections'].filter((collection:any) => {
                                    return collection.collectionName === collectionName;
                                })[0]; 
                                let Obj = {};
                                switch(method){
                                    case 'getOne':  
                                        if(query === null) return new Response(JSON.stringify({message: ErrorMessages.NO_QUERY_PROVIDED, code: ErrorCodes.NO_QUERY_PROVIDED}), {
                                            status: 400,
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        }); 
                                        query?.split(',').forEach((item) => {
                                            let [key, value] = item.split(':');
                                            Obj[key] = value;
                                        }); 
                                        let result = collection.getOne(Obj);
                                        return new Response(result === null ? JSON.stringify({message: ErrorMessages.NO_RESULTS_FOUND, code: ErrorCodes.NO_RESULTS_FOUND}) : JSON.stringify(result), {
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        })
                                    case 'getAll': 
                                        let results = collection.getAll();
                                        return new Response(JSON.stringify(results), {
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        })
                                    case 'create': 
                                        return new Response(JSON.stringify({error: 'Use POST Method'}), {
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        })
                                    case 'createMany':  
                                        
                                        return new Response(JSON.stringify({error: 'Use POST Method'}), {
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        })
                                    case 'matchAll':
                                        Obj = {}; 
                                        query?.split(',').forEach((item) => {
                                            let [key, value] = item.split(':');
                                            value = value.replace(/%20/g, ' ');
                                            Obj[key] = value;
                                        }); 
                                       
                                        let matchAll = collection.matchAll(Obj);
                                        switch(sort){
                                            case 'asc':
                                                matchAll = matchAll.sort((a:any, b:any) => {
                                                    return a - b;
                                                
                                                });
                                                break;
                                            case 'desc':
                                                matchAll = matchAll.sort((a:any, b:any) => {
                                                    return b - a;
                                                });
                                                break;
                                            case '-created':
                                                matchAll = matchAll.sort((a:any, b:any) => {
                                                    return a.createdAt - b.createdAt;
                                                })
                                                break;
                                            case 'created':
                                                matchAll  = matchAll.sort((a:any, b:any) => {
                                                    return b.createdAt > a.createdAt;
                                                })
                                                break;
                                        }
                                        return new Response(JSON.stringify(!matchAll || matchAll.length < 1  ? {message: ErrorMessages.NO_RESULTS_FOUND, code: ErrorCodes.NO_RESULTS_FOUND} : matchAll), {
                                            headers: {
                                                'content-type': 'application/json'
                                            }
                                        })
                                    default: 
                                     collection = scope.config['collections'].filter((collection:any) => {
                                        return collection.collectionName === collectionName;
                                    })[0];
                                    let schema = collection.schema;
                                    Object.keys(schema).forEach((key) => {
                                         let type = schema[key];
                                        if(type?.name) {
                                            schema[key] = type.name;
                                        }

                                    });
                                    return new Response(JSON.stringify({
                                        collectionName: collection.collectionName,
                                        schema: schema
                                    }), {
                                        headers: {
                                            'content-type': 'application/json'
                                        }
                                    })
                                   
                                }

                                 
                            }
                            
                          
                        }
                }

             


            }
        })
    }

    stop(){
        this.serverInstance.close();
    }
}

export default Serve;
 
