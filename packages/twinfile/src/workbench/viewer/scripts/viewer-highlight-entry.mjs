import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';

hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);

export default hljs;
