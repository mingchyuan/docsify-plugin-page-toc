/**
 * HTML結構大致上如下：
 * 
 * main
 *   └── section.content
 *              ├── aside.nav
 *              |        └── div.toc-container // 目錄容器
 *              |               ├── p.title    // 目錄標題
 *              |               └── ul         // 目錄
 *              └── article.markdown-section   // 文章
 */

const defaultOptions = {
    title: 'Contents',
    headings: 'h2, h3',
}

// 先設定為預設配置
window.$docsify["toc"] = Object.assign(defaultOptions, window.$docsify["toc"]);

// 新增此 plugin 至 docsify
window.$docsify.plugins = [].concat(window.$docsify.plugins, plugin);

/**
 * Docsify plugin functions.
 * @param {*} hook https://docsify.js.org/#/write-a-plugin?id=lifecycle-hooks
 * @param {*} vm Access the current Docsify instance using the vm argument.
 */
function plugin(hook, vm) {
    // 使用者寫在 index.html 的 toc 配置
    // https://docsify.js.org/#/configuration
    const userOptions = vm.config.toc;

    // Invoked one time when the docsify instance has mounted on the DOM
    hook.mounted(() => {
        buildNav();
    });

    // Invoked on each page load after new HTML has been appended to the DOM
    hook.doneEach(() => {
        removeTOC();

        buildTOC(userOptions);

        highlightTOC(userOptions);

        syncTOCScrollToViewedContent();

        // 切換頁面後，重置卷軸位置
        window.scrollTo(0, 0);
    });
}

/**
 * 在 section.content 底下建立 aside.nav。
 */
function buildNav() {
    const nav = document.createElement("aside");
    nav.classList.add("nav");

    const content = document.querySelector(".content");
    content.insertBefore(nav, content.children[0]);
}

/**
 * 切換頁面後，需要移除上一頁面建立的目錄，避免有多個目錄重疊顯示。
 */
function removeTOC() {
    const toc = document.querySelectorAll(".nav .toc-container");

    // 移除所有找到的 .toc-container
    toc.forEach((currentValue) => {
        currentValue.parentNode.removeChild(currentValue);
    });
}

/**
 * 建立目錄
 * @param {*} options 此 plugin 的配置。
 */
function buildTOC(options) {
    // 目錄最外層的清單( ul )
    const toc = document.createElement("ul");

    // 初始先指向目錄最外層的清單( ul )
    let currentUL = toc;

    // 之後在迭代中，用來紀錄新建立的項目( li )
    let lastLI = null;

    // 使用者需要在目錄上顯示哪些層級的標題
    const selector = ".markdown-section " + options.headings;

    // 獲取建立目錄所需的所有標題
    const headings = getHeadings(selector);

    headings.reduce((prevLevel, currentHeading) => {
        const currentLevel = getLevel(currentHeading);
        const offset = currentLevel - prevLevel;

        if (offset > 0) {
            currentUL = createUList(lastLI, offset);
        }

        /**
         * e.g. 假設 h3 的下一個標題是 h2，所以要先回到 h2 層級，再建立新 h2 的 li。
         * 
         * h2 的 ul <────────┐       step 1:
         *     h2 的 li      ├──────── 要回上一層級的清單( ul )必須要跳 2 層
         *         h3 的 ul ─┘     
         *             h3 的 li      step 2: 
         *     h2 的 li <───────────── 接著再建立新的項目( li )
         */
        if (offset < 0) {
            currentUL = jumpBack(currentUL, -offset * 2);
        }

        lastLI = createListItem(currentHeading, currentUL);

        // 回傳目前標題的層級，作為下一次迭代的 prevLevel
        return currentLevel;
    }, getLevel(options.headings));
    // 設定 prevLevel 初始值供第一個標題使用，初始值是使用者配置標題層級中最小的數值，使得第一次迭代的 offset 為 0

    // 文章中沒有適當標題存在，目錄是空的
    if (!toc.innerHTML) {
        return;
    }

    // 建立目錄容器
    const container = createTOCContainer(options.title, toc);

    // 將目錄容器新增至頁面上
    const nav = document.querySelector("section.content aside.nav");
    nav.appendChild(container);
}

