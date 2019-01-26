var fs = require('fs');
var path = require('path');
var compiler = require('vue-template-compiler');
var htmlparser = require("htmlparser2");
const {parse} = require('@vue/component-compiler-utils');

module.exports = function (source, map) {
    var callback = this.async();
    resolveComponent(source, this).then((finalComponent) => {
        let finalDescriptor = toDescriptor(finalComponent);
        if(finalDescriptor.script){
            finalDescriptor.script.content = finalDescriptor.script.content.replace(/^(\/\/\n)+/, '')
        }

        if(finalDescriptor.template.attrs.extendable) {
            let finalDom = htmlparser.parseDOM(finalDescriptor.template.content);
            findDomElementsByTagName(finalDom, 'extension-point').forEach(ext => {
                ext.name = 'template';
                delete ext.attribs.name
            });
            finalComponent = `<template>${htmlparser.DomUtils.getOuterHTML(finalDom)}</template> ${descriptorToHTML(finalDescriptor)}`;
        }

        callback(null,
            finalComponent,
            map);
    }, error => console.error(error));
};

function resolveComponent(currentSource, context) {
    return new Promise((resolve, reject) => {
        try {
            let currentDesc = toDescriptor(currentSource);
            if (currentDesc.template.attrs.extends) {
                let baseAbsolutePath = path.join(context.context, currentDesc.template.attrs.extends);

                context.addDependency(baseAbsolutePath);

                fs.readFile(baseAbsolutePath, 'utf8', (err, contents) => {
                    resolveComponent(contents, context).then((resolvedComponent) => {
                        try {
                            let baseDescriptor = toDescriptor(resolvedComponent);
                            let baseDom = htmlparser.parseDOM(baseDescriptor.template.content);

                            let currentDom = htmlparser.parseDOM(currentDesc.template.content);
                            let extensions = currentDom.find(node => node.type = 'tag' && node.name === 'extensions').children
                                .filter(node => node.type = 'tag' && node.name === 'extension');
                            findDomElementsByTagName(baseDom, 'extension-point').forEach(extPoint => {
                                let extendingBlock = extensions.find(node => node.attribs.point === extPoint.attribs.name);

                                if (extendingBlock) {
                                    extPoint.children = extendingBlock.children;
                                }

                                // Change extension point tag to a template
                                extPoint.name = 'template';
                                delete extPoint.attribs.name;
                            });
                            resolve(`<template extendable>${htmlparser.DomUtils.getOuterHTML(baseDom)}</template> ${descriptorToHTML(currentDesc)}`);
                        } catch (e) {
                            reject(e)
                        }
                    });
                });
            } else {
                resolve(currentSource);
            }
        } catch (e) {
            reject(e)
        }
    })
}

function toDescriptor(source) {
    return parse({
        source: source,
        compiler,
        needMap: false
    });
}

function findDomElementsByTagName(dom, tag) {
    return htmlparser.DomUtils.findAll(node => (node.type === 'tag' && node.name === tag), dom)
}

function descriptorToHTML(descriptor) {
    return descriptor.customBlocks
            .filter(cb => cb.type !== 'extension')
            .map(cb => blockToHTML(cb))
            .join('\n') +
        blockToHTML(descriptor.script) +
        descriptor.styles
            .map(cb => blockToHTML(cb))
            .join('\n');
}

function blockToHTML(block) {
    if (block) {
        let attrToHtmlAttr = ([key, value]) => ` ${key}="${value}" `;
        let attrs = Object.entries(block.attrs).reduce((accum, curr) => accum + attrToHtmlAttr(curr), '');
        return `<${block.type} ${attrs}>${block.content}</${block.type}>`
    }
}