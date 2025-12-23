module.exports = function(eleventyConfig) {
  // Passthrough copy
  eleventyConfig.addPassthroughCopy("src/assets");

  // Collections
  eleventyConfig.addCollection("standards", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/standards/*.njk");
  });

  eleventyConfig.addCollection("udts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/udts/*.njk");
  });

  // Filters
  eleventyConfig.addFilter("json", function(value) {
    return JSON.stringify(value, null, 2);
  });

  eleventyConfig.addFilter("slug", function(value) {
    if (!value) return '';
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  });

  eleventyConfig.addFilter("escape", function(value) {
    if (!value) return '';
    return value.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  });

  // Shortcodes
  eleventyConfig.addShortcode("udt", function(name) {
    if (!name) return '';
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `<a href="/udts/${slug}" class="text-konomi-accent hover:underline">${name}</a>`;
  });

  eleventyConfig.addShortcode("mermaid", function(code) {
    return `<div class="mermaid">${code}</div>`;
  });

  return {
    dir: {
      input: "src",
      output: "dist"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