/**
 * @param {string} selector CSS selector
 * @returns {Array<HTMLHeadingElement>} 回傳一陣列，包含所有符合 selector 的標題元素。
 */
function getHeadings(selector) {
    // 在 ES6 前, 若要將 Array-like (e.g. NodeList ) 轉成 Array，可參考：
    // https://stackoverflow.com/questions/16053357/what-does-foreach-call-do-in-javascript
    return Array.from(document.querySelectorAll(selector));
}

/**
 * @param {HTMLHeadingElement | string} heading HTMLHeadingElement 或 "h2, h3" 這種字串。
 * @returns {number} 回傳標題的層級；若是給定字串，則回傳層級中最小的數值。
 */
function getLevel(heading) {
    let level = null;

    if (heading instanceof Element) {
        level = heading.nodeName.match(/\d/g);
    }

    if (typeof heading == "string") {
        level = heading.match(/\d/g);
    }

    return level ? Math.min.apply(null, level) : 1;
}

/**
 * 在項目( li )中，根據指定的偏移量，建立相對應層級的清單( ul )
 * @param {HTMLLIElement} currentWrapper 需要建立下一層清單( ul )的項目( li )。
 * @param {number} offset 偏移量。
 * @returns {HTMLUListElement} 回傳最後建立的清單( ul )。
 */
function createUList(currentWrapper, offset) {
    while (offset) {
        currentWrapper = currentWrapper.appendChild(
            document.createElement("ul")
        );

        offset--;

        // 建立完清單( ul )後，若偏移量未歸零，表示還有下一層級的清單( ul )要新增
        if (offset) {
            // 所以需要一個項目( li )來存放下一層級的清單( ul )
            currentWrapper = currentWrapper.appendChild(
                document.createElement("li")
            );
        }
    }

    return currentWrapper;
}

/**
 * 根據指定的偏移量，回傳相對應層級的 parent element。
 * @param {HTMLElement} element 作為基準的元素。
 * @param {number} offset 偏移量。
 * @returns {HTMLElement} 回傳相對應層級的 parent element。
 */
function jumpBack(element, offset) {
    while (offset--) {
        element = element.parentElement;
    }

    return element;
}

/**
 * 替指定的標題元素建立一個項目( li )，並將其新增至指定清單( ul )中。
 * @param {HTMLHeadingElement} currentHeading 要建立項目( li )的標題元素。
 * @param {HTMLUListElement} uList 被新增項目( li )的清單( ul )。
 * @returns {HTMLLIElement} 回傳新建立的項目( li )。
 */
function createListItem(currentHeading, uList) {
    // 建立此標題的項目
    const li = document.createElement("li");

    // 建立此標題的連結
    const a = document.createElement("a");
    a.innerHTML = currentHeading.firstChild.innerHTML;
    a.href = currentHeading.firstChild.href;

    // 標題太長會使用刪節號省略，當游標懸浮在標題上，會以提示框顯示全部標題
    const span = a.querySelector("span");
    span.title = span.innerText;

    // 新增至指定的清單( ul )中
    uList.appendChild(li).appendChild(a);

    return li;
}

/**
 * @param {string} title 目錄標題。
 * @param {HTMLUListElement} toc 目錄清單( ul )。
 * @returns {HTMLDivElement} 回傳目錄容器。
 */
function createTOCContainer(title, toc) {
    const titleElement = document.createElement("p");
    titleElement.innerHTML = title;
    titleElement.classList.add("title");

    const container = document.createElement("div");
    container.classList.add("toc-container");
    container.appendChild(titleElement);
    container.appendChild(toc);

    return container;
}

/**
 * 根據目前閱讀的文章進度，highlight 相對應的目錄標題。
 * @param {*} options 此 plugin 的配置。
 */
