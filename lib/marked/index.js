importCss("/css/marked.css");class Fixer{constructor(e,t){this.exp=e,this.sign=t}replace(e,t){return e&&(t=(t=t.source||t).replace(/(^|[^\[])\^/g,"$1"),this.exp=this.exp.replace(e,t)),this}done(){return new RegExp(this.exp,this.sign)}}function replace(e,t){return new Fixer(e.source,t||"")}const block={newline:/^\n+/,code:/^( {4}[^\n]+\n*)+/,fences:noop,hr:/^( *[-*_]){3,} *(?:\n+|$)/,heading:/^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,nptable:noop,lheading:/^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,blockquote:/^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,mark:/^ *;;;([\!]?) ([^\n]+)/,task:/^ *- *\[([ x]?)\] *([^\n]*)/,list:/^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,html:/^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,table:noop,paragraph:/^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,text:/^[^\n]+/};function Lexer(e){this.tokens=[],this.tokens.links={},this.options=e||marked.defaults,this.rules=block.normal,this.options.gfm&&(this.options.tables?this.rules=block.tables:this.rules=block.gfm)}block.bullet=/(?:[*+-]|\d+\.)/,block.item=/^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/,block.item=replace(block.item,"gm").replace(/bull/g,block.bullet).done(),block.list=replace(block.list).replace(/bull/g,block.bullet).replace("hr","\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))").replace("def","\\n+(?="+block.def.source+")").done(),block.blockquote=replace(block.blockquote).replace("def",block.def).done(),block._tag="(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b",block.html=replace(block.html).replace("comment",/<!--[\s\S]*?-->/).replace("closed",/<(tag)[\s\S]+?<\/\1>/).replace("closing",/<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/).replace(/tag/g,block._tag).done(),block.paragraph=replace(block.paragraph).replace("hr",block.hr).replace("heading",block.heading).replace("lheading",block.lheading).replace("blockquote",block.blockquote).replace("tag","<"+block._tag).replace("def",block.def).done(),block.normal=merge({},block),block.gfm=merge({},block.normal,{fences:/^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/,paragraph:/^/,heading:/^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/}),block.gfm.paragraph=replace(block.paragraph).replace("(?!","(?!"+block.gfm.fences.source.replace("\\1","\\2")+"|"+block.list.source.replace("\\1","\\3")+"|").done(),block.tables=merge({},block.gfm,{nptable:/^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,table:/^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/}),Lexer.rules=block,Lexer.lex=function(e,t){return new Lexer(t).lex(e)},Lexer.prototype.lex=function(e){return e=e.replace(/\r\n|\r/g,"\n").replace(/\t/g,"  ").replace(/\u00a0/g," ").replace(/\u2424/g,"\n"),this.token(e,!0)},Lexer.prototype.token=function(e,t,n){var r,s,i,l,o,a,p,h,c;for(e=e.replace(/^ +$/gm,"");e;)if((i=this.rules.newline.exec(e))&&(e=e.substring(i[0].length),i[0].length>1&&this.tokens.push({type:"space"})),i=this.rules.code.exec(e))e=e.substring(i[0].length),i=i[0].replace(/^ {4}/gm,""),this.tokens.push({type:"code",text:this.options.pedantic?i:i.replace(/\n+$/,"")});else if(i=this.rules.fences.exec(e))e=e.substring(i[0].length),this.tokens.push({type:"code",lang:i[2],text:i[3]||""});else if(i=this.rules.heading.exec(e))e=e.substring(i[0].length),this.tokens.push({type:"heading",depth:i[1].length,text:i[2]});else if(t&&(i=this.rules.nptable.exec(e))){for(e=e.substring(i[0].length),a={type:"table",header:i[1].replace(/^ *| *\| *$/g,"").split(/ *\| */),align:i[2].replace(/^ *|\| *$/g,"").split(/ *\| */),cells:i[3].replace(/\n$/,"").split("\n")},h=0;h<a.align.length;h++)/^ *-+: *$/.test(a.align[h])?a.align[h]="right":/^ *:-+: *$/.test(a.align[h])?a.align[h]="center":/^ *:-+ *$/.test(a.align[h])?a.align[h]="left":a.align[h]=null;for(h=0;h<a.cells.length;h++)a.cells[h]=a.cells[h].split(/ *\| */);this.tokens.push(a)}else if(i=this.rules.lheading.exec(e))e=e.substring(i[0].length),this.tokens.push({type:"heading",depth:"="===i[2]?1:2,text:i[1]});else if(i=this.rules.hr.exec(e))e=e.substring(i[0].length),this.tokens.push({type:"hr"});else if(i=this.rules.blockquote.exec(e))e=e.substring(i[0].length),this.tokens.push({type:"blockquote_start"}),i=i[0].replace(/^ *> ?/gm,""),this.token(i,t,!0),this.tokens.push({type:"blockquote_end"});else if(i=this.rules.mark.exec(e))e=e.substring(i[0].length),this.tokens.push({type:"mark",mark:"!"===i[1],text:i[2]});else if(i=this.rules.task.exec(e))e=e.substring(i[0].length),this.tokens.push({type:"task",mark:"x"===i[1],text:i[2]});else if(i=this.rules.list.exec(e)){for(e=e.substring(i[0].length),l=i[2],this.tokens.push({type:"list_start",ordered:l.length>1}),r=!1,c=(i=i[0].match(this.rules.item)).length,h=0;h<c;h++)p=(a=i[h]).length,~(a=a.replace(/^ *([*+-]|\d+\.) +/,"")).indexOf("\n ")&&(p-=a.length,a=this.options.pedantic?a.replace(/^ {1,4}/gm,""):a.replace(new RegExp("^ {1,"+p+"}","gm"),"")),this.options.smartLists&&h!==c-1&&(l===(o=block.bullet.exec(i[h+1])[0])||l.length>1&&o.length>1||(e=i.slice(h+1).join("\n")+e,h=c-1)),s=r||/\n\n(?!\s*$)/.test(a),h!==c-1&&(r="\n"===a.charAt(a.length-1),s||(s=r)),this.tokens.push({type:s?"loose_item_start":"list_item_start"}),this.token(a,!1,n),this.tokens.push({type:"list_item_end"});this.tokens.push({type:"list_end"})}else if(i=this.rules.html.exec(e))e=e.substring(i[0].length),this.tokens.push({type:this.options.sanitize?"paragraph":"html",pre:!this.options.sanitizer&&("pre"===i[1]||"script"===i[1]||"style"===i[1]),text:i[0]});else if(!n&&t&&(i=this.rules.def.exec(e)))e=e.substring(i[0].length),this.tokens.links[i[1].toLowerCase()]={href:i[2],title:i[3]};else if(t&&(i=this.rules.table.exec(e))){for(e=e.substring(i[0].length),a={type:"table",header:i[1].replace(/^ *| *\| *$/g,"").split(/ *\| */),align:i[2].replace(/^ *|\| *$/g,"").split(/ *\| */),cells:i[3].replace(/(?: *\| *)?\n$/,"").split("\n")},h=0;h<a.align.length;h++)/^ *-+: *$/.test(a.align[h])?a.align[h]="right":/^ *:-+: *$/.test(a.align[h])?a.align[h]="center":/^ *:-+ *$/.test(a.align[h])?a.align[h]="left":a.align[h]=null;for(h=0;h<a.cells.length;h++)a.cells[h]=a.cells[h].replace(/^ *\| *| *\| *$/g,"").split(/ *\| */);this.tokens.push(a)}else if(t&&(i=this.rules.paragraph.exec(e)))e=e.substring(i[0].length),this.tokens.push({type:"paragraph",text:"\n"===i[1].charAt(i[1].length-1)?i[1].slice(0,-1):i[1]});else if(i=this.rules.text.exec(e))e=e.substring(i[0].length),this.tokens.push({type:"text",text:i[0]});else if(e)throw new Error("Infinite loop on byte: "+e.charCodeAt(0));return this.tokens};var inline={escape:/^\\([\\`*{}\[\]()#+\-.!_>])/,autolink:/^<([^ >]+(@|:\/)[^ >]+)>/,url:noop,tag:/^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,link:/^!?\[(inside)\]\(href\)/,reflink:/^!?\[(inside)\]\s*\[([^\]]*)\]/,nolink:/^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,strong:/^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,em:/^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,code:/^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,br:/^ {2,}\n(?!\s*$)/,del:noop,text:/^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/};function InlineLexer(e,t){if(this.options=t||marked.defaults,this.links=e,this.rules=inline.normal,this.renderer=this.options.renderer||new Renderer,this.renderer.options=this.options,!this.links)throw new Error("Tokens array requires a `links` property.");this.options.gfm?this.options.breaks?this.rules=inline.breaks:this.rules=inline.gfm:this.options.pedantic&&(this.rules=inline.pedantic)}function Renderer(e){this.options=e||{}}function Parser(e){this.tokens=[],this.token=null,this.options=e||marked.defaults,this.options.renderer=this.options.renderer||new Renderer,this.renderer=this.options.renderer,this.renderer.options=this.options}function escape(e,t){return e.replace(t?/&/g:/&(?!#?\w+;)/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function unescape(e){return e.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/g,function(e,t){return"colon"===(t=t.toLowerCase())?":":"#"===t.charAt(0)?"x"===t.charAt(1)?String.fromCharCode(parseInt(t.substring(2),16)):String.fromCharCode(+t.substring(1)):""})}function noop(){}function merge(e){for(var t,n,r=1;r<arguments.length;r++)for(n in t=arguments[r])Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n]);return e}function marked(e,t,n){if(n||"function"==typeof t){n||(n=t,t=null);var r,s,i=(t=merge({},marked.defaults,t||{})).highlight,l=0;try{r=Lexer.lex(e,t)}catch(e){return n(e)}s=r.length;var o=function(e){if(e)return t.highlight=i,n(e);var s;try{s=Parser.parse(r,t)}catch(t){e=t}return t.highlight=i,e?n(e):n(null,s)};if(!i||i.length<3)return o();if(delete t.highlight,!s)return o();for(;l<r.length;l++)!function(e){"code"!==e.type?--s||o():i(e.text,e.lang,function(t,n){return t?o(t):null==n||n===e.text?--s||o():(e.text=n,e.escaped=!0,void(--s||o()))})}(r[l])}else try{return t&&(t=merge({},marked.defaults,t)),Parser.parse(Lexer.lex(e,t),t)}catch(e){if(e.message+="\nPlease report this to https://github.com/chjj/marked.",(t||marked.defaults).silent)return"<p>An error occured:</p><pre>"+escape(e.message+"",!0)+"</pre>";throw e}}inline._inside=/(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/,inline._href=/\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/,inline.link=replace(inline.link).replace("inside",inline._inside).replace("href",inline._href).done(),inline.reflink=replace(inline.reflink).replace("inside",inline._inside).done(),inline.normal=merge({},inline),inline.pedantic=merge({},inline.normal,{strong:/^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,em:/^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/}),inline.gfm=merge({},inline.normal,{escape:replace(inline.escape).replace("])","~|])").done(),url:/^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,del:/^~~(?=\S)([\s\S]*?\S)~~/,text:replace(inline.text).replace("]|","~]|").replace("|","|https?://|").done()}),inline.breaks=merge({},inline.gfm,{br:replace(inline.br).replace("{2,}","*").done(),text:replace(inline.gfm.text).replace("{2,}","*").done()}),InlineLexer.rules=inline,InlineLexer.output=function(e,t,n){return new InlineLexer(t,n).output(e)},InlineLexer.prototype.output=function(e){for(var t,n,r,s,i="";e;)if(s=this.rules.escape.exec(e))e=e.substring(s[0].length),i+=s[1];else if(s=this.rules.autolink.exec(e))e=e.substring(s[0].length),"@"===s[2]?(n=":"===s[1].charAt(6)?this.mangle(s[1].substring(7)):this.mangle(s[1]),r=this.mangle("mailto:")+n):r=n=escape(s[1]),i+=this.renderer.link(r,null,n);else if(this.inLink||!(s=this.rules.url.exec(e))){if(s=this.rules.tag.exec(e))!this.inLink&&/^<a /i.test(s[0])?this.inLink=!0:this.inLink&&/^<\/a>/i.test(s[0])&&(this.inLink=!1),e=e.substring(s[0].length),i+=this.options.sanitize?this.options.sanitizer?this.options.sanitizer(s[0]):escape(s[0]):s[0];else if(s=this.rules.link.exec(e))e=e.substring(s[0].length),this.inLink=!0,i+=this.outputLink(s,{href:s[2],title:s[3]}),this.inLink=!1;else if((s=this.rules.reflink.exec(e))||(s=this.rules.nolink.exec(e))){if(e=e.substring(s[0].length),t=(s[2]||s[1]).replace(/\s+/g," "),!(t=this.links[t.toLowerCase()])||!t.href){i+=s[0].charAt(0),e=s[0].substring(1)+e;continue}this.inLink=!0,i+=this.outputLink(s,t),this.inLink=!1}else if(s=this.rules.strong.exec(e))e=e.substring(s[0].length),i+=this.renderer.strong(this.output(s[2]||s[1]));else if(s=this.rules.em.exec(e))e=e.substring(s[0].length),i+=this.renderer.em(this.output(s[2]||s[1]));else if(s=this.rules.code.exec(e))e=e.substring(s[0].length),i+=this.renderer.codespan(escape(s[2],!0));else if(s=this.rules.br.exec(e))e=e.substring(s[0].length),/<[\/]?([a-z0-9\-])+[^>]*>/.test(e)||(i+=this.renderer.br());else if(s=this.rules.del.exec(e))e=e.substring(s[0].length),i+=this.renderer.del(this.output(s[1]));else if(s=this.rules.text.exec(e))e=e.substring(s[0].length),i+=this.renderer.text(escape(this.smartypants(s[0])));else if(e)throw new Error("Infinite loop on byte: "+e.charCodeAt(0))}else e=e.substring(s[0].length),r=n=escape(s[1]),i+=this.renderer.link(r,null,n);return i},InlineLexer.prototype.outputLink=function(e,t){var n=escape(t.href),r=t.title?escape(t.title):null;return"!"!==e[0].charAt(0)?this.renderer.link(n,r,this.output(e[1])):this.renderer.image(n,r,escape(e[1]))},InlineLexer.prototype.smartypants=function(e){return this.options.smartypants?e.replace(/---/g,"—").replace(/--/g,"–").replace(/(^|[-\u2014/(\[{"\s])'/g,"$1‘").replace(/'/g,"’").replace(/(^|[-\u2014/(\[{\u2018\s])"/g,"$1“").replace(/"/g,"”").replace(/\.{3}/g,"…"):e},InlineLexer.prototype.mangle=function(e){if(!this.options.mangle)return e;for(var t,n="",r=e.length,s=0;s<r;s++)t=e.charCodeAt(s),Math.random()>.5&&(t="x"+t.toString(16)),n+="&#"+t+";";return n},Renderer.prototype.code=function(e,t,n){if(e=e.replace(/&lt;script([^&]*?)&gt;/g,"<script$1>").replace(/&lt;\/script&gt;/g,"<\/script>"),this.options.highlight){var r=this.options.highlight(e,t);null!=r&&r!==e&&(n=!0,e=r)}e=n?e:escape(e,!0),t=this.options.langPrefix+escape(t,!0);for(var s=e.split("\n"),i=s.length,l=0,o="",a=!1;l++<i;)a?/<\/span>$/.test(s[l-1])?(s[l-1]='<span class="token comment">'+s[l-1],a=!1):s[l-1]='<span class="token comment">'+s[l-1]+"</span>":/^\s*?<span class="token comment"/.test(s[l-1])&&!/<\/span>$/.test(s[l-1])&&(a=!0,s[l-1]+="</span>"),o+='<code class="lang '+t+'">'+s[l-1]+"\n</code>";return'<pre skip class="do-ui-blockcode">'+o+"</pre>"},Renderer.prototype.blockquote=function(e){return'<blockquote class="md-quote">\n'+e+"</blockquote>\n"},Renderer.prototype.mark=function(e,t){return`<section>\n    <mark class="${t?"md-warn":"md-mark"}">\n      <i class="do-icon-${t?"warn":"unmute"}"></i>\n      ${e}\n    </mark>\n  </section>\n  `},Renderer.prototype.task=function(e,t){return`<section>\n    <label class="md-task ${t?"done":""}">\n      <span class="md-task__box">\n        ${t?'<i class="do-icon-get"></i>':""}\n      </span>\n      <span class="md-task__text">${e}</span>\n    </label>\n  </section>\n  `},Renderer.prototype.html=function(e){return e=e.replace(/<br>/g,"")},Renderer.prototype.heading=function(e,t,n){return`\n  <h${t} class="md-head" id="${n=e.replace(/<[^>]+>|<\/[^>]+>/g,"")}">\n    <span><a href="#${n}" class="do-icon-link"></a>${e}</span>\n  </h${t}>\n  `},Renderer.prototype.hr=function(){return"<hr>"},Renderer.prototype.list=function(e,t){var n=t?"ol":"ul";return"<"+n+">\n"+e+"</"+n+">\n"},Renderer.prototype.listitem=function(e){return"<li>"+e+"</li>"},Renderer.prototype.paragraph=function(e){return"<p>"+e+"</p>"},Renderer.prototype.table=function(e,t){return"<table><thead>"+e+"</thead><tbody>"+t+"</tbody></table>"},Renderer.prototype.tablerow=function(e){return"<tr>"+e+"</tr>"},Renderer.prototype.tablecell=function(e,t){var n=t.header?"th":"td";return(t.align?"<"+n+' style="text-align:'+t.align+'">':"<"+n+">")+e+"</"+n+">"},Renderer.prototype.strong=function(e){return"<strong>"+e+"</strong>"},Renderer.prototype.em=function(e){return"<em>"+e+"</em>"},Renderer.prototype.codespan=function(e){return'<code skip class="do-ui-inlinecode">'+(e=e.replace(/&amp;/g,"&"))+"</code>"},Renderer.prototype.br=function(){return"<br>"},Renderer.prototype.del=function(e){return"<del>"+e+"</del>"},Renderer.prototype.link=function(e,t,n){if(this.options.sanitize){try{var r=decodeURIComponent(unescape(e)).replace(/[^\w:]/g,"").toLowerCase()}catch(e){return""}if(0===r.indexOf("javascript:")||0===r.indexOf("vbscript:")||0===r.indexOf("data:"))return""}var s='<a href="'+e+'" ';return t&&(s+=(t=t.split(";").map(function(e){var t=e.split("=");return t.length>1?t[0]+'="'+t[1]+'"':'title="'+t[0]+'"'})).join(" ")),s+=">"+n+"</a>"},Renderer.prototype.image=function(e,t,n){var r='<img src="'+e+'" alt="'+n+'"';return t&&(r+=' title="'+t+'"'),r+=">"},Renderer.prototype.text=function(e){return e},Parser.parse=function(e,t,n){return new Parser(t,n).parse(e)},Parser.prototype.parse=function(e){this.inline=new InlineLexer(e.links,this.options,this.renderer),this.tokens=e.reverse();for(var t="";this.next();)t+=this.tok();return t},Parser.prototype.next=function(){return this.token=this.tokens.pop()},Parser.prototype.peek=function(){return this.tokens[this.tokens.length-1]||0},Parser.prototype.parseText=function(){for(var e=this.token.text;"text"===this.peek().type;)e+="\n"+this.next().text;return this.inline.output(e)},Parser.prototype.tok=function(){switch(this.token.type){case"space":return"";case"hr":return this.renderer.hr();case"heading":return this.renderer.heading(this.inline.output(this.token.text),this.token.depth,this.token.text);case"code":return this.renderer.code(this.token.text,this.token.lang||"other",this.token.escaped);case"table":var e,t,n,r,s="",i="";for(n="",e=0;e<this.token.header.length;e++)({header:!0,align:this.token.align[e]}),n+=this.renderer.tablecell(this.inline.output(this.token.header[e]),{header:!0,align:this.token.align[e]});for(s+=this.renderer.tablerow(n),e=0;e<this.token.cells.length;e++){for(t=this.token.cells[e],n="",r=0;r<t.length;r++)n+=this.renderer.tablecell(this.inline.output(t[r]),{header:!1,align:this.token.align[r]});i+=this.renderer.tablerow(n)}return this.renderer.table(s,i);case"blockquote_start":for(i="";"blockquote_end"!==this.next().type;)i+=this.tok();return this.renderer.blockquote(i);case"mark":return this.renderer.mark(this.token.text,this.token.mark);case"task":return this.renderer.task(this.token.text,this.token.mark);case"list_start":i="";for(var l=this.token.ordered;"list_end"!==this.next().type;)i+=this.tok();return this.renderer.list(i,l);case"list_item_start":for(i="";"list_item_end"!==this.next().type;)i+="text"===this.token.type?this.parseText():this.tok();return this.renderer.listitem(i);case"loose_item_start":for(i="";"list_item_end"!==this.next().type;)i+=this.tok();return this.renderer.listitem(i);case"html":var o=this.token.pre||this.options.pedantic?this.token.text:this.inline.output(this.token.text);return this.renderer.html(o);case"paragraph":return this.renderer.paragraph(this.inline.output(this.token.text));case"text":return this.renderer.paragraph(this.parseText())}},noop.exec=noop,marked.options=marked.setOptions=function(e){return merge(marked.defaults,e),marked},window.Anot&&(Anot.ui.marked="1.0.0"),marked.defaults={gfm:!0,tables:!0,breaks:!0,pedantic:!1,sanitize:!1,sanitizer:null,mangle:!0,smartLists:!1,silent:!1,highlight:null,langPrefix:"lang-",smartypants:!1,renderer:new Renderer},marked.Parser=Parser,marked.parser=Parser.parse,marked.Renderer=Renderer,marked.Lexer=Lexer,marked.lexer=Lexer.lex,marked.InlineLexer=InlineLexer,marked.inlineLexer=InlineLexer.output,marked.parse=marked,marked.safe=function(e){return marked(e=e.trim().replace(/<script([^>]*?)>/g,"&lt;script$1&gt;").replace(/<\/script>/g,"&lt;/script&gt;"))},window.marked=marked;export default marked;