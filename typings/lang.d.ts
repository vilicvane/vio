/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />

interface HashTable<Value> {
    [key: string]: Value;
}

interface HOP {
    call(object: any, key: string): boolean;
}
