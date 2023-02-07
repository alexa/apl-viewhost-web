/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as ts from "typescript";
import { Compiler, compilation } from "webpack";
import fs = require('fs');
import path = require('path');
import mkdirp = require('mkdirp');

export interface Require {
    resolve: (name: string) => string;
}

export interface Options {
    require: Require;
}

interface External {
    name: string;
    entry: string;
}

interface SourceFile {
    source: string;
    path: string;
}

class NodeModule {
    private sources: Map<string, SourceFile> = new Map();
    /** Base path to this package */
    private path: string;
    private typesPath: string;
    public relativeTypesPath: string;
    private importsToLoad:Set<string> = new Set();
    private static printer = ts.createPrinter();

    constructor(private name: string, private modules: NodeModules, public isMain: boolean) {}

    init(): boolean {
        const packageJsonPath = this.modules.require.resolve(`${this.name}/package.json`);   
        this.path = path.resolve(packageJsonPath, '..');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        this.relativeTypesPath = packageJson.types || packageJson.typings
        if(!this.relativeTypesPath) {
            console.warn(`package "${this.name}" must have a "types" in its package.json`);
            return false;
        }
        this.typesPath = path.resolve(this.path, this.relativeTypesPath);
        // add the typings entry point
        this.addSource(this.typesPath);

        const program = ts.createProgram([this.typesPath], {});
        const sources = program.getSourceFiles();
        for(const source of sources) {
            const nmp = path.join(this.path, 'node_modules');
            if(!this.sources.has(source.fileName) && //we haven't traversed to this file
                source.fileName.indexOf(this.path) === 0 &&  //this file is in this modules
                source.fileName.indexOf(nmp) !== 0) { //but not in this module's node_modules
                //then it's a triple slash or @types reference
                NodeModule.printer.printFile(source);
                this.addSource(source.fileName);
            }
        }

        return true;
    }

    addSource(filePath: string) {
        // add the typings entry point
        if(this.sources.has(filePath) || this.importsToLoad.has(filePath)) {
            return;
        }
        this.importsToLoad.add(filePath)
        while(this.importsToLoad.size > 0) {
            filePath = Array.from(this.importsToLoad)[0];
            const source = fs.readFileSync(filePath, 'utf8');
            this.sources.set(filePath, {source, path: filePath});
            this.importsToLoad.delete(filePath);
            const fileName = path.parse(filePath).name;
            const sourceFile = this.getSourceFile(fileName, source);
            this.getImports(filePath, sourceFile);
        }
    }

    getSourceFile(fileName: string, source: string): ts.SourceFile {
        return ts.createSourceFile(
            fileName, source, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS
        );
    }

    getImports = (filePath: string, node: ts.Node) => {
        switch(node.kind) {
            case ts.SyntaxKind.StringLiteral: {
                const lit = node as ts.StringLiteral;
                if(lit.parent &&  
                    (lit.parent.kind === ts.SyntaxKind.ImportDeclaration || 
                    lit.parent.kind === ts.SyntaxKind.ExportDeclaration ||
                    lit.parent.kind === ts.SyntaxKind.ExternalModuleReference)) {
                    if(lit.text.indexOf('.') === 0) {
                        const importPath = path.resolve(filePath, '..', `${lit.text}.d.ts`);
                        if(!this.importsToLoad.has(importPath) && !this.sources.has(importPath)) {
                            this.importsToLoad.add(importPath);
                        }
                    }
                    else {
                        this.modules.addModule(lit.text);
                    }
                }
            }
        }
        ts.forEachChild(node, this.getImports.bind(this, filePath));
    }

    transformer = (context: ts.TransformationContext) => (rootNode: ts.SourceFile) => {

        const visit = (node: ts.Node): ts.Node => {
            node = ts.visitEachChild(node, visit, context);
            switch(node.kind) {
                case ts.SyntaxKind.StringLiteral: {
                    const lit = node as ts.StringLiteral;
                    if(lit.text === 'apl-html' && rootNode.fileName.indexOf('APLContext') >= 0) {
                        debugger;
                    }
                    const mod = this.modules.getModule(lit.text);
                    if(mod && lit.parent && 
                        (lit.parent.kind === ts.SyntaxKind.ImportDeclaration || 
                            lit.parent.kind === ts.SyntaxKind.ExportDeclaration ||
                            lit.parent.kind === ts.SyntaxKind.ExternalModuleReference)) {
                        let pathToImport: string;
                        const fileFolder = path.join(rootNode.fileName, '..');
                        if(this.isMain) {
                            const relativeToOutputPath = path.relative(fileFolder, this.modules.outputPath);
                            pathToImport = './' + path.join(relativeToOutputPath, '@types', lit.text, mod.relativeTypesPath);
                        }
                        else {
                            pathToImport = './' + path.relative(
                                fileFolder, 
                                path.join(this.modules.outputPath, '@types', lit.text, mod.relativeTypesPath));
                        }
                        return ts.createLiteral(pathToImport.substring(0, pathToImport.length - 5));
                    }
                    break;
                }
            }
            return node;
        }
        return ts.visitNode(rootNode, visit);
    }

    transform() {
        //first transform all the paths
        for(let [unused, source] of this.sources) {
            if(!this.isMain) {
                //put the path in the @types folder
                const relativePath = path.relative(this.path, source.path);
                source.path = path.join(this.modules.outputPath, '@types', this.name, relativePath)
            }
        }
        // then transforms the source
        for(let [unused, source] of this.sources) {
            const sourceFile = this.getSourceFile(source.path, source.source)
            const result: ts.TransformationResult<ts.SourceFile> = ts.transform<ts.SourceFile>(
                sourceFile, [ this.transformer ]
            );
            const transformedSourceFile: ts.SourceFile = result.transformed[0];
            source.source = NodeModule.printer.printFile(transformedSourceFile);
        }
        // now write the source
        for(let [unused, source] of this.sources) {
            const toDir = path.resolve(source.path, '..');
            mkdirp.sync(toDir)
            fs.writeFileSync(source.path, source.source, 'utf8');
        }
    }
}

class NodeModules {
    private modules:Map<string, NodeModule> = new Map();
    constructor(public require: Require, public outputPath: string) {

    }

    addModule(name: string, isMain: boolean = false) {
        if(!this.modules.has(name)) {
            console.log(`Creating module "${name}"`)
            const m = new NodeModule(name, this, isMain);
            if(m.init()) {
                this.modules.set(name, m);
            }
        }
    }

    hasModule(name: string) {
        return this.modules.has(name);
    }

    getModule(name: string) {
        return this.modules.get(name);
    }

    transformAll() {
        for(let [name, m] of this.modules) {
            m.transform();
        }
    }
}

export default class DtsPackerPlugin {
    private printer: ts.Printer;
    private externals: Map<string, External> = new Map();
    private compiler: Compiler;
    private files:{source:string, path:string}[] = [];

    constructor(private options: Options) {
    }

    apply(compiler: Compiler) {
        this.compiler = compiler;
        compiler.plugin('done', () => {
            const name = path.basename(compiler.context);
            const m = new NodeModules(this.options.require, compiler.outputPath);
            m.addModule('@amzn/'+name, true);
            m.transformAll();
        });
    }
}
