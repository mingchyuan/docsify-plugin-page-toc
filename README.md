# docsify-plugin-page-toc

A docsify plugin to display ToC for each page.

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