function highlightTOC(options) {
    // 文章中所有子元素
    const selector = "article.markdown-section > *";
    const allElements = document.querySelectorAll(selector);

    // 所有元素（包含標題）
    allElements.forEach((element) => {
        // 只要顯示在視窗上，就新增 class "displayed"；反之，就移除
        createDisplayedObserver().observe(element);
    });

    // 監聽視窗的滾動事件
    window.addEventListener("scroll", (event) => {
        // 從使用者的配置中獲取所有需要在目錄中顯示的標題層級
        const levels = options.headings.match(/\d/g);

        // 對各個層級去 highlight 目錄標題
        levels.forEach((level) => {
            const headings = document.querySelectorAll(".markdown-section h" + level);

            // 該層級的每個標題
            headings.forEach((heading) => {
                const tocHeadingAnchor = getTocHeadingAnchor(heading);

                // 標題本身已經顯示在視窗上
                if (isDisplayed(heading)) {
                    tocHeadingAnchor.classList.add("active");
                    return;
                }

                // 檢查其內容是否顯示在視窗上
                if (isContentViewed(heading)) {
                    tocHeadingAnchor.classList.add("active");
                } else {
                    tocHeadingAnchor.classList.remove("active");
                }
            });
        });
    });
}

/**
 * 建立一個 IntersectionObserver，觀察元素是否顯示在視窗上。
 * 根據觀察，向元素新增或移除 class "displayed"。
 */
function createDisplayedObserver() {
    return new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const element = entry.target;
            const isVisible = entry.intersectionRatio > 0;

            if (isVisible) {
                element.classList.add("displayed");
            } else {
                element.classList.remove("displayed");
            }
        });
    });
}

/**
 * @param {HTMLHeadingElement} articleHeading 文章中的標題元素。
 * @returns {HTMLAnchorElement} 回傳該標題元素在目錄上的超連結元素。
 */
function getTocHeadingAnchor(articleHeading) {
    const href = articleHeading.querySelector("a").href;
    const tocHeadingAnchor = document.querySelector('.toc-container li a[href="' + href + '"]');

    return tocHeadingAnchor;
}

/**
 * @param {Element} element 任何 HTML 元素。
 * @returns 回傳此元素是否顯示在視窗上。
 */
function isDisplayed(element) {
    return element.classList.contains("displayed") ? true : false;
}

/**
 * @param {HTMLHeadingElement} articleHeading 文章中的某個標題元素。
 * @returns 回傳屬於該標題的內容是否有顯示在視窗上。
 */
function isContentViewed(articleHeading) {
    let nextSibling = articleHeading.nextElementSibling;

    while (nextSibling) {
        // 該標題的內容有顯示在視窗上
        if (!isHeading(nextSibling) && isDisplayed(nextSibling)) {
            return true;
        }

        /**
         * 下一個元素是更小的標題，且顯示在視窗上
         * 
         * e.g. articleHeading = #example-heading
         * 
         * <h2 id="example-heading"></h2>
         * <h3 class="displayed"></h3>
         * <div>…</div>
         */
        if (isHeading(nextSibling) && getLevel(nextSibling) > getLevel(articleHeading) && isDisplayed(nextSibling)) {
            return true;
        }

        // 下一個元素是同級或是更大的標題
        if (isHeading(nextSibling) && getLevel(nextSibling) <= getLevel(articleHeading)) {
            return false;
        }

        nextSibling = nextSibling.nextElementSibling;
    };

    return false;
}

/**
 * @param {Element} element 任何 HTML 元素。
 * @returns 回傳此元素是否為標題元素。
 */
function isHeading(element) {
    return element instanceof HTMLHeadingElement;
}

/**
 * 將目錄的捲動位置與視窗的捲動位置同步，以確保當用戶閱讀內容時，目錄會自動更新以反映正在查看的部分。
 */
function syncTOCScrollToViewedContent() {
    const toc = document.querySelector(".toc-container");

    // 監聽視窗的滾動事件
    window.addEventListener("scroll", (event) => {
        const windowScrollHeight = window.document.documentElement.scrollHeight;
        const windowClientHeight = window.document.documentElement.clientHeight;
        const windowHeight = windowScrollHeight - windowClientHeight;
        const windowScrollTop = window.document.documentElement.scrollTop;
        const windowHeightPercentage = windowScrollTop / windowHeight;

        const tocScrollHeight = toc.scrollHeight;
        const tocClientHeight = toc.clientHeight;
        const tocHeight = tocScrollHeight - tocClientHeight;

        toc.scrollTop = tocHeight * windowHeightPercentage;
    });
}