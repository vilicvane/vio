declare module 'module' {
    interface ExtensionResolver {
        (module: Module, filename: string): void;
    }
    
    class Module {
        constructor(filename: string, parent: Module);
        
        id: string;
        exports: any;
        filename: string;
        paths: string[];
        loaded: boolean;
        
        _compile(content: string, filename: string): void;
        load(filename: string): void;
        
        static _cache: HashTable<any>;
        static _extensions: HashTable<ExtensionResolver>;
        
        static _resolveFilename(request: string, parent: Module): string;
        static _nodeModulePaths(dirname: string): string[];
    }
    
    namespace Module { }
    
    export = Module;
}
