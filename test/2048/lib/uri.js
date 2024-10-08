/**
 * All scenes must be initialized prior to then
 */

const Uri = (() => {

    const className = "UriScene";
    let lastPage = null;

    const urls = { };

    const defaultStyle = `
        width: 100%;
        height: 100%;
        display: none;
    `;

    const getAllScenes = () => [...document.querySelectorAll(`.${className}`)];

    const init = () => {
        const scenes = getAllScenes();
        scenes.forEach((scene, i) => {
            scene.setAttribute("style", defaultStyle);
            const url = [...scene.attributes].filter(i => i.name === "data-url")[0];
            urls[url.value] = scene;
            if(i === 0) {
                lastPage = url.value;
            }
        });
        goto("/home");
    }

    const getCurrentPath = () => lastPage;

    const goto = path => {
        if(!urls[path]) 
            throw new Error("UriScene 404 Path not found: " + path);
        urls[lastPage].style.display = "none";
        urls[path].style.display = "block";
        lastPage = path;
    }

    return {
        init,
        goto,
        getCurrentPath
    };

})();


export { Uri };