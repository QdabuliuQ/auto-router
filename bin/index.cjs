#! /usr/bin/env node
global.navigator={userAgent:"node.js"};var fs=require("node:fs"),path=require("node:path"),ora=require("ora"),lineReader=require("line-reader"),prettier=require("prettier");const rootPath=process.cwd();function getFilesInfo(e){let t=fs.readdirSync(e);const n={};return t.forEach((function(t){const o=path.join(e,t),r=fs.statSync(o);n[t]={type:r.isFile()?"file":"dict",path:`/${t}`.replace(/\\\\/g,"/"),name:t,names:[...e.replace(`${rootPath}\\src\\views`,"").replace(/\\/g,"/").split("/").filter(Boolean),t],fullPath:o},console.log(n[t].path,n[t].names,e.replace(`${rootPath}\\src\\views`,"").replace(/\\/g,"/"))})),n}function dataType(e){let t=Object.prototype.toString.call(e).split(" ")[1];return t.substring(0,t.length-1).toLowerCase()}const ignoreKeys=new Set(["import","webpackChunkName","path","name"]);function conveyFunction(e){for(const t in e)if(Object.prototype.hasOwnProperty.call(e,t)){if(ignoreKeys.has(t))continue;const n=dataType(e[t]);if("function"===n)try{let n=e[t].toString().match(/\{([\s\S]*)\}/);const o=n&&n[1]?n[1]:"";n=e[t].toString().match(/\(([^)]*)\) (\{|=>)/);const r=n&&n[1]?n[1]:"";e[t]=`$$$function(${r}) { ${o} } $$$`.replace(/\r\n/g,"\n")}catch(e){console.log(e)}else"object"===n&&conveyFunction(e[t])}}function importCode(e,t,n,o){return o?`$$$() => import( /* webpackChunkName: '${o}' */ '${n.importPrefix}/${e.length?e.join("/")+"/":""}${"<dictName>"===n.fileName?`${t}.vue`:"index"}.vue')$$$`:`$$$() => import('${n.importPrefix}/${e.length?e.join("/")+"/":""}${"<dictName>"===n.fileName?`${t}.vue`:"index"}.vue')$$$`}function getRouterConfig(content){const matches=[];let match;const reg=/<router>([\s\S]*?)<\/router>/g;for(;null!==(match=reg.exec(content));)matches.push(match[1]);if(matches.length){const params=matches.map((match=>eval(`(function(){return {${match}}})()`)));return params}return null}async function generateRouterConfig(e,t,n,o){let r=null;if(e){r=[];for(const i of e){conveyFunction(i);const e=i.webpackChunkName;i.webpackChunkName&&delete i.webpackChunkName,r.push({...t,...i,component:importCode(n.names,n.name,o,e).replace("\\","/")})}}return r}function isRegExp(e){return"[object RegExp]"===Object.prototype.toString.call(e)}const startRouterTarget=/<router>/,endRouterTarget=/<\/router>/;function fileReader(e){return new Promise((t=>{let n=!1;const o=[];lineReader.eachLine(e,(e=>{if(!n&&startRouterTarget.test(e)&&(n=!0),n&&endRouterTarget.test(e)&&(n=!1),!n&&(0===e.length||/<template>|<script[\s\S]*>|<style[\s\S]*>/.test(e)))return t(o.join("\n")),!1;o.push(e)}))}))}async function readFileContent(e,t){try{const n=await fileReader(`${e.fullPath}/${"<dictName>"===t.fileName?e.name:"index"}.vue`);return getRouterConfig(n)}catch(e){console.log(e,"error")}}async function readDictContent(e,t){const n=getFilesInfo(e.fullPath);if("{}"===JSON.stringify(n))return null;let o=null;if(n.hasOwnProperty("<dictName>"===t.fileName?`${e.name}.vue`:"index.vue")){const n={path:e.names.length?`/${e.names.join("/")}`:`/${e.name}`},r=await readFileContent(e,t);if(r){const i=await generateRouterConfig(r,n,e,t);i&&(o=[...i])}}e:for(const r in n){if(n["<dictName>"===t.fileName?`${e.name}.vue`:"index.vue"]===r)continue;if("file"===n[r].type)continue;for(const e of t.ignoreFolder)if("string"==typeof e||isRegExp(e)){if("string"==typeof e&&e===n[r].name)continue e;if(isRegExp(e)&&e.test(n[r].name))continue e}const i=await readDictContent(n[r],t);if(o)for(const e of o)"string"!=typeof e&&(e.children||(e.children=[]),i&&e.children.push(...i));else o=i}return o}function checkImportOption(e){return!(!Object.prototype.hasOwnProperty.call(e,"name")||"string"!=typeof e.name)&&((!Object.prototype.hasOwnProperty.call(e,"default")||"boolean"==typeof e.default)&&(!Object.prototype.hasOwnProperty.call(e,"alias")||"string"==typeof e.alias))}function getImportCode(e){const t=[];if(!e)return"";for(const n in e)if(Object.prototype.hasOwnProperty.call(e,n)){const o=[];let r="";for(const[t,i]of e[n])if("string"===dataType(i))o.push(i);else if("object"===dataType(i)){if(!checkImportOption(i))continue;i.default?r=i.name:o.push(i.alias?`${i.name} as ${i.alias}`:i.name)}t.push(`import ${r}${o.length&&""!==r?",":""} ${o.length?`{ ${o.join(",")} }`:""} from "${n}";`)}return t.join("")}function mergeImportOption(e,t){for(const n in e)if(Object.prototype.hasOwnProperty.call(e,n)){if("array"!==dataType(e[n]))continue;Object.prototype.hasOwnProperty.call(t,n)||(t[n]=new Map);for(const o of e[n])"string"==typeof o?t[n].set(o,o):"object"===dataType(o)&&t[n].set(o.name,o)}}let outputPath=null;async function checkOutputPath(e){const t=e.split("/").filter((e=>Boolean(e)));t.pop();let n=rootPath;for(const e of t){n+=`//${e}`;try{await fs.promises.access(n)}catch(e){await fs.promises.mkdir(n)}}}async function outerRouterOptionHandle(e,t){let n="";if(!outputPath){checkOutputPath(t);const e=t.split("/").filter((e=>Boolean(e)));n=e.pop(),outputPath=e.join("//")+"//"}const o=new Map,r=new Map,i=n.split(".")[0];o.set(i,[]),r.set(i,{});for(let t=0;t<e.length;t++)if(Object.prototype.hasOwnProperty.call(e[t],"module")){const n=e[t].module;delete e[t].module,"object"===dataType(e[t].import)&&(r.has(n)||r.set(n,{}),mergeImportOption(e[t].import,r.get(n)),delete e[t].import),await innerRouterOptionHandle(e[t],n,r,o),e[t]=`$$$${n}$$$`,o.get(i).push(`import ${e[t].replace(/\$\$\$/g,"")} from "./${e[t].replace(/\$\$\$/g,"")}"`)}else"object"===dataType(e[t].import)&&(mergeImportOption(e[t].import,r.get(i)),delete e[t].import),await innerRouterOptionHandle(e[t],i,r,o);const a=getImportCode(r.get(i)),c=JSON.stringify(e).replace(/"\$\$\$|\$\$\$"|\$\$\$/g,"").replace(/\\n/g,"\n"),s=await prettier.format(generateRouterTemplate(c,a,o.get(i).join("\n")),{parser:"babel"});fs.promises.writeFile(`${rootPath}/${outputPath}/${n}`,s)}async function innerRouterOptionHandle(e,t,n,o){if(o.has(t)||o.set(t,[]),n.has(t)||n.set(t,{}),e.children)for(let r=0;r<e.children.length;r++)if(Object.prototype.hasOwnProperty.call(e.children[r],"module")&&"string"==typeof e.children[r].module){const i=e.children[r].module;delete e.children[r].module,"object"===dataType(e.children[r].import)&&(n.has(i)||n.set(i,{}),mergeImportOption(e.children[r].import,n.get(i)),delete e.children[r].import),await innerRouterOptionHandle(e.children[r],i,n,o),e.children[r]=`$$$${i}$$$`,o.get(t).push(`import ${e.children[r].replace(/\$\$\$/g,"")} from "./${e.children[r].replace(/\$\$\$/g,"")}"`)}else"object"===dataType(e.children[r].import)&&(n.has(t)||n.set(t,{}),mergeImportOption(e.children[r].import,n.get(t)),delete e.children[r].import),await innerRouterOptionHandle(e.children[r],t,n,o);e=JSON.stringify(e).replace(/"\$\$\$|\$\$\$"|\$\$\$/g,"").replace(/\\n/g,"\n");const r=getImportCode(n.get(t)),i=await prettier.format(generateRouterTemplate(e,r,o.get(t).join("\n")),{parser:"babel"});fs.promises.writeFile(`${rootPath}//${outputPath}//${t}.js`,i)}function generateRouterTemplate(e,t,n){return`\n${n}\n${t}\nexport default ${e}  \n  `}let customConfig=null;try{customConfig=require(`${process.cwd()}/router.config.js`)}catch(e){const t=ora("");t.warn("the router.config.js is no exist")}!function(){if(!customConfig)return;const e=ora("scaning file...");e.spinner={interval:100,frames:["-","\\","|","/","-","|"]},e.start();const t=Date.now(),n={entry:"/src/views",output:"/src/router/router.js",importPrefix:"@/src/views",ignoreFolder:[],fileName:"index",...customConfig},o=process.cwd();n.entry.split("/").filter(Boolean).join("\\");const r=path.join(o,n.entry);console.log(r),fs.existsSync(r)?async function(){try{const o=getFilesInfo(r),i=[];for(const e in o)if(o.hasOwnProperty(e)&&"dict"===o[e].type){const t=await readDictContent(o[e],n);t&&i.push(...t)}await outerRouterOptionHandle(i,n.output),e.stop(),e.succeed(`router file generation successful! (Time-consuming: ${Date.now()-t}ms)`)}catch(t){e.fail("generation failed!")}}():(console.log(r),e.fail("the entry folder is no exist"))}();
