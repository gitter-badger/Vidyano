import * as fs from 'fs';

function getFiles(dir: string, outFiles: string[] = []) {
    const files = fs.readdirSync(dir);
    for (let index in fs.readdirSync(dir)) {
        const file = `${dir}/${files[index]}`;
        if (fs.statSync(file).isDirectory())
            getFiles(file, outFiles);
        else
            outFiles.push(file);
    }

    return outFiles;
}

const files = getFiles("../..").map(f => f.substr(6)).filter(f => {
    if (f.startsWith("ServiceWorker"))
        return false;

    if (f.indexOf("demo") >= 0 || f.endsWith(".min.css") || f.indexOf("Test") >= 0)
        return false;

    if (f === "websites.html")
        return false;

    if (f.endsWith(".js") || f.indexOf(".html") > 0)
        return true;

    if (f.endsWith(".css"))
        return !f.startsWith("WebComponents");

    return false;
}).map(f => `"${f}"`);

const content = `namespace Vidyano {
    export const vidyanoFiles = [
        ${files.join(",\n        ")}
    ];
}`;

fs.writeFileSync("../service-worker-files.ts", content);