interface Dictionary<Value> {
    [key: string]: Value;
}

interface HOP {
    call(object: any, key: string): boolean;
}