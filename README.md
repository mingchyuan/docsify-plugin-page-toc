# docsify-plugin-page-toc

A docsify plugin to display ToC for each page.

[![NPM Version](https://img.shields.io/npm/v/%40mingchyuanko%2Fdocsify-plugin-page-toc?style=flat-square)](https://www.npmjs.com/package/@mingchyuanko/docsify-plugin-page-toc)

## Usage notes

### Markdown file

- Do not skip heading levels:<br />
  always start from `<h1>`, followed by `<h2>` and so on.
- Avoid using multiple `<h1>` elements on one page.<br />
  A page should generally have a single `<h1>` element that describes the content of the page.

### Stylesheet

```html
<!-- head -->
<link rel="stylesheet" href="https://unpkg.com/@mingchyuanko/docsify-plugin-page-toc/dist/toc.css">
```

The browser's width must be wider than 1200px.

Otherwise, you need to download the CSS file and remove the following code:

```css
@media screen and (max-width: 1200px) {
    /* … */
}
```

### Script

```html
<!-- body -->
<script src="https://unpkg.com/@mingchyuanko/docsify-plugin-page-toc/dist/toc.min.js"></script>
```

### Configure docsify-plugin-page-toc

```html
    <script>
        window.$docsify = {
            toc: {
                title: 'Table of Contents',
                headings: 'h2, h3, h4, h5, h6',
            },
        };
    </script>
```
