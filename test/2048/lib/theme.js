const ThemeManager = (() => {

    const className = "UriTheme";
    let lastTheme = null;
    let currTheme = null;
    let theme = { };
    let style = "";

    const init = t => {
        theme = { ...t };
        
        for(const name in theme.data) {
            const p = theme.data[name];
            for(const prop in p) {
                const v = prop.startsWith("bg") ? "background-color": 
                    prop.startsWith("fl") ? "fill" :"color";
                const val = p[prop];
                style += `
                .${className}-${name}-${prop} {
                    ${v}: ${val};
                }`;
            }
        }   // for(const)

        const stylesheet = document.createElement("style");
        stylesheet.innerText = style;
        document.head.appendChild(stylesheet);

        setTheme(t.curr);
    }

    const getCurrentTheme = () => theme.data[currTheme];

    const setTheme = (name) => {
        if(!lastTheme) {
            lastTheme = name;
        }
        currTheme = name;
        const t = getCurrentTheme();
        for(const prop in t) {
            const _classname = `UriTheme-${prop}`;
            const elArr = [...document.querySelectorAll(`.${_classname}`)];
            elArr.forEach((el, i) => {
                const prevClass = [...el.classList].filter(i => i.startsWith(className));
                if(prevClass.length < 2) {
                    const type = (prevClass[0].split("-"))[1];
                    el.classList.add(`${className}-${name}-${type}`);
                } else {
                    const type = (prevClass[0].split("-"))[1];
                    el.classList.remove(`${className}-${lastTheme}-${type}`);
                    el.classList.add(`${className}-${currTheme}-${type}`);
                    lastTheme = currTheme;
                }
            });
        }
    }

    return {
        init,
        setTheme,
        getCurrentTheme
    };

})();

export { ThemeManager }