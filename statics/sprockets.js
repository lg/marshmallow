/*  Prototype JavaScript framework, version 1.6.1
 *  (c) 2005-2009 Sam Stephenson
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://www.prototypejs.org/
 *
 *--------------------------------------------------------------------------*/

var Prototype = {
  Version: '1.6.1',

  Browser: (function(){
    var ua = navigator.userAgent;
    var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
    return {
      IE:             !!window.attachEvent && !isOpera,
      Opera:          isOpera,
      WebKit:         ua.indexOf('AppleWebKit/') > -1,
      Gecko:          ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1,
      MobileSafari:   /Apple.*Mobile.*Safari/.test(ua)
    }
  })(),

  BrowserFeatures: {
    XPath: !!document.evaluate,
    SelectorsAPI: !!document.querySelector,
    ElementExtensions: (function() {
      var constructor = window.Element || window.HTMLElement;
      return !!(constructor && constructor.prototype);
    })(),
    SpecificElementExtensions: (function() {
      if (typeof window.HTMLDivElement !== 'undefined')
        return true;

      var div = document.createElement('div'),
          form = document.createElement('form'),
          isSupported = false;

      if (div['__proto__'] && (div['__proto__'] !== form['__proto__'])) {
        isSupported = true;
      }

      div = form = null;

      return isSupported;
    })()
  },

  ScriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
  JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,

  emptyFunction: function() { },
  K: function(x) { return x }
};

if (Prototype.Browser.MobileSafari)
  Prototype.BrowserFeatures.SpecificElementExtensions = false;


var Abstract = { };


var Try = {
  these: function() {
    var returnValue;

    for (var i = 0, length = arguments.length; i < length; i++) {
      var lambda = arguments[i];
      try {
        returnValue = lambda();
        break;
      } catch (e) { }
    }

    return returnValue;
  }
};

/* Based on Alex Arnell's inheritance implementation. */

var Class = (function() {

  var IS_DONTENUM_BUGGY = (function(){
    for (var p in { toString: 1 }) {
      if (p === 'toString') return false;
    }
    return true;
  })();

  function subclass() {};
  function create() {
    var parent = null, properties = $A(arguments);
    if (Object.isFunction(properties[0]))
      parent = properties.shift();

    function klass() {
      this.initialize.apply(this, arguments);
    }

    Object.extend(klass, Class.Methods);
    klass.superclass = parent;
    klass.subclasses = [];

    if (parent) {
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
      parent.subclasses.push(klass);
    }

    for (var i = 0, length = properties.length; i < length; i++)
      klass.addMethods(properties[i]);

    if (!klass.prototype.initialize)
      klass.prototype.initialize = Prototype.emptyFunction;

    klass.prototype.constructor = klass;
    return klass;
  }

  function addMethods(source) {
    var ancestor   = this.superclass && this.superclass.prototype,
        properties = Object.keys(source);

    if (IS_DONTENUM_BUGGY) {
      if (source.toString != Object.prototype.toString)
        properties.push("toString");
      if (source.valueOf != Object.prototype.valueOf)
        properties.push("valueOf");
    }

    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && Object.isFunction(value) &&
          value.argumentNames()[0] == "$super") {
        var method = value;
        value = (function(m) {
          return function() { return ancestor[m].apply(this, arguments); };
        })(property).wrap(method);

        value.valueOf = method.valueOf.bind(method);
        value.toString = method.toString.bind(method);
      }
      this.prototype[property] = value;
    }

    return this;
  }

  return {
    create: create,
    Methods: {
      addMethods: addMethods
    }
  };
})();
(function() {

  var _toString = Object.prototype.toString;

  function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
  }

  function inspect(object) {
    try {
      if (isUndefined(object)) return 'undefined';
      if (object === null) return 'null';
      return object.inspect ? object.inspect() : String(object);
    } catch (e) {
      if (e instanceof RangeError) return '...';
      throw e;
    }
  }

  function toJSON(object) {
    var type = typeof object;
    switch (type) {
      case 'undefined':
      case 'function':
      case 'unknown': return;
      case 'boolean': return object.toString();
    }

    if (object === null) return 'null';
    if (object.toJSON) return object.toJSON();
    if (isElement(object)) return;

    var results = [];
    for (var property in object) {
      var value = toJSON(object[property]);
      if (!isUndefined(value))
        results.push(property.toJSON() + ': ' + value);
    }

    return '{' + results.join(', ') + '}';
  }

  function toQueryString(object) {
    return $H(object).toQueryString();
  }

  function toHTML(object) {
    return object && object.toHTML ? object.toHTML() : String.interpret(object);
  }

  function keys(object) {
    var results = [];
    for (var property in object)
      results.push(property);
    return results;
  }

  function values(object) {
    var results = [];
    for (var property in object)
      results.push(object[property]);
    return results;
  }

  function clone(object) {
    return extend({ }, object);
  }

  function isElement(object) {
    return !!(object && object.nodeType == 1);
  }

  function isArray(object) {
    return _toString.call(object) == "[object Array]";
  }


  function isHash(object) {
    return object instanceof Hash;
  }

  function isFunction(object) {
    return typeof object === "function";
  }

  function isString(object) {
    return _toString.call(object) == "[object String]";
  }

  function isNumber(object) {
    return _toString.call(object) == "[object Number]";
  }

  function isUndefined(object) {
    return typeof object === "undefined";
  }

  extend(Object, {
    extend:        extend,
    inspect:       inspect,
    toJSON:        toJSON,
    toQueryString: toQueryString,
    toHTML:        toHTML,
    keys:          keys,
    values:        values,
    clone:         clone,
    isElement:     isElement,
    isArray:       isArray,
    isHash:        isHash,
    isFunction:    isFunction,
    isString:      isString,
    isNumber:      isNumber,
    isUndefined:   isUndefined
  });
})();
Object.extend(Function.prototype, (function() {
  var slice = Array.prototype.slice;

  function update(array, args) {
    var arrayLength = array.length, length = args.length;
    while (length--) array[arrayLength + length] = args[length];
    return array;
  }

  function merge(array, args) {
    array = slice.call(array, 0);
    return update(array, args);
  }

  function argumentNames() {
    var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
      .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
      .replace(/\s+/g, '').split(',');
    return names.length == 1 && !names[0] ? [] : names;
  }

  function bind(context) {
    if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
    var __method = this, args = slice.call(arguments, 1);
    return function() {
      var a = merge(args, arguments);
      return __method.apply(context, a);
    }
  }

  function bindAsEventListener(context) {
    var __method = this, args = slice.call(arguments, 1);
    return function(event) {
      var a = update([event || window.event], args);
      return __method.apply(context, a);
    }
  }

  function curry() {
    if (!arguments.length) return this;
    var __method = this, args = slice.call(arguments, 0);
    return function() {
      var a = merge(args, arguments);
      return __method.apply(this, a);
    }
  }

  function delay(timeout) {
    var __method = this, args = slice.call(arguments, 1);
    timeout = timeout * 1000;
    return window.setTimeout(function() {
      return __method.apply(__method, args);
    }, timeout);
  }

  function defer() {
    var args = update([0.01], arguments);
    return this.delay.apply(this, args);
  }

  function wrap(wrapper) {
    var __method = this;
    return function() {
      var a = update([__method.bind(this)], arguments);
      return wrapper.apply(this, a);
    }
  }

  function methodize() {
    if (this._methodized) return this._methodized;
    var __method = this;
    return this._methodized = function() {
      var a = update([this], arguments);
      return __method.apply(null, a);
    };
  }

  return {
    argumentNames:       argumentNames,
    bind:                bind,
    bindAsEventListener: bindAsEventListener,
    curry:               curry,
    delay:               delay,
    defer:               defer,
    wrap:                wrap,
    methodize:           methodize
  }
})());


Date.prototype.toJSON = function() {
  return '"' + this.getUTCFullYear() + '-' +
    (this.getUTCMonth() + 1).toPaddedString(2) + '-' +
    this.getUTCDate().toPaddedString(2) + 'T' +
    this.getUTCHours().toPaddedString(2) + ':' +
    this.getUTCMinutes().toPaddedString(2) + ':' +
    this.getUTCSeconds().toPaddedString(2) + 'Z"';
};


RegExp.prototype.match = RegExp.prototype.test;

RegExp.escape = function(str) {
  return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};
var PeriodicalExecuter = Class.create({
  initialize: function(callback, frequency) {
    this.callback = callback;
    this.frequency = frequency;
    this.currentlyExecuting = false;

    this.registerCallback();
  },

  registerCallback: function() {
    this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  execute: function() {
    this.callback(this);
  },

  stop: function() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  },

  onTimerEvent: function() {
    if (!this.currentlyExecuting) {
      try {
        this.currentlyExecuting = true;
        this.execute();
        this.currentlyExecuting = false;
      } catch(e) {
        this.currentlyExecuting = false;
        throw e;
      }
    }
  }
});
Object.extend(String, {
  interpret: function(value) {
    return value == null ? '' : String(value);
  },
  specialChar: {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '\\': '\\\\'
  }
});

Object.extend(String.prototype, (function() {

  function prepareReplacement(replacement) {
    if (Object.isFunction(replacement)) return replacement;
    var template = new Template(replacement);
    return function(match) { return template.evaluate(match) };
  }

  function gsub(pattern, replacement) {
    var result = '', source = this, match;
    replacement = prepareReplacement(replacement);

    if (Object.isString(pattern))
      pattern = RegExp.escape(pattern);

    if (!(pattern.length || pattern.source)) {
      replacement = replacement('');
      return replacement + source.split('').join(replacement) + replacement;
    }

    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        result += String.interpret(replacement(match));
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source, source = '';
      }
    }
    return result;
  }

  function sub(pattern, replacement, count) {
    replacement = prepareReplacement(replacement);
    count = Object.isUndefined(count) ? 1 : count;

    return this.gsub(pattern, function(match) {
      if (--count < 0) return match[0];
      return replacement(match);
    });
  }

  function scan(pattern, iterator) {
    this.gsub(pattern, iterator);
    return String(this);
  }

  function truncate(length, truncation) {
    length = length || 30;
    truncation = Object.isUndefined(truncation) ? '...' : truncation;
    return this.length > length ?
      this.slice(0, length - truncation.length) + truncation : String(this);
  }

  function strip() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  }

  function stripTags() {
    return this.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '');
  }

  function stripScripts() {
    return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
  }

  function extractScripts() {
    var matchAll = new RegExp(Prototype.ScriptFragment, 'img'),
        matchOne = new RegExp(Prototype.ScriptFragment, 'im');
    return (this.match(matchAll) || []).map(function(scriptTag) {
      return (scriptTag.match(matchOne) || ['', ''])[1];
    });
  }

  function evalScripts() {
    return this.extractScripts().map(function(script) { return eval(script) });
  }

  function escapeHTML() {
    return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function unescapeHTML() {
    return this.stripTags().replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  }


  function toQueryParams(separator) {
    var match = this.strip().match(/([^?#]*)(#.*)?$/);
    if (!match) return { };

    return match[1].split(separator || '&').inject({ }, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift()),
            value = pair.length > 1 ? pair.join('=') : pair[0];

        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    });
  }

  function toArray() {
    return this.split('');
  }

  function succ() {
    return this.slice(0, this.length - 1) +
      String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
  }

  function times(count) {
    return count < 1 ? '' : new Array(count + 1).join(this);
  }

  function camelize() {
    return this.replace(/-+(.)?/g, function(match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
  }

  function capitalize() {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
  }

  function underscore() {
    return this.replace(/::/g, '/')
               .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
               .replace(/([a-z\d])([A-Z])/g, '$1_$2')
               .replace(/-/g, '_')
               .toLowerCase();
  }

  function dasherize() {
    return this.replace(/_/g, '-');
  }

  function inspect(useDoubleQuotes) {
    var escapedString = this.replace(/[\x00-\x1f\\]/g, function(character) {
      if (character in String.specialChar) {
        return String.specialChar[character];
      }
      return '\\u00' + character.charCodeAt().toPaddedString(2, 16);
    });
    if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
    return "'" + escapedString.replace(/'/g, '\\\'') + "'";
  }

  function toJSON() {
    return this.inspect(true);
  }

  function unfilterJSON(filter) {
    return this.replace(filter || Prototype.JSONFilter, '$1');
  }

  function isJSON() {
    var str = this;
    if (str.blank()) return false;
    str = this.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
    return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(str);
  }

  function evalJSON(sanitize) {
    var json = this.unfilterJSON();
    try {
      if (!sanitize || json.isJSON()) return eval('(' + json + ')');
    } catch (e) { }
    throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
  }

  function include(pattern) {
    return this.indexOf(pattern) > -1;
  }

  function startsWith(pattern) {
    return this.lastIndexOf(pattern, 0) === 0;
  }

  function endsWith(pattern) {
    var d = this.length - pattern.length;
    return d >= 0 && this.indexOf(pattern, d) === d;
  }

  function empty() {
    return this == '';
  }

  function blank() {
    return /^\s*$/.test(this);
  }

  function interpolate(object, pattern) {
    return new Template(this, pattern).evaluate(object);
  }

  return {
    gsub:           gsub,
    sub:            sub,
    scan:           scan,
    truncate:       truncate,
    strip:          String.prototype.trim || strip,
    stripTags:      stripTags,
    stripScripts:   stripScripts,
    extractScripts: extractScripts,
    evalScripts:    evalScripts,
    escapeHTML:     escapeHTML,
    unescapeHTML:   unescapeHTML,
    toQueryParams:  toQueryParams,
    parseQuery:     toQueryParams,
    toArray:        toArray,
    succ:           succ,
    times:          times,
    camelize:       camelize,
    capitalize:     capitalize,
    underscore:     underscore,
    dasherize:      dasherize,
    inspect:        inspect,
    toJSON:         toJSON,
    unfilterJSON:   unfilterJSON,
    isJSON:         isJSON,
    evalJSON:       evalJSON,
    include:        include,
    startsWith:     startsWith,
    endsWith:       endsWith,
    empty:          empty,
    blank:          blank,
    interpolate:    interpolate
  };
})());

var Template = Class.create({
  initialize: function(template, pattern) {
    this.template = template.toString();
    this.pattern = pattern || Template.Pattern;
  },

  evaluate: function(object) {
    if (object && Object.isFunction(object.toTemplateReplacements))
      object = object.toTemplateReplacements();

    return this.template.gsub(this.pattern, function(match) {
      if (object == null) return (match[1] + '');

      var before = match[1] || '';
      if (before == '\\') return match[2];

      var ctx = object, expr = match[3],
          pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;

      match = pattern.exec(expr);
      if (match == null) return before;

      while (match != null) {
        var comp = match[1].startsWith('[') ? match[2].replace(/\\\\]/g, ']') : match[1];
        ctx = ctx[comp];
        if (null == ctx || '' == match[3]) break;
        expr = expr.substring('[' == match[3] ? match[1].length : match[0].length);
        match = pattern.exec(expr);
      }

      return before + String.interpret(ctx);
    });
  }
});
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;

var $break = { };

var Enumerable = (function() {
  function each(iterator, context) {
    var index = 0;
    try {
      this._each(function(value) {
        iterator.call(context, value, index++);
      });
    } catch (e) {
      if (e != $break) throw e;
    }
    return this;
  }

  function eachSlice(number, iterator, context) {
    var index = -number, slices = [], array = this.toArray();
    if (number < 1) return array;
    while ((index += number) < array.length)
      slices.push(array.slice(index, index+number));
    return slices.collect(iterator, context);
  }

  function all(iterator, context) {
    iterator = iterator || Prototype.K;
    var result = true;
    this.each(function(value, index) {
      result = result && !!iterator.call(context, value, index);
      if (!result) throw $break;
    });
    return result;
  }

  function any(iterator, context) {
    iterator = iterator || Prototype.K;
    var result = false;
    this.each(function(value, index) {
      if (result = !!iterator.call(context, value, index))
        throw $break;
    });
    return result;
  }

  function collect(iterator, context) {
    iterator = iterator || Prototype.K;
    var results = [];
    this.each(function(value, index) {
      results.push(iterator.call(context, value, index));
    });
    return results;
  }

  function detect(iterator, context) {
    var result;
    this.each(function(value, index) {
      if (iterator.call(context, value, index)) {
        result = value;
        throw $break;
      }
    });
    return result;
  }

  function findAll(iterator, context) {
    var results = [];
    this.each(function(value, index) {
      if (iterator.call(context, value, index))
        results.push(value);
    });
    return results;
  }

  function grep(filter, iterator, context) {
    iterator = iterator || Prototype.K;
    var results = [];

    if (Object.isString(filter))
      filter = new RegExp(RegExp.escape(filter));

    this.each(function(value, index) {
      if (filter.match(value))
        results.push(iterator.call(context, value, index));
    });
    return results;
  }

  function include(object) {
    if (Object.isFunction(this.indexOf))
      if (this.indexOf(object) != -1) return true;

    var found = false;
    this.each(function(value) {
      if (value == object) {
        found = true;
        throw $break;
      }
    });
    return found;
  }

  function inGroupsOf(number, fillWith) {
    fillWith = Object.isUndefined(fillWith) ? null : fillWith;
    return this.eachSlice(number, function(slice) {
      while(slice.length < number) slice.push(fillWith);
      return slice;
    });
  }

  function inject(memo, iterator, context) {
    this.each(function(value, index) {
      memo = iterator.call(context, memo, value, index);
    });
    return memo;
  }

  function invoke(method) {
    var args = $A(arguments).slice(1);
    return this.map(function(value) {
      return value[method].apply(value, args);
    });
  }

  function max(iterator, context) {
    iterator = iterator || Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator.call(context, value, index);
      if (result == null || value >= result)
        result = value;
    });
    return result;
  }

  function min(iterator, context) {
    iterator = iterator || Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator.call(context, value, index);
      if (result == null || value < result)
        result = value;
    });
    return result;
  }

  function partition(iterator, context) {
    iterator = iterator || Prototype.K;
    var trues = [], falses = [];
    this.each(function(value, index) {
      (iterator.call(context, value, index) ?
        trues : falses).push(value);
    });
    return [trues, falses];
  }

  function pluck(property) {
    var results = [];
    this.each(function(value) {
      results.push(value[property]);
    });
    return results;
  }

  function reject(iterator, context) {
    var results = [];
    this.each(function(value, index) {
      if (!iterator.call(context, value, index))
        results.push(value);
    });
    return results;
  }

  function sortBy(iterator, context) {
    return this.map(function(value, index) {
      return {
        value: value,
        criteria: iterator.call(context, value, index)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }).pluck('value');
  }

  function toArray() {
    return this.map();
  }

  function zip() {
    var iterator = Prototype.K, args = $A(arguments);
    if (Object.isFunction(args.last()))
      iterator = args.pop();

    var collections = [this].concat(args).map($A);
    return this.map(function(value, index) {
      return iterator(collections.pluck(index));
    });
  }

  function size() {
    return this.toArray().length;
  }

  function inspect() {
    return '#<Enumerable:' + this.toArray().inspect() + '>';
  }









  return {
    each:       each,
    eachSlice:  eachSlice,
    all:        all,
    every:      all,
    any:        any,
    some:       any,
    collect:    collect,
    map:        collect,
    detect:     detect,
    findAll:    findAll,
    select:     findAll,
    filter:     findAll,
    grep:       grep,
    include:    include,
    member:     include,
    inGroupsOf: inGroupsOf,
    inject:     inject,
    invoke:     invoke,
    max:        max,
    min:        min,
    partition:  partition,
    pluck:      pluck,
    reject:     reject,
    sortBy:     sortBy,
    toArray:    toArray,
    entries:    toArray,
    zip:        zip,
    size:       size,
    inspect:    inspect,
    find:       detect
  };
})();
function $A(iterable) {
  if (!iterable) return [];
  if ('toArray' in Object(iterable)) return iterable.toArray();
  var length = iterable.length || 0, results = new Array(length);
  while (length--) results[length] = iterable[length];
  return results;
}

function $w(string) {
  if (!Object.isString(string)) return [];
  string = string.strip();
  return string ? string.split(/\s+/) : [];
}

Array.from = $A;


(function() {
  var arrayProto = Array.prototype,
      slice = arrayProto.slice,
      _each = arrayProto.forEach; // use native browser JS 1.6 implementation if available

  function each(iterator) {
    for (var i = 0, length = this.length; i < length; i++)
      iterator(this[i]);
  }
  if (!_each) _each = each;

  function clear() {
    this.length = 0;
    return this;
  }

  function first() {
    return this[0];
  }

  function last() {
    return this[this.length - 1];
  }

  function compact() {
    return this.select(function(value) {
      return value != null;
    });
  }

  function flatten() {
    return this.inject([], function(array, value) {
      if (Object.isArray(value))
        return array.concat(value.flatten());
      array.push(value);
      return array;
    });
  }

  function without() {
    var values = slice.call(arguments, 0);
    return this.select(function(value) {
      return !values.include(value);
    });
  }

  function reverse(inline) {
    return (inline === false ? this.toArray() : this)._reverse();
  }

  function uniq(sorted) {
    return this.inject([], function(array, value, index) {
      if (0 == index || (sorted ? array.last() != value : !array.include(value)))
        array.push(value);
      return array;
    });
  }

  function intersect(array) {
    return this.uniq().findAll(function(item) {
      return array.detect(function(value) { return item === value });
    });
  }


  function clone() {
    return slice.call(this, 0);
  }

  function size() {
    return this.length;
  }

  function inspect() {
    return '[' + this.map(Object.inspect).join(', ') + ']';
  }

  function toJSON() {
    var results = [];
    this.each(function(object) {
      var value = Object.toJSON(object);
      if (!Object.isUndefined(value)) results.push(value);
    });
    return '[' + results.join(', ') + ']';
  }

  function indexOf(item, i) {
    i || (i = 0);
    var length = this.length;
    if (i < 0) i = length + i;
    for (; i < length; i++)
      if (this[i] === item) return i;
    return -1;
  }

  function lastIndexOf(item, i) {
    i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
    var n = this.slice(0, i).reverse().indexOf(item);
    return (n < 0) ? n : i - n - 1;
  }

  function concat() {
    var array = slice.call(this, 0), item;
    for (var i = 0, length = arguments.length; i < length; i++) {
      item = arguments[i];
      if (Object.isArray(item) && !('callee' in item)) {
        for (var j = 0, arrayLength = item.length; j < arrayLength; j++)
          array.push(item[j]);
      } else {
        array.push(item);
      }
    }
    return array;
  }

  Object.extend(arrayProto, Enumerable);

  if (!arrayProto._reverse)
    arrayProto._reverse = arrayProto.reverse;

  Object.extend(arrayProto, {
    _each:     _each,
    clear:     clear,
    first:     first,
    last:      last,
    compact:   compact,
    flatten:   flatten,
    without:   without,
    reverse:   reverse,
    uniq:      uniq,
    intersect: intersect,
    clone:     clone,
    toArray:   clone,
    size:      size,
    inspect:   inspect,
    toJSON:    toJSON
  });

  var CONCAT_ARGUMENTS_BUGGY = (function() {
    return [].concat(arguments)[0][0] !== 1;
  })(1,2)

  if (CONCAT_ARGUMENTS_BUGGY) arrayProto.concat = concat;

  if (!arrayProto.indexOf) arrayProto.indexOf = indexOf;
  if (!arrayProto.lastIndexOf) arrayProto.lastIndexOf = lastIndexOf;
})();
function $H(object) {
  return new Hash(object);
};

var Hash = Class.create(Enumerable, (function() {
  function initialize(object) {
    this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
  }


  function _each(iterator) {
    for (var key in this._object) {
      var value = this._object[key], pair = [key, value];
      pair.key = key;
      pair.value = value;
      iterator(pair);
    }
  }

  function set(key, value) {
    return this._object[key] = value;
  }

  function get(key) {
    if (this._object[key] !== Object.prototype[key])
      return this._object[key];
  }

  function unset(key) {
    var value = this._object[key];
    delete this._object[key];
    return value;
  }

  function toObject() {
    return Object.clone(this._object);
  }

  function keys() {
    return this.pluck('key');
  }

  function values() {
    return this.pluck('value');
  }

  function index(value) {
    var match = this.detect(function(pair) {
      return pair.value === value;
    });
    return match && match.key;
  }

  function merge(object) {
    return this.clone().update(object);
  }

  function update(object) {
    return new Hash(object).inject(this, function(result, pair) {
      result.set(pair.key, pair.value);
      return result;
    });
  }

  function toQueryPair(key, value) {
    if (Object.isUndefined(value)) return key;
    return key + '=' + encodeURIComponent(String.interpret(value));
  }

  function toQueryString() {
    return this.inject([], function(results, pair) {
      var key = encodeURIComponent(pair.key), values = pair.value;

      if (values && typeof values == 'object') {
        if (Object.isArray(values))
          return results.concat(values.map(toQueryPair.curry(key)));
      } else results.push(toQueryPair(key, values));
      return results;
    }).join('&');
  }

  function inspect() {
    return '#<Hash:{' + this.map(function(pair) {
      return pair.map(Object.inspect).join(': ');
    }).join(', ') + '}>';
  }

  function toJSON() {
    return Object.toJSON(this.toObject());
  }

  function clone() {
    return new Hash(this);
  }

  return {
    initialize:             initialize,
    _each:                  _each,
    set:                    set,
    get:                    get,
    unset:                  unset,
    toObject:               toObject,
    toTemplateReplacements: toObject,
    keys:                   keys,
    values:                 values,
    index:                  index,
    merge:                  merge,
    update:                 update,
    toQueryString:          toQueryString,
    inspect:                inspect,
    toJSON:                 toJSON,
    clone:                  clone
  };
})());

Hash.from = $H;
Object.extend(Number.prototype, (function() {
  function toColorPart() {
    return this.toPaddedString(2, 16);
  }

  function succ() {
    return this + 1;
  }

  function times(iterator, context) {
    $R(0, this, true).each(iterator, context);
    return this;
  }

  function toPaddedString(length, radix) {
    var string = this.toString(radix || 10);
    return '0'.times(length - string.length) + string;
  }

  function toJSON() {
    return isFinite(this) ? this.toString() : 'null';
  }

  function abs() {
    return Math.abs(this);
  }

  function round() {
    return Math.round(this);
  }

  function ceil() {
    return Math.ceil(this);
  }

  function floor() {
    return Math.floor(this);
  }

  return {
    toColorPart:    toColorPart,
    succ:           succ,
    times:          times,
    toPaddedString: toPaddedString,
    toJSON:         toJSON,
    abs:            abs,
    round:          round,
    ceil:           ceil,
    floor:          floor
  };
})());

function $R(start, end, exclusive) {
  return new ObjectRange(start, end, exclusive);
}

var ObjectRange = Class.create(Enumerable, (function() {
  function initialize(start, end, exclusive) {
    this.start = start;
    this.end = end;
    this.exclusive = exclusive;
  }

  function _each(iterator) {
    var value = this.start;
    while (this.include(value)) {
      iterator(value);
      value = value.succ();
    }
  }

  function include(value) {
    if (value < this.start)
      return false;
    if (this.exclusive)
      return value < this.end;
    return value <= this.end;
  }

  return {
    initialize: initialize,
    _each:      _each,
    include:    include
  };
})());



var Ajax = {
  getTransport: function() {
    return Try.these(
      function() {return new XMLHttpRequest()},
      function() {return new ActiveXObject('Msxml2.XMLHTTP')},
      function() {return new ActiveXObject('Microsoft.XMLHTTP')}
    ) || false;
  },

  activeRequestCount: 0
};

Ajax.Responders = {
  responders: [],

  _each: function(iterator) {
    this.responders._each(iterator);
  },

  register: function(responder) {
    if (!this.include(responder))
      this.responders.push(responder);
  },

  unregister: function(responder) {
    this.responders = this.responders.without(responder);
  },

  dispatch: function(callback, request, transport, json) {
    this.each(function(responder) {
      if (Object.isFunction(responder[callback])) {
        try {
          responder[callback].apply(responder, [request, transport, json]);
        } catch (e) { }
      }
    });
  }
};

Object.extend(Ajax.Responders, Enumerable);

Ajax.Responders.register({
  onCreate:   function() { Ajax.activeRequestCount++ },
  onComplete: function() { Ajax.activeRequestCount-- }
});
Ajax.Base = Class.create({
  initialize: function(options) {
    this.options = {
      method:       'post',
      asynchronous: true,
      contentType:  'application/x-www-form-urlencoded',
      encoding:     'UTF-8',
      parameters:   '',
      evalJSON:     true,
      evalJS:       true
    };
    Object.extend(this.options, options || { });

    this.options.method = this.options.method.toLowerCase();

    if (Object.isString(this.options.parameters))
      this.options.parameters = this.options.parameters.toQueryParams();
    else if (Object.isHash(this.options.parameters))
      this.options.parameters = this.options.parameters.toObject();
  }
});
Ajax.Request = Class.create(Ajax.Base, {
  _complete: false,

  initialize: function($super, url, options) {
    $super(options);
    this.transport = Ajax.getTransport();
    this.request(url);
  },

  request: function(url) {
    this.url = url;
    this.method = this.options.method;
    var params = Object.clone(this.options.parameters);

    if (!['get', 'post'].include(this.method)) {
      params['_method'] = this.method;
      this.method = 'post';
    }

    this.parameters = params;

    if (params = Object.toQueryString(params)) {
      if (this.method == 'get')
        this.url += (this.url.include('?') ? '&' : '?') + params;
      else if (/Konqueror|Safari|KHTML/.test(navigator.userAgent))
        params += '&_=';
    }

    try {
      var response = new Ajax.Response(this);
      if (this.options.onCreate) this.options.onCreate(response);
      Ajax.Responders.dispatch('onCreate', this, response);

      this.transport.open(this.method.toUpperCase(), this.url,
        this.options.asynchronous);

      if (this.options.asynchronous) this.respondToReadyState.bind(this).defer(1);

      this.transport.onreadystatechange = this.onStateChange.bind(this);
      this.setRequestHeaders();

      this.body = this.method == 'post' ? (this.options.postBody || params) : null;
      this.transport.send(this.body);

      /* Force Firefox to handle ready state 4 for synchronous requests */
      if (!this.options.asynchronous && this.transport.overrideMimeType)
        this.onStateChange();

    }
    catch (e) {
      this.dispatchException(e);
    }
  },

  onStateChange: function() {
    var readyState = this.transport.readyState;
    if (readyState > 1 && !((readyState == 4) && this._complete))
      this.respondToReadyState(this.transport.readyState);
  },

  setRequestHeaders: function() {
    var headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Prototype-Version': Prototype.Version,
      'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    };

    if (this.method == 'post') {
      headers['Content-type'] = this.options.contentType +
        (this.options.encoding ? '; charset=' + this.options.encoding : '');

      /* Force "Connection: close" for older Mozilla browsers to work
       * around a bug where XMLHttpRequest sends an incorrect
       * Content-length header. See Mozilla Bugzilla #246651.
       */
      if (this.transport.overrideMimeType &&
          (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
            headers['Connection'] = 'close';
    }

    if (typeof this.options.requestHeaders == 'object') {
      var extras = this.options.requestHeaders;

      if (Object.isFunction(extras.push))
        for (var i = 0, length = extras.length; i < length; i += 2)
          headers[extras[i]] = extras[i+1];
      else
        $H(extras).each(function(pair) { headers[pair.key] = pair.value });
    }

    for (var name in headers)
      this.transport.setRequestHeader(name, headers[name]);
  },

  success: function() {
    var status = this.getStatus();
    return !status || (status >= 200 && status < 300);
  },

  getStatus: function() {
    try {
      return this.transport.status || 0;
    } catch (e) { return 0 }
  },

  respondToReadyState: function(readyState) {
    var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);

    if (state == 'Complete') {
      try {
        this._complete = true;
        (this.options['on' + response.status]
         || this.options['on' + (this.success() ? 'Success' : 'Failure')]
         || Prototype.emptyFunction)(response, response.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }

      var contentType = response.getHeader('Content-type');
      if (this.options.evalJS == 'force'
          || (this.options.evalJS && this.isSameOrigin() && contentType
          && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))
        this.evalResponse();
    }

    try {
      (this.options['on' + state] || Prototype.emptyFunction)(response, response.headerJSON);
      Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
    } catch (e) {
      this.dispatchException(e);
    }

    if (state == 'Complete') {
      this.transport.onreadystatechange = Prototype.emptyFunction;
    }
  },

  isSameOrigin: function() {
    var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
    return !m || (m[0] == '#{protocol}//#{domain}#{port}'.interpolate({
      protocol: location.protocol,
      domain: document.domain,
      port: location.port ? ':' + location.port : ''
    }));
  },

  getHeader: function(name) {
    try {
      return this.transport.getResponseHeader(name) || null;
    } catch (e) { return null; }
  },

  evalResponse: function() {
    try {
      return eval((this.transport.responseText || '').unfilterJSON());
    } catch (e) {
      this.dispatchException(e);
    }
  },

  dispatchException: function(exception) {
    (this.options.onException || Prototype.emptyFunction)(this, exception);
    Ajax.Responders.dispatch('onException', this, exception);
  }
});

Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];








Ajax.Response = Class.create({
  initialize: function(request){
    this.request = request;
    var transport  = this.transport  = request.transport,
        readyState = this.readyState = transport.readyState;

    if ((readyState > 2 && !Prototype.Browser.IE) || readyState == 4) {
      this.status       = this.getStatus();
      this.statusText   = this.getStatusText();
      this.responseText = String.interpret(transport.responseText);
      this.headerJSON   = this._getHeaderJSON();
    }

    if (readyState == 4) {
      var xml = transport.responseXML;
      this.responseXML  = Object.isUndefined(xml) ? null : xml;
      this.responseJSON = this._getResponseJSON();
    }
  },

  status:      0,

  statusText: '',

  getStatus: Ajax.Request.prototype.getStatus,

  getStatusText: function() {
    try {
      return this.transport.statusText || '';
    } catch (e) { return '' }
  },

  getHeader: Ajax.Request.prototype.getHeader,

  getAllHeaders: function() {
    try {
      return this.getAllResponseHeaders();
    } catch (e) { return null }
  },

  getResponseHeader: function(name) {
    return this.transport.getResponseHeader(name);
  },

  getAllResponseHeaders: function() {
    return this.transport.getAllResponseHeaders();
  },

  _getHeaderJSON: function() {
    var json = this.getHeader('X-JSON');
    if (!json) return null;
    json = decodeURIComponent(escape(json));
    try {
      return json.evalJSON(this.request.options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  },

  _getResponseJSON: function() {
    var options = this.request.options;
    if (!options.evalJSON || (options.evalJSON != 'force' &&
      !(this.getHeader('Content-type') || '').include('application/json')) ||
        this.responseText.blank())
          return null;
    try {
      return this.responseText.evalJSON(options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  }
});

Ajax.Updater = Class.create(Ajax.Request, {
  initialize: function($super, container, url, options) {
    this.container = {
      success: (container.success || container),
      failure: (container.failure || (container.success ? null : container))
    };

    options = Object.clone(options);
    var onComplete = options.onComplete;
    options.onComplete = (function(response, json) {
      this.updateContent(response.responseText);
      if (Object.isFunction(onComplete)) onComplete(response, json);
    }).bind(this);

    $super(url, options);
  },

  updateContent: function(responseText) {
    var receiver = this.container[this.success() ? 'success' : 'failure'],
        options = this.options;

    if (!options.evalScripts) responseText = responseText.stripScripts();

    if (receiver = $(receiver)) {
      if (options.insertion) {
        if (Object.isString(options.insertion)) {
          var insertion = { }; insertion[options.insertion] = responseText;
          receiver.insert(insertion);
        }
        else options.insertion(receiver, responseText);
      }
      else receiver.update(responseText);
    }
  }
});

Ajax.PeriodicalUpdater = Class.create(Ajax.Base, {
  initialize: function($super, container, url, options) {
    $super(options);
    this.onComplete = this.options.onComplete;

    this.frequency = (this.options.frequency || 2);
    this.decay = (this.options.decay || 1);

    this.updater = { };
    this.container = container;
    this.url = url;

    this.start();
  },

  start: function() {
    this.options.onComplete = this.updateComplete.bind(this);
    this.onTimerEvent();
  },

  stop: function() {
    this.updater.options.onComplete = undefined;
    clearTimeout(this.timer);
    (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
  },

  updateComplete: function(response) {
    if (this.options.decay) {
      this.decay = (response.responseText == this.lastText ?
        this.decay * this.options.decay : 1);

      this.lastText = response.responseText;
    }
    this.timer = this.onTimerEvent.bind(this).delay(this.decay * this.frequency);
  },

  onTimerEvent: function() {
    this.updater = new Ajax.Updater(this.container, this.url, this.options);
  }
});



function $(element) {
  if (arguments.length > 1) {
    for (var i = 0, elements = [], length = arguments.length; i < length; i++)
      elements.push($(arguments[i]));
    return elements;
  }
  if (Object.isString(element))
    element = document.getElementById(element);
  return Element.extend(element);
}

if (Prototype.BrowserFeatures.XPath) {
  document._getElementsByXPath = function(expression, parentElement) {
    var results = [];
    var query = document.evaluate(expression, $(parentElement) || document,
      null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0, length = query.snapshotLength; i < length; i++)
      results.push(Element.extend(query.snapshotItem(i)));
    return results;
  };
}

/*--------------------------------------------------------------------------*/

if (!window.Node) var Node = { };

if (!Node.ELEMENT_NODE) {
  Object.extend(Node, {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
  });
}


(function(global) {

  var SETATTRIBUTE_IGNORES_NAME = (function(){
    var elForm = document.createElement("form"),
        elInput = document.createElement("input"),
        root = document.documentElement;
    elInput.setAttribute("name", "test");
    elForm.appendChild(elInput);
    root.appendChild(elForm);
    var isBuggy = elForm.elements
      ? (typeof elForm.elements.test == "undefined")
      : null;
    root.removeChild(elForm);
    elForm = elInput = null;
    return isBuggy;
  })();

  var element = global.Element;
  global.Element = function(tagName, attributes) {
    attributes = attributes || { };
    tagName = tagName.toLowerCase();
    var cache = Element.cache;
    if (SETATTRIBUTE_IGNORES_NAME && attributes.name) {
      tagName = '<' + tagName + ' name="' + attributes.name + '">';
      delete attributes.name;
      return Element.writeAttribute(document.createElement(tagName), attributes);
    }
    if (!cache[tagName]) cache[tagName] = Element.extend(document.createElement(tagName));
    return Element.writeAttribute(cache[tagName].cloneNode(false), attributes);
  };
  Object.extend(global.Element, element || { });
  if (element) global.Element.prototype = element.prototype;
})(this);

Element.cache = { };
Element.idCounter = 1;

Element.Methods = {
  visible: function(element) {
    return $(element).style.display != 'none';
  },

  toggle: function(element) {
    element = $(element);
    Element[Element.visible(element) ? 'hide' : 'show'](element);
    return element;
  },


  hide: function(element) {
    element = $(element);
    element.style.display = 'none';
    return element;
  },

  show: function(element) {
    element = $(element);
    element.style.display = '';
    return element;
  },

  remove: function(element) {
    element = $(element);
    element.parentNode.removeChild(element);
    return element;
  },

  update: (function(){

    var SELECT_ELEMENT_INNERHTML_BUGGY = (function(){
      var el = document.createElement("select"),
          isBuggy = true;
      el.innerHTML = "<option value=\"test\">test</option>";
      if (el.options && el.options[0]) {
        isBuggy = el.options[0].nodeName.toUpperCase() !== "OPTION";
      }
      el = null;
      return isBuggy;
    })();

    var TABLE_ELEMENT_INNERHTML_BUGGY = (function(){
      try {
        var el = document.createElement("table");
        if (el && el.tBodies) {
          el.innerHTML = "<tbody><tr><td>test</td></tr></tbody>";
          var isBuggy = typeof el.tBodies[0] == "undefined";
          el = null;
          return isBuggy;
        }
      } catch (e) {
        return true;
      }
    })();

    var SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING = (function () {
      var s = document.createElement("script"),
          isBuggy = false;
      try {
        s.appendChild(document.createTextNode(""));
        isBuggy = !s.firstChild ||
          s.firstChild && s.firstChild.nodeType !== 3;
      } catch (e) {
        isBuggy = true;
      }
      s = null;
      return isBuggy;
    })();

    function update(element, content) {
      element = $(element);

      if (content && content.toElement)
        content = content.toElement();

      if (Object.isElement(content))
        return element.update().insert(content);

      content = Object.toHTML(content);

      var tagName = element.tagName.toUpperCase();

      if (tagName === 'SCRIPT' && SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING) {
        element.text = content;
        return element;
      }

      if (SELECT_ELEMENT_INNERHTML_BUGGY || TABLE_ELEMENT_INNERHTML_BUGGY) {
        if (tagName in Element._insertionTranslations.tags) {
          while (element.firstChild) {
            element.removeChild(element.firstChild);
          }
          Element._getContentFromAnonymousElement(tagName, content.stripScripts())
            .each(function(node) {
              element.appendChild(node)
            });
        }
        else {
          element.innerHTML = content.stripScripts();
        }
      }
      else {
        element.innerHTML = content.stripScripts();
      }

      content.evalScripts.bind(content).defer();
      return element;
    }

    return update;
  })(),

  replace: function(element, content) {
    element = $(element);
    if (content && content.toElement) content = content.toElement();
    else if (!Object.isElement(content)) {
      content = Object.toHTML(content);
      var range = element.ownerDocument.createRange();
      range.selectNode(element);
      content.evalScripts.bind(content).defer();
      content = range.createContextualFragment(content.stripScripts());
    }
    element.parentNode.replaceChild(content, element);
    return element;
  },

  insert: function(element, insertions) {
    element = $(element);

    if (Object.isString(insertions) || Object.isNumber(insertions) ||
        Object.isElement(insertions) || (insertions && (insertions.toElement || insertions.toHTML)))
          insertions = {bottom:insertions};

    var content, insert, tagName, childNodes;

    for (var position in insertions) {
      content  = insertions[position];
      position = position.toLowerCase();
      insert = Element._insertionTranslations[position];

      if (content && content.toElement) content = content.toElement();
      if (Object.isElement(content)) {
        insert(element, content);
        continue;
      }

      content = Object.toHTML(content);

      tagName = ((position == 'before' || position == 'after')
        ? element.parentNode : element).tagName.toUpperCase();

      childNodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts());

      if (position == 'top' || position == 'after') childNodes.reverse();
      childNodes.each(insert.curry(element));

      content.evalScripts.bind(content).defer();
    }

    return element;
  },

  wrap: function(element, wrapper, attributes) {
    element = $(element);
    if (Object.isElement(wrapper))
      $(wrapper).writeAttribute(attributes || { });
    else if (Object.isString(wrapper)) wrapper = new Element(wrapper, attributes);
    else wrapper = new Element('div', wrapper);
    if (element.parentNode)
      element.parentNode.replaceChild(wrapper, element);
    wrapper.appendChild(element);
    return wrapper;
  },

  inspect: function(element) {
    element = $(element);
    var result = '<' + element.tagName.toLowerCase();
    $H({'id': 'id', 'className': 'class'}).each(function(pair) {
      var property = pair.first(),
          attribute = pair.last(),
          value = (element[property] || '').toString();
      if (value) result += ' ' + attribute + '=' + value.inspect(true);
    });
    return result + '>';
  },

  recursivelyCollect: function(element, property, maximumLength) {
    element = $(element);
    maximumLength = maximumLength || -1;
    var elements = [];

    while (element = element[property]) {
      if (element.nodeType == 1)
        elements.push(Element.extend(element));
      if (elements.length == maximumLength)
        break;
    }

    return elements;
  },

  ancestors: function(element) {
    return Element.recursivelyCollect(element, 'parentNode');
  },

  descendants: function(element) {
    return Element.select(element, "*");
  },

  firstDescendant: function(element) {
    element = $(element).firstChild;
    while (element && element.nodeType != 1) element = element.nextSibling;
    return $(element);
  },

  immediateDescendants: function(element) {
    var results = [], child = $(element).firstChild;
    while (child) {
      if (child.nodeType === 1) {
        results.push(Element.extend(child));
      }
      child = child.nextSibling;
    }
    return results;
  },

  previousSiblings: function(element, maximumLength) {
    return Element.recursivelyCollect(element, 'previousSibling');
  },

  nextSiblings: function(element) {
    return Element.recursivelyCollect(element, 'nextSibling');
  },

  siblings: function(element) {
    element = $(element);
    return Element.previousSiblings(element).reverse()
      .concat(Element.nextSiblings(element));
  },

  match: function(element, selector) {
    element = $(element);
    if (Object.isString(selector))
      return Prototype.Selector.match(element, selector);
    return selector.match(element);
  },

  up: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(element.parentNode);
    var ancestors = Element.ancestors(element);
    return Object.isNumber(expression) ? ancestors[expression] :
      Prototype.Selector.find(ancestors, expression, index);
  },

  down: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return Element.firstDescendant(element);
    return Object.isNumber(expression) ? Element.descendants(element)[expression] :
      Element.select(element, expression)[index || 0];
  },

  previous: function(element, expression, index) {
    element = $(element);
    if (Object.isNumber(expression)) index = expression, expression = false;
    if (!Object.isNumber(index)) index = 0;

    if (expression) {
      return Prototype.Selector.find(element.previousSiblings(), expression, index);
    } else {
      return element.recursivelyCollect("previousSibling", index + 1)[index];
    }
  },

  next: function(element, expression, index) {
    element = $(element);
    if (Object.isNumber(expression)) index = expression, expression = false;
    if (!Object.isNumber(index)) index = 0;

    if (expression) {
      return Prototype.Selector.find(element.nextSiblings(), expression, index);
    } else {
      var maximumLength = Object.isNumber(index) ? index + 1 : 1;
      return element.recursivelyCollect("nextSibling", index + 1)[index];
    }
  },


  select: function(element) {
    element = $(element);
    var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
    return Prototype.Selector.select(expressions, element);
  },

  adjacent: function(element) {
    element = $(element);
    var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
    return Prototype.Selector.select(expressions, element.parentNode).without(element);
  },

  identify: function(element) {
    element = $(element);
    var id = Element.readAttribute(element, 'id');
    if (id) return id;
    do { id = 'anonymous_element_' + Element.idCounter++ } while ($(id));
    Element.writeAttribute(element, 'id', id);
    return id;
  },

  readAttribute: function(element, name) {
    element = $(element);
    if (Prototype.Browser.IE) {
      var t = Element._attributeTranslations.read;
      if (t.values[name]) return t.values[name](element, name);
      if (t.names[name]) name = t.names[name];
      if (name.include(':')) {
        return (!element.attributes || !element.attributes[name]) ? null :
         element.attributes[name].value;
      }
    }
    return element.getAttribute(name);
  },

  writeAttribute: function(element, name, value) {
    element = $(element);
    var attributes = { }, t = Element._attributeTranslations.write;

    if (typeof name == 'object') attributes = name;
    else attributes[name] = Object.isUndefined(value) ? true : value;

    for (var attr in attributes) {
      name = t.names[attr] || attr;
      value = attributes[attr];
      if (t.values[attr]) name = t.values[attr](element, value);
      if (value === false || value === null)
        element.removeAttribute(name);
      else if (value === true)
        element.setAttribute(name, name);
      else element.setAttribute(name, value);
    }
    return element;
  },

  getHeight: function(element) {
    return Element.getDimensions(element).height;
  },

  getWidth: function(element) {
    return Element.getDimensions(element).width;
  },

  classNames: function(element) {
    return new Element.ClassNames(element);
  },

  hasClassName: function(element, className) {
    if (!(element = $(element))) return;
    var elementClassName = element.className;
    return (elementClassName.length > 0 && (elementClassName == className ||
      new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
  },

  addClassName: function(element, className) {
    if (!(element = $(element))) return;
    if (!Element.hasClassName(element, className))
      element.className += (element.className ? ' ' : '') + className;
    return element;
  },

  removeClassName: function(element, className) {
    if (!(element = $(element))) return;
    element.className = element.className.replace(
      new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
    return element;
  },

  toggleClassName: function(element, className) {
    if (!(element = $(element))) return;
    return Element[Element.hasClassName(element, className) ?
      'removeClassName' : 'addClassName'](element, className);
  },

  cleanWhitespace: function(element) {
    element = $(element);
    var node = element.firstChild;
    while (node) {
      var nextNode = node.nextSibling;
      if (node.nodeType == 3 && !/\S/.test(node.nodeValue))
        element.removeChild(node);
      node = nextNode;
    }
    return element;
  },

  empty: function(element) {
    return $(element).innerHTML.blank();
  },

  descendantOf: function(element, ancestor) {
    element = $(element), ancestor = $(ancestor);

    if (element.compareDocumentPosition)
      return (element.compareDocumentPosition(ancestor) & 8) === 8;

    if (ancestor.contains)
      return ancestor.contains(element) && ancestor !== element;

    while (element = element.parentNode)
      if (element == ancestor) return true;

    return false;
  },

  scrollTo: function(element) {
    element = $(element);
    var pos = Element.cumulativeOffset(element);
    window.scrollTo(pos[0], pos[1]);
    return element;
  },

  getStyle: function(element, style) {
    element = $(element);
    style = style == 'float' ? 'cssFloat' : style.camelize();
    var value = element.style[style];
    if (!value || value == 'auto') {
      var css = document.defaultView.getComputedStyle(element, null);
      value = css ? css[style] : null;
    }
    if (style == 'opacity') return value ? parseFloat(value) : 1.0;
    return value == 'auto' ? null : value;
  },

  getOpacity: function(element) {
    return $(element).getStyle('opacity');
  },

  setStyle: function(element, styles) {
    element = $(element);
    var elementStyle = element.style, match;
    if (Object.isString(styles)) {
      element.style.cssText += ';' + styles;
      return styles.include('opacity') ?
        element.setOpacity(styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
    }
    for (var property in styles)
      if (property == 'opacity') element.setOpacity(styles[property]);
      else
        elementStyle[(property == 'float' || property == 'cssFloat') ?
          (Object.isUndefined(elementStyle.styleFloat) ? 'cssFloat' : 'styleFloat') :
            property] = styles[property];

    return element;
  },

  setOpacity: function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;
    return element;
  },

  getDimensions: function(element) {
    element = $(element);
    var display = Element.getStyle(element, 'display');
    if (display != 'none' && display != null) // Safari bug
      return {width: element.offsetWidth, height: element.offsetHeight};

    var els = element.style,
        originalVisibility = els.visibility,
        originalPosition = els.position,
        originalDisplay = els.display;
    els.visibility = 'hidden';
    if (originalPosition != 'fixed') // Switching fixed to absolute causes issues in Safari
      els.position = 'absolute';
    els.display = 'block';
    var originalWidth = element.clientWidth,
        originalHeight = element.clientHeight;
    els.display = originalDisplay;
    els.position = originalPosition;
    els.visibility = originalVisibility;
    return {width: originalWidth, height: originalHeight};
  },

  makePositioned: function(element) {
    element = $(element);
    var pos = Element.getStyle(element, 'position');
    if (pos == 'static' || !pos) {
      element._madePositioned = true;
      element.style.position = 'relative';
      if (Prototype.Browser.Opera) {
        element.style.top = 0;
        element.style.left = 0;
      }
    }
    return element;
  },

  undoPositioned: function(element) {
    element = $(element);
    if (element._madePositioned) {
      element._madePositioned = undefined;
      element.style.position =
        element.style.top =
        element.style.left =
        element.style.bottom =
        element.style.right = '';
    }
    return element;
  },

  makeClipping: function(element) {
    element = $(element);
    if (element._overflow) return element;
    element._overflow = Element.getStyle(element, 'overflow') || 'auto';
    if (element._overflow !== 'hidden')
      element.style.overflow = 'hidden';
    return element;
  },

  undoClipping: function(element) {
    element = $(element);
    if (!element._overflow) return element;
    element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
    element._overflow = null;
    return element;
  },

  cumulativeOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
    } while (element);
    return Element._returnOffset(valueL, valueT);
  },

  positionedOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
      if (element) {
        if (element.tagName.toUpperCase() == 'BODY') break;
        var p = Element.getStyle(element, 'position');
        if (p !== 'static') break;
      }
    } while (element);
    return Element._returnOffset(valueL, valueT);
  },

  absolutize: function(element) {
    element = $(element);
    if (Element.getStyle(element, 'position') == 'absolute') return element;

    var offsets = Element.positionedOffset(element),
        top     = offsets[1],
        left    = offsets[0],
        width   = element.clientWidth,
        height  = element.clientHeight;

    element._originalLeft   = left - parseFloat(element.style.left  || 0);
    element._originalTop    = top  - parseFloat(element.style.top || 0);
    element._originalWidth  = element.style.width;
    element._originalHeight = element.style.height;

    element.style.position = 'absolute';
    element.style.top    = top + 'px';
    element.style.left   = left + 'px';
    element.style.width  = width + 'px';
    element.style.height = height + 'px';
    return element;
  },

  relativize: function(element) {
    element = $(element);
    if (Element.getStyle(element, 'position') == 'relative') return element;

    element.style.position = 'relative';
    var top  = parseFloat(element.style.top  || 0) - (element._originalTop || 0),
        left = parseFloat(element.style.left || 0) - (element._originalLeft || 0);

    element.style.top    = top + 'px';
    element.style.left   = left + 'px';
    element.style.height = element._originalHeight;
    element.style.width  = element._originalWidth;
    return element;
  },

  cumulativeScrollOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.scrollTop  || 0;
      valueL += element.scrollLeft || 0;
      element = element.parentNode;
    } while (element);
    return Element._returnOffset(valueL, valueT);
  },

  getOffsetParent: function(element) {
    if (element.offsetParent) return $(element.offsetParent);
    if (element == document.body) return $(element);

    while ((element = element.parentNode) && element != document.body)
      if (Element.getStyle(element, 'position') != 'static')
        return $(element);

    return $(document.body);
  },

  viewportOffset: function(forElement) {
    var valueT = 0,
        valueL = 0,
        element = forElement;

    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;

      if (element.offsetParent == document.body &&
        Element.getStyle(element, 'position') == 'absolute') break;

    } while (element = element.offsetParent);

    element = forElement;
    do {
      if (!Prototype.Browser.Opera || (element.tagName && (element.tagName.toUpperCase() == 'BODY'))) {
        valueT -= element.scrollTop  || 0;
        valueL -= element.scrollLeft || 0;
      }
    } while (element = element.parentNode);

    return Element._returnOffset(valueL, valueT);
  },

  clonePosition: function(element, source) {
    var options = Object.extend({
      setLeft:    true,
      setTop:     true,
      setWidth:   true,
      setHeight:  true,
      offsetTop:  0,
      offsetLeft: 0
    }, arguments[2] || { });

    source = $(source);
    var p = Element.viewportOffset(source), delta = [0, 0], parent = null;

    element = $(element);

    if (Element.getStyle(element, 'position') == 'absolute') {
      parent = Element.getOffsetParent(element);
      delta = Element.viewportOffset(parent);
    }

    if (parent == document.body) {
      delta[0] -= document.body.offsetLeft;
      delta[1] -= document.body.offsetTop;
    }

    if (options.setLeft)   element.style.left  = (p[0] - delta[0] + options.offsetLeft) + 'px';
    if (options.setTop)    element.style.top   = (p[1] - delta[1] + options.offsetTop) + 'px';
    if (options.setWidth)  element.style.width = source.offsetWidth + 'px';
    if (options.setHeight) element.style.height = source.offsetHeight + 'px';
    return element;
  }
};

Object.extend(Element.Methods, {
  getElementsBySelector: Element.Methods.select,

  childElements: Element.Methods.immediateDescendants
});

Element._attributeTranslations = {
  write: {
    names: {
      className: 'class',
      htmlFor:   'for'
    },
    values: { }
  }
};

if (Prototype.Browser.Opera) {
  Element.Methods.getStyle = Element.Methods.getStyle.wrap(
    function(proceed, element, style) {
      switch (style) {
        case 'left': case 'top': case 'right': case 'bottom':
          if (proceed(element, 'position') === 'static') return null;
        case 'height': case 'width':
          if (!Element.visible(element)) return null;

          var dim = parseInt(proceed(element, style), 10);

          if (dim !== element['offset' + style.capitalize()])
            return dim + 'px';

          var properties;
          if (style === 'height') {
            properties = ['border-top-width', 'padding-top',
             'padding-bottom', 'border-bottom-width'];
          }
          else {
            properties = ['border-left-width', 'padding-left',
             'padding-right', 'border-right-width'];
          }
          return properties.inject(dim, function(memo, property) {
            var val = proceed(element, property);
            return val === null ? memo : memo - parseInt(val, 10);
          }) + 'px';
        default: return proceed(element, style);
      }
    }
  );

  Element.Methods.readAttribute = Element.Methods.readAttribute.wrap(
    function(proceed, element, attribute) {
      if (attribute === 'title') return element.title;
      return proceed(element, attribute);
    }
  );
}

else if (Prototype.Browser.IE) {
  Element.Methods.getOffsetParent = Element.Methods.getOffsetParent.wrap(
    function(proceed, element) {
      element = $(element);
      try { element.offsetParent }
      catch(e) { return $(document.body) }
      var position = element.getStyle('position');
      if (position !== 'static') return proceed(element);
      element.setStyle({ position: 'relative' });
      var value = proceed(element);
      element.setStyle({ position: position });
      return value;
    }
  );

  $w('positionedOffset viewportOffset').each(function(method) {
    Element.Methods[method] = Element.Methods[method].wrap(
      function(proceed, element) {
        element = $(element);
        try { element.offsetParent }
        catch(e) { return Element._returnOffset(0,0) }
        var position = element.getStyle('position');
        if (position !== 'static') return proceed(element);
        var offsetParent = element.getOffsetParent();
        if (offsetParent && offsetParent.getStyle('position') === 'fixed')
          offsetParent.setStyle({ zoom: 1 });
        element.setStyle({ position: 'relative' });
        var value = proceed(element);
        element.setStyle({ position: position });
        return value;
      }
    );
  });

  Element.Methods.cumulativeOffset = Element.Methods.cumulativeOffset.wrap(
    function(proceed, element) {
      try { element.offsetParent }
      catch(e) { return Element._returnOffset(0,0) }
      return proceed(element);
    }
  );

  Element.Methods.getStyle = function(element, style) {
    element = $(element);
    style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style.camelize();
    var value = element.style[style];
    if (!value && element.currentStyle) value = element.currentStyle[style];

    if (style == 'opacity') {
      if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/))
        if (value[1]) return parseFloat(value[1]) / 100;
      return 1.0;
    }

    if (value == 'auto') {
      if ((style == 'width' || style == 'height') && (element.getStyle('display') != 'none'))
        return element['offset' + style.capitalize()] + 'px';
      return null;
    }
    return value;
  };

  Element.Methods.setOpacity = function(element, value) {
    function stripAlpha(filter){
      return filter.replace(/alpha\([^\)]*\)/gi,'');
    }
    element = $(element);
    var currentStyle = element.currentStyle;
    if ((currentStyle && !currentStyle.hasLayout) ||
      (!currentStyle && element.style.zoom == 'normal'))
        element.style.zoom = 1;

    var filter = element.getStyle('filter'), style = element.style;
    if (value == 1 || value === '') {
      (filter = stripAlpha(filter)) ?
        style.filter = filter : style.removeAttribute('filter');
      return element;
    } else if (value < 0.00001) value = 0;
    style.filter = stripAlpha(filter) +
      'alpha(opacity=' + (value * 100) + ')';
    return element;
  };

  Element._attributeTranslations = (function(){

    var classProp = 'className',
        forProp = 'for',
        el = document.createElement('div');

    el.setAttribute(classProp, 'x');

    if (el.className !== 'x') {
      el.setAttribute('class', 'x');
      if (el.className === 'x') {
        classProp = 'class';
      }
    }
    el = null;

    el = document.createElement('label');
    el.setAttribute(forProp, 'x');
    if (el.htmlFor !== 'x') {
      el.setAttribute('htmlFor', 'x');
      if (el.htmlFor === 'x') {
        forProp = 'htmlFor';
      }
    }
    el = null;

    return {
      read: {
        names: {
          'class':      classProp,
          'className':  classProp,
          'for':        forProp,
          'htmlFor':    forProp
        },
        values: {
          _getAttr: function(element, attribute) {
            return element.getAttribute(attribute);
          },
          _getAttr2: function(element, attribute) {
            return element.getAttribute(attribute, 2);
          },
          _getAttrNode: function(element, attribute) {
            var node = element.getAttributeNode(attribute);
            return node ? node.value : "";
          },
          _getEv: (function(){

            var el = document.createElement('div'), f;
            el.onclick = Prototype.emptyFunction;
            var value = el.getAttribute('onclick');

            if (String(value).indexOf('{') > -1) {
              f = function(element, attribute) {
                attribute = element.getAttribute(attribute);
                if (!attribute) return null;
                attribute = attribute.toString();
                attribute = attribute.split('{')[1];
                attribute = attribute.split('}')[0];
                return attribute.strip();
              };
            }
            else if (value === '') {
              f = function(element, attribute) {
                attribute = element.getAttribute(attribute);
                if (!attribute) return null;
                return attribute.strip();
              };
            }
            el = null;
            return f;
          })(),
          _flag: function(element, attribute) {
            return $(element).hasAttribute(attribute) ? attribute : null;
          },
          style: function(element) {
            return element.style.cssText.toLowerCase();
          },
          title: function(element) {
            return element.title;
          }
        }
      }
    }
  })();

  Element._attributeTranslations.write = {
    names: Object.extend({
      cellpadding: 'cellPadding',
      cellspacing: 'cellSpacing'
    }, Element._attributeTranslations.read.names),
    values: {
      checked: function(element, value) {
        element.checked = !!value;
      },

      style: function(element, value) {
        element.style.cssText = value ? value : '';
      }
    }
  };

  Element._attributeTranslations.has = {};

  $w('colSpan rowSpan vAlign dateTime accessKey tabIndex ' +
      'encType maxLength readOnly longDesc frameBorder').each(function(attr) {
    Element._attributeTranslations.write.names[attr.toLowerCase()] = attr;
    Element._attributeTranslations.has[attr.toLowerCase()] = attr;
  });

  (function(v) {
    Object.extend(v, {
      href:        v._getAttr2,
      src:         v._getAttr2,
      type:        v._getAttr,
      action:      v._getAttrNode,
      disabled:    v._flag,
      checked:     v._flag,
      readonly:    v._flag,
      multiple:    v._flag,
      onload:      v._getEv,
      onunload:    v._getEv,
      onclick:     v._getEv,
      ondblclick:  v._getEv,
      onmousedown: v._getEv,
      onmouseup:   v._getEv,
      onmouseover: v._getEv,
      onmousemove: v._getEv,
      onmouseout:  v._getEv,
      onfocus:     v._getEv,
      onblur:      v._getEv,
      onkeypress:  v._getEv,
      onkeydown:   v._getEv,
      onkeyup:     v._getEv,
      onsubmit:    v._getEv,
      onreset:     v._getEv,
      onselect:    v._getEv,
      onchange:    v._getEv
    });
  })(Element._attributeTranslations.read.values);

  if (Prototype.BrowserFeatures.ElementExtensions) {
    (function() {
      function _descendants(element) {
        var nodes = element.getElementsByTagName('*'), results = [];
        for (var i = 0, node; node = nodes[i]; i++)
          if (node.tagName !== "!") // Filter out comment nodes.
            results.push(node);
        return results;
      }

      Element.Methods.down = function(element, expression, index) {
        element = $(element);
        if (arguments.length == 1) return element.firstDescendant();
        return Object.isNumber(expression) ? _descendants(element)[expression] :
          Element.select(element, expression)[index || 0];
      }
    })();
  }

}

else if (Prototype.Browser.Gecko && /rv:1\.8\.0/.test(navigator.userAgent)) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1) ? 0.999999 :
      (value === '') ? '' : (value < 0.00001) ? 0 : value;
    return element;
  };
}

else if (Prototype.Browser.WebKit) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;

    if (value == 1)
      if (element.tagName.toUpperCase() == 'IMG' && element.width) {
        element.width++; element.width--;
      } else try {
        var n = document.createTextNode(' ');
        element.appendChild(n);
        element.removeChild(n);
      } catch (e) { }

    return element;
  };

  Element.Methods.cumulativeOffset = function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      if (element.offsetParent == document.body)
        if (Element.getStyle(element, 'position') == 'absolute') break;

      element = element.offsetParent;
    } while (element);

    return Element._returnOffset(valueL, valueT);
  };
}

if ('outerHTML' in document.documentElement) {
  Element.Methods.replace = function(element, content) {
    element = $(element);

    if (content && content.toElement) content = content.toElement();
    if (Object.isElement(content)) {
      element.parentNode.replaceChild(content, element);
      return element;
    }

    content = Object.toHTML(content);
    var parent = element.parentNode, tagName = parent.tagName.toUpperCase();

    if (Element._insertionTranslations.tags[tagName]) {
      var nextSibling = element.next(),
          fragments = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
      parent.removeChild(element);
      if (nextSibling)
        fragments.each(function(node) { parent.insertBefore(node, nextSibling) });
      else
        fragments.each(function(node) { parent.appendChild(node) });
    }
    else element.outerHTML = content.stripScripts();

    content.evalScripts.bind(content).defer();
    return element;
  };
}

Element._returnOffset = function(l, t) {
  var result = [l, t];
  result.left = l;
  result.top = t;
  return result;
};

Element._getContentFromAnonymousElement = function(tagName, html) {
  var div = new Element('div'),
      t = Element._insertionTranslations.tags[tagName];
  if (t) {
    div.innerHTML = t[0] + html + t[1];
    for (var i = t[2]; i--; ) {
      div = div.firstChild;
    }
  }
  else {
    div.innerHTML = html;
  }
  return $A(div.childNodes);
};

Element._insertionTranslations = {
  before: function(element, node) {
    element.parentNode.insertBefore(node, element);
  },
  top: function(element, node) {
    element.insertBefore(node, element.firstChild);
  },
  bottom: function(element, node) {
    element.appendChild(node);
  },
  after: function(element, node) {
    element.parentNode.insertBefore(node, element.nextSibling);
  },
  tags: {
    TABLE:  ['<table>',                '</table>',                   1],
    TBODY:  ['<table><tbody>',         '</tbody></table>',           2],
    TR:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
    TD:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
    SELECT: ['<select>',               '</select>',                  1]
  }
};

(function() {
  var tags = Element._insertionTranslations.tags;
  Object.extend(tags, {
    THEAD: tags.TBODY,
    TFOOT: tags.TBODY,
    TH:    tags.TD
  });
})();

Element.Methods.Simulated = {
  hasAttribute: function(element, attribute) {
    attribute = Element._attributeTranslations.has[attribute] || attribute;
    var node = $(element).getAttributeNode(attribute);
    return !!(node && node.specified);
  }
};

Element.Methods.ByTag = { };

Object.extend(Element, Element.Methods);

(function(div) {

  if (!Prototype.BrowserFeatures.ElementExtensions && div['__proto__']) {
    window.HTMLElement = { };
    window.HTMLElement.prototype = div['__proto__'];
    Prototype.BrowserFeatures.ElementExtensions = true;
  }

  div = null;

})(document.createElement('div'));

Element.extend = (function() {

  function checkDeficiency(tagName) {
    if (typeof window.Element != 'undefined') {
      var proto = window.Element.prototype;
      if (proto) {
        var id = '_' + (Math.random()+'').slice(2),
            el = document.createElement(tagName);
        proto[id] = 'x';
        var isBuggy = (el[id] !== 'x');
        delete proto[id];
        el = null;
        return isBuggy;
      }
    }
    return false;
  }

  function extendElementWith(element, methods) {
    for (var property in methods) {
      var value = methods[property];
      if (Object.isFunction(value) && !(property in element))
        element[property] = value.methodize();
    }
  }

  var HTMLOBJECTELEMENT_PROTOTYPE_BUGGY = checkDeficiency('object');

  if (Prototype.BrowserFeatures.SpecificElementExtensions) {
    if (HTMLOBJECTELEMENT_PROTOTYPE_BUGGY) {
      return function(element) {
        if (element && typeof element._extendedByPrototype == 'undefined') {
          var t = element.tagName;
          if (t && (/^(?:object|applet|embed)$/i.test(t))) {
            extendElementWith(element, Element.Methods);
            extendElementWith(element, Element.Methods.Simulated);
            extendElementWith(element, Element.Methods.ByTag[t.toUpperCase()]);
          }
        }
        return element;
      }
    }
    return Prototype.K;
  }

  var Methods = { }, ByTag = Element.Methods.ByTag;

  var extend = Object.extend(function(element) {
    if (!element || typeof element._extendedByPrototype != 'undefined' ||
        element.nodeType != 1 || element == window) return element;

    var methods = Object.clone(Methods),
        tagName = element.tagName.toUpperCase();

    if (ByTag[tagName]) Object.extend(methods, ByTag[tagName]);

    extendElementWith(element, methods);

    element._extendedByPrototype = Prototype.emptyFunction;
    return element;

  }, {
    refresh: function() {
      if (!Prototype.BrowserFeatures.ElementExtensions) {
        Object.extend(Methods, Element.Methods);
        Object.extend(Methods, Element.Methods.Simulated);
      }
    }
  });

  extend.refresh();
  return extend;
})();

if (document.documentElement.hasAttribute) {
  Element.hasAttribute = function(element, attribute) {
    return element.hasAttribute(attribute);
  };
}
else {
  Element.hasAttribute = Element.Methods.Simulated.hasAttribute;
}

Element.addMethods = function(methods) {
  var F = Prototype.BrowserFeatures, T = Element.Methods.ByTag;

  if (!methods) {
    Object.extend(Form, Form.Methods);
    Object.extend(Form.Element, Form.Element.Methods);
    Object.extend(Element.Methods.ByTag, {
      "FORM":     Object.clone(Form.Methods),
      "INPUT":    Object.clone(Form.Element.Methods),
      "SELECT":   Object.clone(Form.Element.Methods),
      "TEXTAREA": Object.clone(Form.Element.Methods)
    });
  }

  if (arguments.length == 2) {
    var tagName = methods;
    methods = arguments[1];
  }

  if (!tagName) Object.extend(Element.Methods, methods || { });
  else {
    if (Object.isArray(tagName)) tagName.each(extend);
    else extend(tagName);
  }

  function extend(tagName) {
    tagName = tagName.toUpperCase();
    if (!Element.Methods.ByTag[tagName])
      Element.Methods.ByTag[tagName] = { };
    Object.extend(Element.Methods.ByTag[tagName], methods);
  }

  function copy(methods, destination, onlyIfAbsent) {
    onlyIfAbsent = onlyIfAbsent || false;
    for (var property in methods) {
      var value = methods[property];
      if (!Object.isFunction(value)) continue;
      if (!onlyIfAbsent || !(property in destination))
        destination[property] = value.methodize();
    }
  }

  function findDOMClass(tagName) {
    var klass;
    var trans = {
      "OPTGROUP": "OptGroup", "TEXTAREA": "TextArea", "P": "Paragraph",
      "FIELDSET": "FieldSet", "UL": "UList", "OL": "OList", "DL": "DList",
      "DIR": "Directory", "H1": "Heading", "H2": "Heading", "H3": "Heading",
      "H4": "Heading", "H5": "Heading", "H6": "Heading", "Q": "Quote",
      "INS": "Mod", "DEL": "Mod", "A": "Anchor", "IMG": "Image", "CAPTION":
      "TableCaption", "COL": "TableCol", "COLGROUP": "TableCol", "THEAD":
      "TableSection", "TFOOT": "TableSection", "TBODY": "TableSection", "TR":
      "TableRow", "TH": "TableCell", "TD": "TableCell", "FRAMESET":
      "FrameSet", "IFRAME": "IFrame"
    };
    if (trans[tagName]) klass = 'HTML' + trans[tagName] + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName.capitalize() + 'Element';
    if (window[klass]) return window[klass];

    var element = document.createElement(tagName),
        proto = element['__proto__'] || element.constructor.prototype;

    element = null;
    return proto;
  }

  var elementPrototype = window.HTMLElement ? HTMLElement.prototype :
   Element.prototype;

  if (F.ElementExtensions) {
    copy(Element.Methods, elementPrototype);
    copy(Element.Methods.Simulated, elementPrototype, true);
  }

  if (F.SpecificElementExtensions) {
    for (var tag in Element.Methods.ByTag) {
      var klass = findDOMClass(tag);
      if (Object.isUndefined(klass)) continue;
      copy(T[tag], klass.prototype);
    }
  }

  Object.extend(Element, Element.Methods);
  delete Element.ByTag;

  if (Element.extend.refresh) Element.extend.refresh();
  Element.cache = { };
};


document.viewport = {

  getDimensions: function() {
    return { width: this.getWidth(), height: this.getHeight() };
  },

  getScrollOffsets: function() {
    return Element._returnOffset(
      window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
      window.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop);
  }
};

(function(viewport) {
  var B = Prototype.Browser, doc = document, element, property = {};

  function getRootElement() {
    if (B.WebKit && !doc.evaluate)
      return document;

    if (B.Opera && window.parseFloat(window.opera.version()) < 9.5)
      return document.body;

    return document.documentElement;
  }

  function define(D) {
    if (!element) element = getRootElement();

    property[D] = 'client' + D;

    viewport['get' + D] = function() { return element[property[D]] };
    return viewport['get' + D]();
  }

  viewport.getWidth  = define.curry('Width');

  viewport.getHeight = define.curry('Height');
})(document.viewport);


Element.Storage = {
  UID: 1
};

Element.addMethods({
  getStorage: function(element) {
    if (!(element = $(element))) return;

    var uid;
    if (element === window) {
      uid = 0;
    } else {
      if (typeof element._prototypeUID === "undefined")
        element._prototypeUID = [Element.Storage.UID++];
      uid = element._prototypeUID[0];
    }

    if (!Element.Storage[uid])
      Element.Storage[uid] = $H();

    return Element.Storage[uid];
  },

  store: function(element, key, value) {
    if (!(element = $(element))) return;

    if (arguments.length === 2) {
      Element.getStorage(element).update(key);
    } else {
      Element.getStorage(element).set(key, value);
    }

    return element;
  },

  retrieve: function(element, key, defaultValue) {
    if (!(element = $(element))) return;
    var hash = Element.getStorage(element), value = hash.get(key);

    if (Object.isUndefined(value)) {
      hash.set(key, defaultValue);
      value = defaultValue;
    }

    return value;
  },

  clone: function(element, deep) {
    if (!(element = $(element))) return;
    var clone = element.cloneNode(deep);
    clone._prototypeUID = void 0;
    if (deep) {
      var descendants = Element.select(clone, '*'),
          i = descendants.length;
      while (i--) {
        descendants[i]._prototypeUID = void 0;
      }
    }
    return Element.extend(clone);
  }
});
Prototype._original_property = window.Sizzle;
/*!
 * Sizzle CSS Selector Engine - v1.0
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true;

[0, 0].sort(function(){
	baseHasDuplicate = false;
	return 0;
});

var Sizzle = function(selector, context, results, seed) {
	results = results || [];
	var origContext = context = context || document;

	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
		return [];
	}

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var parts = [], m, set, checkSet, check, mode, extra, prune = true, contextXML = isXML(context),
		soFar = selector;

	while ( (chunker.exec(""), m = chunker.exec(soFar)) !== null ) {
		soFar = m[3];

		parts.push( m[1] );

		if ( m[2] ) {
			extra = m[3];
			break;
		}
	}

	if ( parts.length > 1 && origPOS.exec( selector ) ) {
		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context );
		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] )
					selector += parts.shift();

				set = posProcess( selector, set );
			}
		}
	} else {
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {
			var ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ? Sizzle.filter( ret.expr, ret.set )[0] : ret.set[0];
		}

		if ( context ) {
			var ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );
			set = ret.expr ? Sizzle.filter( ret.expr, ret.set ) : ret.set;

			if ( parts.length > 0 ) {
				checkSet = makeArray(set);
			} else {
				prune = false;
			}

			while ( parts.length ) {
				var cur = parts.pop(), pop = cur;

				if ( !Expr.relative[ cur ] ) {
					cur = "";
				} else {
					pop = parts.pop();
				}

				if ( pop == null ) {
					pop = context;
				}

				Expr.relative[ cur ]( checkSet, pop, contextXML );
			}
		} else {
			checkSet = parts = [];
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		throw "Syntax error, unrecognized expression: " + (cur || selector);
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );
		} else if ( context && context.nodeType === 1 ) {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}
		} else {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}
	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, origContext, results, seed );
		Sizzle.uniqueSort( results );
	}

	return results;
};

Sizzle.uniqueSort = function(results){
	if ( sortOrder ) {
		hasDuplicate = baseHasDuplicate;
		results.sort(sortOrder);

		if ( hasDuplicate ) {
			for ( var i = 1; i < results.length; i++ ) {
				if ( results[i] === results[i-1] ) {
					results.splice(i--, 1);
				}
			}
		}
	}

	return results;
};

Sizzle.matches = function(expr, set){
	return Sizzle(expr, null, null, set);
};

Sizzle.find = function(expr, context, isXML){
	var set, match;

	if ( !expr ) {
		return [];
	}

	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
		var type = Expr.order[i], match;

		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
			var left = match[1];
			match.splice(1,1);

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace(/\\/g, "");
				set = Expr.find[ type ]( match, context, isXML );
				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = context.getElementsByTagName("*");
	}

	return {set: set, expr: expr};
};

Sizzle.filter = function(expr, set, inplace, not){
	var old = expr, result = [], curLoop = set, match, anyFound,
		isXMLFilter = set && set[0] && isXML(set[0]);

	while ( expr && set.length ) {
		for ( var type in Expr.filter ) {
			if ( (match = Expr.match[ type ].exec( expr )) != null ) {
				var filter = Expr.filter[ type ], found, item;
				anyFound = false;

				if ( curLoop == result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;
					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							var pass = not ^ !!found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;
								} else {
									curLoop[i] = false;
								}
							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		if ( expr == old ) {
			if ( anyFound == null ) {
				throw "Syntax error, unrecognized expression: " + expr;
			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],
	match: {
		ID: /#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
	},
	leftMatch: {},
	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},
	attrHandle: {
		href: function(elem){
			return elem.getAttribute("href");
		}
	},
	relative: {
		"+": function(checkSet, part, isXML){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !/\W/.test(part),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag && !isXML ) {
				part = part.toUpperCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},
		">": function(checkSet, part, isXML){
			var isPartStr = typeof part === "string";

			if ( isPartStr && !/\W/.test(part) ) {
				part = isXML ? part : part.toUpperCase();

				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName === part ? parent : false;
					}
				}
			} else {
				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},
		"": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( !/\W/.test(part) ) {
				var nodeCheck = part = isXML ? part : part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
		},
		"~": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( typeof part === "string" && !/\W/.test(part) ) {
				var nodeCheck = part = isXML ? part : part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
		}
	},
	find: {
		ID: function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? [m] : [];
			}
		},
		NAME: function(match, context, isXML){
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [], results = context.getElementsByName(match[1]);

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},
		TAG: function(match, context){
			return context.getElementsByTagName(match[1]);
		}
	},
	preFilter: {
		CLASS: function(match, curLoop, inplace, result, not, isXML){
			match = " " + match[1].replace(/\\/g, "") + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").indexOf(match) >= 0) ) {
						if ( !inplace )
							result.push( elem );
					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},
		ID: function(match){
			return match[1].replace(/\\/g, "");
		},
		TAG: function(match, curLoop){
			for ( var i = 0; curLoop[i] === false; i++ ){}
			return curLoop[i] && isXML(curLoop[i]) ? match[1] : match[1].toUpperCase();
		},
		CHILD: function(match){
			if ( match[1] == "nth" ) {
				var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
					match[2] == "even" && "2n" || match[2] == "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}

			match[0] = done++;

			return match;
		},
		ATTR: function(match, curLoop, inplace, result, not, isXML){
			var name = match[1].replace(/\\/g, "");

			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},
		PSEUDO: function(match, curLoop, inplace, result, not){
			if ( match[1] === "not" ) {
				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);
				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
					if ( !inplace ) {
						result.push.apply( result, ret );
					}
					return false;
				}
			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}

			return match;
		},
		POS: function(match){
			match.unshift( true );
			return match;
		}
	},
	filters: {
		enabled: function(elem){
			return elem.disabled === false && elem.type !== "hidden";
		},
		disabled: function(elem){
			return elem.disabled === true;
		},
		checked: function(elem){
			return elem.checked === true;
		},
		selected: function(elem){
			elem.parentNode.selectedIndex;
			return elem.selected === true;
		},
		parent: function(elem){
			return !!elem.firstChild;
		},
		empty: function(elem){
			return !elem.firstChild;
		},
		has: function(elem, i, match){
			return !!Sizzle( match[3], elem ).length;
		},
		header: function(elem){
			return /h\d/i.test( elem.nodeName );
		},
		text: function(elem){
			return "text" === elem.type;
		},
		radio: function(elem){
			return "radio" === elem.type;
		},
		checkbox: function(elem){
			return "checkbox" === elem.type;
		},
		file: function(elem){
			return "file" === elem.type;
		},
		password: function(elem){
			return "password" === elem.type;
		},
		submit: function(elem){
			return "submit" === elem.type;
		},
		image: function(elem){
			return "image" === elem.type;
		},
		reset: function(elem){
			return "reset" === elem.type;
		},
		button: function(elem){
			return "button" === elem.type || elem.nodeName.toUpperCase() === "BUTTON";
		},
		input: function(elem){
			return /input|select|textarea|button/i.test(elem.nodeName);
		}
	},
	setFilters: {
		first: function(elem, i){
			return i === 0;
		},
		last: function(elem, i, match, array){
			return i === array.length - 1;
		},
		even: function(elem, i){
			return i % 2 === 0;
		},
		odd: function(elem, i){
			return i % 2 === 1;
		},
		lt: function(elem, i, match){
			return i < match[3] - 0;
		},
		gt: function(elem, i, match){
			return i > match[3] - 0;
		},
		nth: function(elem, i, match){
			return match[3] - 0 == i;
		},
		eq: function(elem, i, match){
			return match[3] - 0 == i;
		}
	},
	filter: {
		PSEUDO: function(elem, match, i, array){
			var name = match[1], filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || "").indexOf(match[3]) >= 0;
			} else if ( name === "not" ) {
				var not = match[3];

				for ( var i = 0, l = not.length; i < l; i++ ) {
					if ( not[i] === elem ) {
						return false;
					}
				}

				return true;
			}
		},
		CHILD: function(elem, match){
			var type = match[1], node = elem;
			switch (type) {
				case 'only':
				case 'first':
					while ( (node = node.previousSibling) )  {
						if ( node.nodeType === 1 ) return false;
					}
					if ( type == 'first') return true;
					node = elem;
				case 'last':
					while ( (node = node.nextSibling) )  {
						if ( node.nodeType === 1 ) return false;
					}
					return true;
				case 'nth':
					var first = match[2], last = match[3];

					if ( first == 1 && last == 0 ) {
						return true;
					}

					var doneName = match[0],
						parent = elem.parentNode;

					if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
						var count = 0;
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						}
						parent.sizcache = doneName;
					}

					var diff = elem.nodeIndex - last;
					if ( first == 0 ) {
						return diff == 0;
					} else {
						return ( diff % first == 0 && diff / first >= 0 );
					}
			}
		},
		ID: function(elem, match){
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},
		TAG: function(elem, match){
			return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
		},
		CLASS: function(elem, match){
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},
		ATTR: function(elem, match){
			var name = match[1],
				result = Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value != check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},
		POS: function(elem, match, i, array){
			var name = match[2], filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS;

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + /(?![^\[]*\])(?![^\(]*\))/.source );
	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source );
}

var makeArray = function(array, results) {
	array = Array.prototype.slice.call( array, 0 );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}

	return array;
};

try {
	Array.prototype.slice.call( document.documentElement.childNodes, 0 );

} catch(e){
	makeArray = function(array, results) {
		var ret = results || [];

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );
		} else {
			if ( typeof array.length === "number" ) {
				for ( var i = 0, l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}
			} else {
				for ( var i = 0; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( "sourceIndex" in document.documentElement ) {
	sortOrder = function( a, b ) {
		if ( !a.sourceIndex || !b.sourceIndex ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var ret = a.sourceIndex - b.sourceIndex;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( document.createRange ) {
	sortOrder = function( a, b ) {
		if ( !a.ownerDocument || !b.ownerDocument ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.setStart(a, 0);
		aRange.setEnd(a, 0);
		bRange.setStart(b, 0);
		bRange.setEnd(b, 0);
		var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
}

(function(){
	var form = document.createElement("div"),
		id = "script" + (new Date).getTime();
	form.innerHTML = "<a name='" + id + "'/>";

	var root = document.documentElement;
	root.insertBefore( form, root.firstChild );

	if ( !!document.getElementById( id ) ) {
		Expr.find.ID = function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
			}
		};

		Expr.filter.ID = function(elem, match){
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );
	root = form = null; // release memory in IE
})();

(function(){

	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function(match, context){
			var results = context.getElementsByTagName(match[1]);

			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	div.innerHTML = "<a href='#'></a>";
	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {
		Expr.attrHandle.href = function(elem){
			return elem.getAttribute("href", 2);
		};
	}

	div = null; // release memory in IE
})();

if ( document.querySelectorAll ) (function(){
	var oldSizzle = Sizzle, div = document.createElement("div");
	div.innerHTML = "<p class='TEST'></p>";

	if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
		return;
	}

	Sizzle = function(query, context, extra, seed){
		context = context || document;

		if ( !seed && context.nodeType === 9 && !isXML(context) ) {
			try {
				return makeArray( context.querySelectorAll(query), extra );
			} catch(e){}
		}

		return oldSizzle(query, context, extra, seed);
	};

	for ( var prop in oldSizzle ) {
		Sizzle[ prop ] = oldSizzle[ prop ];
	}

	div = null; // release memory in IE
})();

if ( document.getElementsByClassName && document.documentElement.getElementsByClassName ) (function(){
	var div = document.createElement("div");
	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	if ( div.getElementsByClassName("e").length === 0 )
		return;

	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 )
		return;

	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function(match, context, isXML) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};

	div = null; // release memory in IE
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	var sibDir = dir == "previousSibling" && !isXML;
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			if ( sibDir && elem.nodeType === 1 ){
				elem.sizcache = doneName;
				elem.sizset = i;
			}
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem.sizcache = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	var sibDir = dir == "previousSibling" && !isXML;
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			if ( sibDir && elem.nodeType === 1 ) {
				elem.sizcache = doneName;
				elem.sizset = i;
			}
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem.sizcache = doneName;
						elem.sizset = i;
					}
					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

var contains = document.compareDocumentPosition ?  function(a, b){
	return a.compareDocumentPosition(b) & 16;
} : function(a, b){
	return a !== b && (a.contains ? a.contains(b) : true);
};

var isXML = function(elem){
	return elem.nodeType === 9 && elem.documentElement.nodeName !== "HTML" ||
		!!elem.ownerDocument && elem.ownerDocument.documentElement.nodeName !== "HTML";
};

var posProcess = function(selector, context){
	var tmpSet = [], later = "", match,
		root = context.nodeType ? [context] : context;

	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet );
	}

	return Sizzle.filter( later, tmpSet );
};


window.Sizzle = Sizzle;

})();

Prototype.Selector = (function(engine) {
  function extend(elements) {
    for (var i = 0, length = elements.length; i < length; i++) {
      Element.extend(elements[i]);
    }
    return elements;
  }

  function select(selector, scope) {
    return extend(engine(selector, scope || document));
  }

  function match(element, selector) {
    return engine.matches(selector, [element]).length == 1;
  }

  return {
    engine:  engine,
    select:  select,
    match:   match
  };
})(Sizzle);

window.Sizzle = Prototype._original_property;
delete Prototype._original_property;

window.$$ = function() {
  var expression = $A(arguments).join(', ');
  return Prototype.Selector.select(expression, document);
};







if (!Prototype.Selector.find) {
  Prototype.Selector.find = function(elements, expression, index) {
    if (Object.isUndefined(index)) index = 0;
    var match = Prototype.Selector.match, length = elements.length, matchIndex = 0, i;

    for (i = 0; i < length; i++) {
      if (match(elements[i], expression) && index == matchIndex++) {
        return Element.extend(elements[i]);
      }
    }
  }
}


var Form = {
  reset: function(form) {
    form = $(form);
    form.reset();
    return form;
  },

  serializeElements: function(elements, options) {
    if (typeof options != 'object') options = { hash: !!options };
    else if (Object.isUndefined(options.hash)) options.hash = true;
    var key, value, submitted = false, submit = options.submit;

    var data = elements.inject({ }, function(result, element) {
      if (!element.disabled && element.name) {
        key = element.name; value = $(element).getValue();
        if (value != null && element.type != 'file' && (element.type != 'submit' || (!submitted &&
            submit !== false && (!submit || key == submit) && (submitted = true)))) {
          if (key in result) {
            if (!Object.isArray(result[key])) result[key] = [result[key]];
            result[key].push(value);
          }
          else result[key] = value;
        }
      }
      return result;
    });

    return options.hash ? data : Object.toQueryString(data);
  }
};

Form.Methods = {
  serialize: function(form, options) {
    return Form.serializeElements(Form.getElements(form), options);
  },

  getElements: function(form) {
    var elements = $(form).getElementsByTagName('*'),
        element,
        arr = [ ],
        serializers = Form.Element.Serializers;
    for (var i = 0; element = elements[i]; i++) {
      arr.push(element);
    }
    return arr.inject([], function(elements, child) {
      if (serializers[child.tagName.toLowerCase()])
        elements.push(Element.extend(child));
      return elements;
    })
  },

  getInputs: function(form, typeName, name) {
    form = $(form);
    var inputs = form.getElementsByTagName('input');

    if (!typeName && !name) return $A(inputs).map(Element.extend);

    for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
      var input = inputs[i];
      if ((typeName && input.type != typeName) || (name && input.name != name))
        continue;
      matchingInputs.push(Element.extend(input));
    }

    return matchingInputs;
  },

  disable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('disable');
    return form;
  },

  enable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('enable');
    return form;
  },

  findFirstElement: function(form) {
    var elements = $(form).getElements().findAll(function(element) {
      return 'hidden' != element.type && !element.disabled;
    });
    var firstByIndex = elements.findAll(function(element) {
      return element.hasAttribute('tabIndex') && element.tabIndex >= 0;
    }).sortBy(function(element) { return element.tabIndex }).first();

    return firstByIndex ? firstByIndex : elements.find(function(element) {
      return /^(?:input|select|textarea)$/i.test(element.tagName);
    });
  },

  focusFirstElement: function(form) {
    form = $(form);
    form.findFirstElement().activate();
    return form;
  },

  request: function(form, options) {
    form = $(form), options = Object.clone(options || { });

    var params = options.parameters, action = form.readAttribute('action') || '';
    if (action.blank()) action = window.location.href;
    options.parameters = form.serialize(true);

    if (params) {
      if (Object.isString(params)) params = params.toQueryParams();
      Object.extend(options.parameters, params);
    }

    if (form.hasAttribute('method') && !options.method)
      options.method = form.method;

    return new Ajax.Request(action, options);
  }
};

/*--------------------------------------------------------------------------*/


Form.Element = {
  focus: function(element) {
    $(element).focus();
    return element;
  },

  select: function(element) {
    $(element).select();
    return element;
  }
};

Form.Element.Methods = {

  serialize: function(element) {
    element = $(element);
    if (!element.disabled && element.name) {
      var value = element.getValue();
      if (value != undefined) {
        var pair = { };
        pair[element.name] = value;
        return Object.toQueryString(pair);
      }
    }
    return '';
  },

  getValue: function(element) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    return Form.Element.Serializers[method](element);
  },

  setValue: function(element, value) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    Form.Element.Serializers[method](element, value);
    return element;
  },

  clear: function(element) {
    $(element).value = '';
    return element;
  },

  present: function(element) {
    return $(element).value != '';
  },

  activate: function(element) {
    element = $(element);
    try {
      element.focus();
      if (element.select && (element.tagName.toLowerCase() != 'input' ||
          !(/^(?:button|reset|submit)$/i.test(element.type))))
        element.select();
    } catch (e) { }
    return element;
  },

  disable: function(element) {
    element = $(element);
    element.disabled = true;
    return element;
  },

  enable: function(element) {
    element = $(element);
    element.disabled = false;
    return element;
  }
};

/*--------------------------------------------------------------------------*/

var Field = Form.Element;

var $F = Form.Element.Methods.getValue;

/*--------------------------------------------------------------------------*/

Form.Element.Serializers = {
  input: function(element, value) {
    switch (element.type.toLowerCase()) {
      case 'checkbox':
      case 'radio':
        return Form.Element.Serializers.inputSelector(element, value);
      default:
        return Form.Element.Serializers.textarea(element, value);
    }
  },

  inputSelector: function(element, value) {
    if (Object.isUndefined(value)) return element.checked ? element.value : null;
    else element.checked = !!value;
  },

  textarea: function(element, value) {
    if (Object.isUndefined(value)) return element.value;
    else element.value = value;
  },

  select: function(element, value) {
    if (Object.isUndefined(value))
      return this[element.type == 'select-one' ?
        'selectOne' : 'selectMany'](element);
    else {
      var opt, currentValue, single = !Object.isArray(value);
      for (var i = 0, length = element.length; i < length; i++) {
        opt = element.options[i];
        currentValue = this.optionValue(opt);
        if (single) {
          if (currentValue == value) {
            opt.selected = true;
            return;
          }
        }
        else opt.selected = value.include(currentValue);
      }
    }
  },

  selectOne: function(element) {
    var index = element.selectedIndex;
    return index >= 0 ? this.optionValue(element.options[index]) : null;
  },

  selectMany: function(element) {
    var values, length = element.length;
    if (!length) return null;

    for (var i = 0, values = []; i < length; i++) {
      var opt = element.options[i];
      if (opt.selected) values.push(this.optionValue(opt));
    }
    return values;
  },

  optionValue: function(opt) {
    return Element.extend(opt).hasAttribute('value') ? opt.value : opt.text;
  }
};

/*--------------------------------------------------------------------------*/


Abstract.TimedObserver = Class.create(PeriodicalExecuter, {
  initialize: function($super, element, frequency, callback) {
    $super(callback, frequency);
    this.element   = $(element);
    this.lastValue = this.getValue();
  },

  execute: function() {
    var value = this.getValue();
    if (Object.isString(this.lastValue) && Object.isString(value) ?
        this.lastValue != value : String(this.lastValue) != String(value)) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  }
});

Form.Element.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});

/*--------------------------------------------------------------------------*/

Abstract.EventObserver = Class.create({
  initialize: function(element, callback) {
    this.element  = $(element);
    this.callback = callback;

    this.lastValue = this.getValue();
    if (this.element.tagName.toLowerCase() == 'form')
      this.registerFormCallbacks();
    else
      this.registerCallback(this.element);
  },

  onElementEvent: function() {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  },

  registerFormCallbacks: function() {
    Form.getElements(this.element).each(this.registerCallback, this);
  },

  registerCallback: function(element) {
    if (element.type) {
      switch (element.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          Event.observe(element, 'click', this.onElementEvent.bind(this));
          break;
        default:
          Event.observe(element, 'change', this.onElementEvent.bind(this));
          break;
      }
    }
  }
});

Form.Element.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});
(function() {

  var Event = {
    KEY_BACKSPACE: 8,
    KEY_TAB:       9,
    KEY_RETURN:   13,
    KEY_ESC:      27,
    KEY_LEFT:     37,
    KEY_UP:       38,
    KEY_RIGHT:    39,
    KEY_DOWN:     40,
    KEY_DELETE:   46,
    KEY_HOME:     36,
    KEY_END:      35,
    KEY_PAGEUP:   33,
    KEY_PAGEDOWN: 34,
    KEY_INSERT:   45,

    cache: {}
  };

  var docEl = document.documentElement;
  var MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED = 'onmouseenter' in docEl
    && 'onmouseleave' in docEl;

  var _isButton;
  if (Prototype.Browser.IE) {
    var buttonMap = { 0: 1, 1: 4, 2: 2 };
    _isButton = function(event, code) {
      return event.button === buttonMap[code];
    };
  } else if (Prototype.Browser.WebKit) {
    _isButton = function(event, code) {
      switch (code) {
        case 0: return event.which == 1 && !event.metaKey;
        case 1: return event.which == 1 && event.metaKey;
        default: return false;
      }
    };
  } else {
    _isButton = function(event, code) {
      return event.which ? (event.which === code + 1) : (event.button === code);
    };
  }

  function isLeftClick(event)   { return _isButton(event, 0) }

  function isMiddleClick(event) { return _isButton(event, 1) }

  function isRightClick(event)  { return _isButton(event, 2) }

  function element(event) {
    event = Event.extend(event);

    var node = event.target, type = event.type,
     currentTarget = event.currentTarget;

    if (currentTarget && currentTarget.tagName) {
      if (type === 'load' || type === 'error' ||
        (type === 'click' && currentTarget.tagName.toLowerCase() === 'input'
          && currentTarget.type === 'radio'))
            node = currentTarget;
    }

    if (node.nodeType == Node.TEXT_NODE)
      node = node.parentNode;

    return Element.extend(node);
  }

  function findElement(event, expression) {
    var element = Event.element(event);
    if (!expression) return element;
    var elements = [element].concat(element.ancestors());
    return Prototype.Selector.find(elements, expression, 0);
  }

  function pointer(event) {
    return { x: pointerX(event), y: pointerY(event) };
  }

  function pointerX(event) {
    var docElement = document.documentElement,
     body = document.body || { scrollLeft: 0 };

    return event.pageX || (event.clientX +
      (docElement.scrollLeft || body.scrollLeft) -
      (docElement.clientLeft || 0));
  }

  function pointerY(event) {
    var docElement = document.documentElement,
     body = document.body || { scrollTop: 0 };

    return  event.pageY || (event.clientY +
       (docElement.scrollTop || body.scrollTop) -
       (docElement.clientTop || 0));
  }


  function stop(event) {
    Event.extend(event);
    event.preventDefault();
    event.stopPropagation();

    event.stopped = true;
  }

  Event.Methods = {
    isLeftClick: isLeftClick,
    isMiddleClick: isMiddleClick,
    isRightClick: isRightClick,

    element: element,
    findElement: findElement,

    pointer: pointer,
    pointerX: pointerX,
    pointerY: pointerY,

    stop: stop
  };


  var methods = Object.keys(Event.Methods).inject({ }, function(m, name) {
    m[name] = Event.Methods[name].methodize();
    return m;
  });

  if (Prototype.Browser.IE) {
    function _relatedTarget(event) {
      var element;
      switch (event.type) {
        case 'mouseover': element = event.fromElement; break;
        case 'mouseout':  element = event.toElement;   break;
        default: return null;
      }
      return Element.extend(element);
    }

    Object.extend(methods, {
      stopPropagation: function() { this.cancelBubble = true },
      preventDefault:  function() { this.returnValue = false },
      inspect: function() { return '[object Event]' }
    });

    Event.extend = function(event, element) {
      if (!event) return false;
      if (event._extendedByPrototype) return event;

      event._extendedByPrototype = Prototype.emptyFunction;
      var pointer = Event.pointer(event);

      Object.extend(event, {
        target: event.srcElement || element,
        relatedTarget: _relatedTarget(event),
        pageX:  pointer.x,
        pageY:  pointer.y
      });

      return Object.extend(event, methods);
    };
  } else {
    Event.prototype = window.Event.prototype || document.createEvent('HTMLEvents').__proto__;
    Object.extend(Event.prototype, methods);
    Event.extend = Prototype.K;
  }

  function _createResponder(element, eventName, handler) {
    var registry = Element.retrieve(element, 'prototype_event_registry');

    if (Object.isUndefined(registry)) {
      CACHE.push(element);
      registry = Element.retrieve(element, 'prototype_event_registry', $H());
    }

    var respondersForEvent = registry.get(eventName);
    if (Object.isUndefined(respondersForEvent)) {
      respondersForEvent = [];
      registry.set(eventName, respondersForEvent);
    }

    if (respondersForEvent.pluck('handler').include(handler)) return false;

    var responder;
    if (eventName.include(":")) {
      responder = function(event) {
        if (Object.isUndefined(event.eventName))
          return false;

        if (event.eventName !== eventName)
          return false;

        Event.extend(event, element);
        handler.call(element, event);
      };
    } else {
      if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED &&
       (eventName === "mouseenter" || eventName === "mouseleave")) {
        if (eventName === "mouseenter" || eventName === "mouseleave") {
          responder = function(event) {
            Event.extend(event, element);

            var parent = event.relatedTarget;
            while (parent && parent !== element) {
              try { parent = parent.parentNode; }
              catch(e) { parent = element; }
            }

            if (parent === element) return;

            handler.call(element, event);
          };
        }
      } else {
        responder = function(event) {
          Event.extend(event, element);
          handler.call(element, event);
        };
      }
    }

    responder.handler = handler;
    respondersForEvent.push(responder);
    return responder;
  }

  function _destroyCache() {
    for (var i = 0, length = CACHE.length; i < length; i++) {
      Event.stopObserving(CACHE[i]);
      CACHE[i] = null;
    }
  }

  var CACHE = [];

  if (Prototype.Browser.IE)
    window.attachEvent('onunload', _destroyCache);

  if (Prototype.Browser.WebKit)
    window.addEventListener('unload', Prototype.emptyFunction, false);


  var _getDOMEventName = Prototype.K,
      translations = { mouseenter: "mouseover", mouseleave: "mouseout" };

  if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED) {
    _getDOMEventName = function(eventName) {
      return (translations[eventName] || eventName);
    };
  }

  function observe(element, eventName, handler) {
    element = $(element);

    var responder = _createResponder(element, eventName, handler);

    if (!responder) return element;

    if (eventName.include(':')) {
      if (element.addEventListener)
        element.addEventListener("dataavailable", responder, false);
      else {
        element.attachEvent("ondataavailable", responder);
        element.attachEvent("onfilterchange", responder);
      }
    } else {
      var actualEventName = _getDOMEventName(eventName);

      if (element.addEventListener)
        element.addEventListener(actualEventName, responder, false);
      else
        element.attachEvent("on" + actualEventName, responder);
    }

    return element;
  }

  function stopObserving(element, eventName, handler) {
    element = $(element);

    var registry = Element.retrieve(element, 'prototype_event_registry');
    if (!registry) return element;

    if (!eventName) {
      registry.each( function(pair) {
        var eventName = pair.key;
        stopObserving(element, eventName);
      });
      return element;
    }

    var responders = registry.get(eventName);
    if (!responders) return element;

    if (!handler) {
      responders.each(function(r) {
        stopObserving(element, eventName, r.handler);
      });
      return element;
    }

    var responder = responders.find( function(r) { return r.handler === handler; });
    if (!responder) return element;

    if (eventName.include(':')) {
      if (element.removeEventListener)
        element.removeEventListener("dataavailable", responder, false);
      else {
        element.detachEvent("ondataavailable", responder);
        element.detachEvent("onfilterchange",  responder);
      }
    } else {
      var actualEventName = _getDOMEventName(eventName);
      if (element.removeEventListener)
        element.removeEventListener(actualEventName, responder, false);
      else
        element.detachEvent('on' + actualEventName, responder);
    }

    registry.set(eventName, responders.without(responder));

    return element;
  }

  function fire(element, eventName, memo, bubble) {
    element = $(element);

    if (Object.isUndefined(bubble))
      bubble = true;

    if (element == document && document.createEvent && !element.dispatchEvent)
      element = document.documentElement;

    var event;
    if (document.createEvent) {
      event = document.createEvent('HTMLEvents');
      event.initEvent('dataavailable', true, true);
    } else {
      event = document.createEventObject();
      event.eventType = bubble ? 'ondataavailable' : 'onfilterchange';
    }

    event.eventName = eventName;
    event.memo = memo || { };

    if (document.createEvent)
      element.dispatchEvent(event);
    else
      element.fireEvent(event.eventType, event);

    return Event.extend(event);
  }


  Object.extend(Event, Event.Methods);

  Object.extend(Event, {
    fire:          fire,
    observe:       observe,
    stopObserving: stopObserving
  });

  Element.addMethods({
    fire:          fire,

    observe:       observe,

    stopObserving: stopObserving
  });

  Object.extend(document, {
    fire:          fire.methodize(),

    observe:       observe.methodize(),

    stopObserving: stopObserving.methodize(),

    loaded:        false
  });

  if (window.Event) Object.extend(window.Event, Event);
  else window.Event = Event;
})();

(function() {
  /* Support for the DOMContentLoaded event is based on work by Dan Webb,
     Matthias Miller, Dean Edwards, John Resig, and Diego Perini. */

  var timer;

  function fireContentLoadedEvent() {
    if (document.loaded) return;
    if (timer) window.clearTimeout(timer);
    document.loaded = true;
    document.fire('dom:loaded');
  }

  function checkReadyState() {
    if (document.readyState === 'complete') {
      document.stopObserving('readystatechange', checkReadyState);
      fireContentLoadedEvent();
    }
  }

  function pollDoScroll() {
    try { document.documentElement.doScroll('left'); }
    catch(e) {
      timer = pollDoScroll.defer();
      return;
    }
    fireContentLoadedEvent();
  }

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', fireContentLoadedEvent, false);
  } else {
    document.observe('readystatechange', checkReadyState);
    if (window == top)
      timer = pollDoScroll.defer();
  }

  Event.observe(window, 'load', fireContentLoadedEvent);
})();

Element.addMethods();

/*------------------------------- DEPRECATED -------------------------------*/

Hash.toQueryString = Object.toQueryString;

var Toggle = { display: Element.toggle };

Element.Methods.childOf = Element.Methods.descendantOf;

var Insertion = {
  Before: function(element, content) {
    return Element.insert(element, {before:content});
  },

  Top: function(element, content) {
    return Element.insert(element, {top:content});
  },

  Bottom: function(element, content) {
    return Element.insert(element, {bottom:content});
  },

  After: function(element, content) {
    return Element.insert(element, {after:content});
  }
};

var $continue = new Error('"throw $continue" is deprecated, use "return" instead');

var Position = {
  includeScrollOffsets: false,

  prepare: function() {
    this.deltaX =  window.pageXOffset
                || document.documentElement.scrollLeft
                || document.body.scrollLeft
                || 0;
    this.deltaY =  window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop
                || 0;
  },

  within: function(element, x, y) {
    if (this.includeScrollOffsets)
      return this.withinIncludingScrolloffsets(element, x, y);
    this.xcomp = x;
    this.ycomp = y;
    this.offset = Element.cumulativeOffset(element);

    return (y >= this.offset[1] &&
            y <  this.offset[1] + element.offsetHeight &&
            x >= this.offset[0] &&
            x <  this.offset[0] + element.offsetWidth);
  },

  withinIncludingScrolloffsets: function(element, x, y) {
    var offsetcache = Element.cumulativeScrollOffset(element);

    this.xcomp = x + offsetcache[0] - this.deltaX;
    this.ycomp = y + offsetcache[1] - this.deltaY;
    this.offset = Element.cumulativeOffset(element);

    return (this.ycomp >= this.offset[1] &&
            this.ycomp <  this.offset[1] + element.offsetHeight &&
            this.xcomp >= this.offset[0] &&
            this.xcomp <  this.offset[0] + element.offsetWidth);
  },

  overlap: function(mode, element) {
    if (!mode) return 0;
    if (mode == 'vertical')
      return ((this.offset[1] + element.offsetHeight) - this.ycomp) /
        element.offsetHeight;
    if (mode == 'horizontal')
      return ((this.offset[0] + element.offsetWidth) - this.xcomp) /
        element.offsetWidth;
  },


  cumulativeOffset: Element.Methods.cumulativeOffset,

  positionedOffset: Element.Methods.positionedOffset,

  absolutize: function(element) {
    Position.prepare();
    return Element.absolutize(element);
  },

  relativize: function(element) {
    Position.prepare();
    return Element.relativize(element);
  },

  realOffset: Element.Methods.cumulativeScrollOffset,

  offsetParent: Element.Methods.getOffsetParent,

  page: Element.Methods.viewportOffset,

  clone: function(source, target, options) {
    options = options || { };
    return Element.clonePosition(target, source, options);
  }
};

/*--------------------------------------------------------------------------*/

if (!document.getElementsByClassName) document.getElementsByClassName = function(instanceMethods){
  function iter(name) {
    return name.blank() ? null : "[contains(concat(' ', @class, ' '), ' " + name + " ')]";
  }

  instanceMethods.getElementsByClassName = Prototype.BrowserFeatures.XPath ?
  function(element, className) {
    className = className.toString().strip();
    var cond = /\s/.test(className) ? $w(className).map(iter).join('') : iter(className);
    return cond ? document._getElementsByXPath('.//*' + cond, element) : [];
  } : function(element, className) {
    className = className.toString().strip();
    var elements = [], classNames = (/\s/.test(className) ? $w(className) : null);
    if (!classNames && !className) return elements;

    var nodes = $(element).getElementsByTagName('*');
    className = ' ' + className + ' ';

    for (var i = 0, child, cn; child = nodes[i]; i++) {
      if (child.className && (cn = ' ' + child.className + ' ') && (cn.include(className) ||
          (classNames && classNames.all(function(name) {
            return !name.toString().blank() && cn.include(' ' + name + ' ');
          }))))
        elements.push(Element.extend(child));
    }
    return elements;
  };

  return function(className, parentElement) {
    return $(parentElement || document.body).getElementsByClassName(className);
  };
}(Element.Methods);

/*--------------------------------------------------------------------------*/

Element.ClassNames = Class.create();
Element.ClassNames.prototype = {
  initialize: function(element) {
    this.element = $(element);
  },

  _each: function(iterator) {
    this.element.className.split(/\s+/).select(function(name) {
      return name.length > 0;
    })._each(iterator);
  },

  set: function(className) {
    this.element.className = className;
  },

  add: function(classNameToAdd) {
    if (this.include(classNameToAdd)) return;
    this.set($A(this).concat(classNameToAdd).join(' '));
  },

  remove: function(classNameToRemove) {
    if (!this.include(classNameToRemove)) return;
    this.set($A(this).without(classNameToRemove).join(' '));
  },

  toString: function() {
    return $A(this).join(' ');
  }
};

Object.extend(Element.ClassNames.prototype, Enumerable);

/*--------------------------------------------------------------------------*/

(function() {
  window.Selector = Class.create({
    initialize: function(expression) {
      this.expression = expression.strip();
    },

    findElements: function(rootElement) {
      return Prototype.Selector.select(this.expression, rootElement);
    },

    match: function(element) {
      return Prototype.Selector.match(element, this.expression);
    },

    toString: function() {
      return this.expression;
    },

    inspect: function() {
      return "#<Selector: " + this.expression + ">";
    }
  });

  Object.extend(Selector, {
    matchElements: Prototype.Selector.filter,

    findElement: function(elements, expression, index) {
      index = index || 0;
      var matchIndex = 0, element;
      for (var i = 0, length = elements.length; i < length; i++) {
        element = elements[i];
        if (Prototype.Selector.match(element, expression) && index === matchIndex++) {
          return Element.extend(element);
        }
      }
    },

    findChildElements: function(element, expressions) {
      var selector = expressions.toArray().join(', ');
      return Prototype.Selector.select(selector, element || document);
    }
  });
})();

String.prototype.parseColor = function() {
  var color = '#';
  if (this.slice(0,4) == 'rgb(') {
    var cols = this.slice(4,this.length-1).split(',');
    var i=0; do { color += parseInt(cols[i]).toColorPart() } while (++i<3);
  } else {
    if (this.slice(0,1) == '#') {
      if (this.length==4) for(var i=1;i<4;i++) color += (this.charAt(i) + this.charAt(i)).toLowerCase();
      if (this.length==7) color = this.toLowerCase();
    }
  }
  return (color.length==7 ? color : (arguments[0] || this));
};

/*--------------------------------------------------------------------------*/

Element.collectTextNodes = function(element) {
  return $A($(element).childNodes).collect( function(node) {
    return (node.nodeType==3 ? node.nodeValue :
      (node.hasChildNodes() ? Element.collectTextNodes(node) : ''));
  }).flatten().join('');
};

Element.collectTextNodesIgnoreClass = function(element, className) {
  return $A($(element).childNodes).collect( function(node) {
    return (node.nodeType==3 ? node.nodeValue :
      ((node.hasChildNodes() && !Element.hasClassName(node,className)) ?
        Element.collectTextNodesIgnoreClass(node, className) : ''));
  }).flatten().join('');
};

Element.setContentZoom = function(element, percent) {
  element = $(element);
  element.setStyle({fontSize: (percent/100) + 'em'});
  if (Prototype.Browser.WebKit) window.scrollBy(0,0);
  return element;
};

Element.getInlineOpacity = function(element){
  return $(element).style.opacity || '';
};

Element.forceRerendering = function(element) {
  try {
    element = $(element);
    var n = document.createTextNode(' ');
    element.appendChild(n);
    element.removeChild(n);
  } catch(e) { }
};

/*--------------------------------------------------------------------------*/

var Effect = {
  _elementDoesNotExistError: {
    name: 'ElementDoesNotExistError',
    message: 'The specified DOM element does not exist, but is required for this effect to operate'
  },
  Transitions: {
    linear: Prototype.K,
    sinoidal: function(pos) {
      return (-Math.cos(pos*Math.PI)/2) + .5;
    },
    reverse: function(pos) {
      return 1-pos;
    },
    flicker: function(pos) {
      var pos = ((-Math.cos(pos*Math.PI)/4) + .75) + Math.random()/4;
      return pos > 1 ? 1 : pos;
    },
    wobble: function(pos) {
      return (-Math.cos(pos*Math.PI*(9*pos))/2) + .5;
    },
    pulse: function(pos, pulses) {
      return (-Math.cos((pos*((pulses||5)-.5)*2)*Math.PI)/2) + .5;
    },
    spring: function(pos) {
      return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6));
    },
    none: function(pos) {
      return 0;
    },
    full: function(pos) {
      return 1;
    }
  },
  DefaultOptions: {
    duration:   1.0,   // seconds
    fps:        100,   // 100= assume 66fps max.
    sync:       false, // true for combining
    from:       0.0,
    to:         1.0,
    delay:      0.0,
    queue:      'parallel'
  },
  tagifyText: function(element) {
    var tagifyStyle = 'position:relative';
    if (Prototype.Browser.IE) tagifyStyle += ';zoom:1';

    element = $(element);
    $A(element.childNodes).each( function(child) {
      if (child.nodeType==3) {
        child.nodeValue.toArray().each( function(character) {
          element.insertBefore(
            new Element('span', {style: tagifyStyle}).update(
              character == ' ' ? String.fromCharCode(160) : character),
              child);
        });
        Element.remove(child);
      }
    });
  },
  multiple: function(element, effect) {
    var elements;
    if (((typeof element == 'object') ||
        Object.isFunction(element)) &&
       (element.length))
      elements = element;
    else
      elements = $(element).childNodes;

    var options = Object.extend({
      speed: 0.1,
      delay: 0.0
    }, arguments[2] || { });
    var masterDelay = options.delay;

    $A(elements).each( function(element, index) {
      new effect(element, Object.extend(options, { delay: index * options.speed + masterDelay }));
    });
  },
  PAIRS: {
    'slide':  ['SlideDown','SlideUp'],
    'blind':  ['BlindDown','BlindUp'],
    'appear': ['Appear','Fade']
  },
  toggle: function(element, effect) {
    element = $(element);
    effect = (effect || 'appear').toLowerCase();
    var options = Object.extend({
      queue: { position:'end', scope:(element.id || 'global'), limit: 1 }
    }, arguments[2] || { });
    Effect[element.visible() ?
      Effect.PAIRS[effect][1] : Effect.PAIRS[effect][0]](element, options);
  }
};

Effect.DefaultOptions.transition = Effect.Transitions.sinoidal;

/* ------------- core effects ------------- */

Effect.ScopedQueue = Class.create(Enumerable, {
  initialize: function() {
    this.effects  = [];
    this.interval = null;
  },
  _each: function(iterator) {
    this.effects._each(iterator);
  },
  add: function(effect) {
    var timestamp = new Date().getTime();

    var position = Object.isString(effect.options.queue) ?
      effect.options.queue : effect.options.queue.position;

    switch(position) {
      case 'front':
        this.effects.findAll(function(e){ return e.state=='idle' }).each( function(e) {
            e.startOn  += effect.finishOn;
            e.finishOn += effect.finishOn;
          });
        break;
      case 'with-last':
        timestamp = this.effects.pluck('startOn').max() || timestamp;
        break;
      case 'end':
        timestamp = this.effects.pluck('finishOn').max() || timestamp;
        break;
    }

    effect.startOn  += timestamp;
    effect.finishOn += timestamp;

    if (!effect.options.queue.limit || (this.effects.length < effect.options.queue.limit))
      this.effects.push(effect);

    if (!this.interval)
      this.interval = setInterval(this.loop.bind(this), 15);
  },
  remove: function(effect) {
    this.effects = this.effects.reject(function(e) { return e==effect });
    if (this.effects.length == 0) {
      clearInterval(this.interval);
      this.interval = null;
    }
  },
  loop: function() {
    var timePos = new Date().getTime();
    for(var i=0, len=this.effects.length;i<len;i++)
      this.effects[i] && this.effects[i].loop(timePos);
  }
});

Effect.Queues = {
  instances: $H(),
  get: function(queueName) {
    if (!Object.isString(queueName)) return queueName;

    return this.instances.get(queueName) ||
      this.instances.set(queueName, new Effect.ScopedQueue());
  }
};
Effect.Queue = Effect.Queues.get('global');

Effect.Base = Class.create({
  position: null,
  start: function(options) {
    if (options && options.transition === false) options.transition = Effect.Transitions.linear;
    this.options      = Object.extend(Object.extend({ },Effect.DefaultOptions), options || { });
    this.currentFrame = 0;
    this.state        = 'idle';
    this.startOn      = this.options.delay*1000;
    this.finishOn     = this.startOn+(this.options.duration*1000);
    this.fromToDelta  = this.options.to-this.options.from;
    this.totalTime    = this.finishOn-this.startOn;
    this.totalFrames  = this.options.fps*this.options.duration;

    this.render = (function() {
      function dispatch(effect, eventName) {
        if (effect.options[eventName + 'Internal'])
          effect.options[eventName + 'Internal'](effect);
        if (effect.options[eventName])
          effect.options[eventName](effect);
      }

      return function(pos) {
        if (this.state === "idle") {
          this.state = "running";
          dispatch(this, 'beforeSetup');
          if (this.setup) this.setup();
          dispatch(this, 'afterSetup');
        }
        if (this.state === "running") {
          pos = (this.options.transition(pos) * this.fromToDelta) + this.options.from;
          this.position = pos;
          dispatch(this, 'beforeUpdate');
          if (this.update) this.update(pos);
          dispatch(this, 'afterUpdate');
        }
      };
    })();

    this.event('beforeStart');
    if (!this.options.sync)
      Effect.Queues.get(Object.isString(this.options.queue) ?
        'global' : this.options.queue.scope).add(this);
  },
  loop: function(timePos) {
    if (timePos >= this.startOn) {
      if (timePos >= this.finishOn) {
        this.render(1.0);
        this.cancel();
        this.event('beforeFinish');
        if (this.finish) this.finish();
        this.event('afterFinish');
        return;
      }
      var pos   = (timePos - this.startOn) / this.totalTime,
          frame = (pos * this.totalFrames).round();
      if (frame > this.currentFrame) {
        this.render(pos);
        this.currentFrame = frame;
      }
    }
  },
  cancel: function() {
    if (!this.options.sync)
      Effect.Queues.get(Object.isString(this.options.queue) ?
        'global' : this.options.queue.scope).remove(this);
    this.state = 'finished';
  },
  event: function(eventName) {
    if (this.options[eventName + 'Internal']) this.options[eventName + 'Internal'](this);
    if (this.options[eventName]) this.options[eventName](this);
  },
  inspect: function() {
    var data = $H();
    for(property in this)
      if (!Object.isFunction(this[property])) data.set(property, this[property]);
    return '#<Effect:' + data.inspect() + ',options:' + $H(this.options).inspect() + '>';
  }
});

Effect.Parallel = Class.create(Effect.Base, {
  initialize: function(effects) {
    this.effects = effects || [];
    this.start(arguments[1]);
  },
  update: function(position) {
    this.effects.invoke('render', position);
  },
  finish: function(position) {
    this.effects.each( function(effect) {
      effect.render(1.0);
      effect.cancel();
      effect.event('beforeFinish');
      if (effect.finish) effect.finish(position);
      effect.event('afterFinish');
    });
  }
});

Effect.Tween = Class.create(Effect.Base, {
  initialize: function(object, from, to) {
    object = Object.isString(object) ? $(object) : object;
    var args = $A(arguments), method = args.last(),
      options = args.length == 5 ? args[3] : null;
    this.method = Object.isFunction(method) ? method.bind(object) :
      Object.isFunction(object[method]) ? object[method].bind(object) :
      function(value) { object[method] = value };
    this.start(Object.extend({ from: from, to: to }, options || { }));
  },
  update: function(position) {
    this.method(position);
  }
});

Effect.Event = Class.create(Effect.Base, {
  initialize: function() {
    this.start(Object.extend({ duration: 0 }, arguments[0] || { }));
  },
  update: Prototype.emptyFunction
});

Effect.Opacity = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    if (Prototype.Browser.IE && (!this.element.currentStyle.hasLayout))
      this.element.setStyle({zoom: 1});
    var options = Object.extend({
      from: this.element.getOpacity() || 0.0,
      to:   1.0
    }, arguments[1] || { });
    this.start(options);
  },
  update: function(position) {
    this.element.setOpacity(position);
  }
});

Effect.Move = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      x:    0,
      y:    0,
      mode: 'relative'
    }, arguments[1] || { });
    this.start(options);
  },
  setup: function() {
    this.element.makePositioned();
    this.originalLeft = parseFloat(this.element.getStyle('left') || '0');
    this.originalTop  = parseFloat(this.element.getStyle('top')  || '0');
    if (this.options.mode == 'absolute') {
      this.options.x = this.options.x - this.originalLeft;
      this.options.y = this.options.y - this.originalTop;
    }
  },
  update: function(position) {
    this.element.setStyle({
      left: (this.options.x  * position + this.originalLeft).round() + 'px',
      top:  (this.options.y  * position + this.originalTop).round()  + 'px'
    });
  }
});

Effect.MoveBy = function(element, toTop, toLeft) {
  return new Effect.Move(element,
    Object.extend({ x: toLeft, y: toTop }, arguments[3] || { }));
};

Effect.Scale = Class.create(Effect.Base, {
  initialize: function(element, percent) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      scaleX: true,
      scaleY: true,
      scaleContent: true,
      scaleFromCenter: false,
      scaleMode: 'box',        // 'box' or 'contents' or { } with provided values
      scaleFrom: 100.0,
      scaleTo:   percent
    }, arguments[2] || { });
    this.start(options);
  },
  setup: function() {
    this.restoreAfterFinish = this.options.restoreAfterFinish || false;
    this.elementPositioning = this.element.getStyle('position');

    this.originalStyle = { };
    ['top','left','width','height','fontSize'].each( function(k) {
      this.originalStyle[k] = this.element.style[k];
    }.bind(this));

    this.originalTop  = this.element.offsetTop;
    this.originalLeft = this.element.offsetLeft;

    var fontSize = this.element.getStyle('font-size') || '100%';
    ['em','px','%','pt'].each( function(fontSizeType) {
      if (fontSize.indexOf(fontSizeType)>0) {
        this.fontSize     = parseFloat(fontSize);
        this.fontSizeType = fontSizeType;
      }
    }.bind(this));

    this.factor = (this.options.scaleTo - this.options.scaleFrom)/100;

    this.dims = null;
    if (this.options.scaleMode=='box')
      this.dims = [this.element.offsetHeight, this.element.offsetWidth];
    if (/^content/.test(this.options.scaleMode))
      this.dims = [this.element.scrollHeight, this.element.scrollWidth];
    if (!this.dims)
      this.dims = [this.options.scaleMode.originalHeight,
                   this.options.scaleMode.originalWidth];
  },
  update: function(position) {
    var currentScale = (this.options.scaleFrom/100.0) + (this.factor * position);
    if (this.options.scaleContent && this.fontSize)
      this.element.setStyle({fontSize: this.fontSize * currentScale + this.fontSizeType });
    this.setDimensions(this.dims[0] * currentScale, this.dims[1] * currentScale);
  },
  finish: function(position) {
    if (this.restoreAfterFinish) this.element.setStyle(this.originalStyle);
  },
  setDimensions: function(height, width) {
    var d = { };
    if (this.options.scaleX) d.width = width.round() + 'px';
    if (this.options.scaleY) d.height = height.round() + 'px';
    if (this.options.scaleFromCenter) {
      var topd  = (height - this.dims[0])/2;
      var leftd = (width  - this.dims[1])/2;
      if (this.elementPositioning == 'absolute') {
        if (this.options.scaleY) d.top = this.originalTop-topd + 'px';
        if (this.options.scaleX) d.left = this.originalLeft-leftd + 'px';
      } else {
        if (this.options.scaleY) d.top = -topd + 'px';
        if (this.options.scaleX) d.left = -leftd + 'px';
      }
    }
    this.element.setStyle(d);
  }
});

Effect.Highlight = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({ startcolor: '#ffff99' }, arguments[1] || { });
    this.start(options);
  },
  setup: function() {
    if (this.element.getStyle('display')=='none') { this.cancel(); return; }
    this.oldStyle = { };
    if (!this.options.keepBackgroundImage) {
      this.oldStyle.backgroundImage = this.element.getStyle('background-image');
      this.element.setStyle({backgroundImage: 'none'});
    }
    if (!this.options.endcolor)
      this.options.endcolor = this.element.getStyle('background-color').parseColor('#ffffff');
    if (!this.options.restorecolor)
      this.options.restorecolor = this.element.getStyle('background-color');
    this._base  = $R(0,2).map(function(i){ return parseInt(this.options.startcolor.slice(i*2+1,i*2+3),16) }.bind(this));
    this._delta = $R(0,2).map(function(i){ return parseInt(this.options.endcolor.slice(i*2+1,i*2+3),16)-this._base[i] }.bind(this));
  },
  update: function(position) {
    this.element.setStyle({backgroundColor: $R(0,2).inject('#',function(m,v,i){
      return m+((this._base[i]+(this._delta[i]*position)).round().toColorPart()); }.bind(this)) });
  },
  finish: function() {
    this.element.setStyle(Object.extend(this.oldStyle, {
      backgroundColor: this.options.restorecolor
    }));
  }
});

Effect.ScrollTo = function(element) {
  var options = arguments[1] || { },
  scrollOffsets = document.viewport.getScrollOffsets(),
  elementOffsets = $(element).cumulativeOffset();

  if (options.offset) elementOffsets[1] += options.offset;

  return new Effect.Tween(null,
    scrollOffsets.top,
    elementOffsets[1],
    options,
    function(p){ scrollTo(scrollOffsets.left, p.round()); }
  );
};

/* ------------- combination effects ------------- */

Effect.Fade = function(element) {
  element = $(element);
  var oldOpacity = element.getInlineOpacity();
  var options = Object.extend({
    from: element.getOpacity() || 1.0,
    to:   0.0,
    afterFinishInternal: function(effect) {
      if (effect.options.to!=0) return;
      effect.element.hide().setStyle({opacity: oldOpacity});
    }
  }, arguments[1] || { });
  return new Effect.Opacity(element,options);
};

Effect.Appear = function(element) {
  element = $(element);
  var options = Object.extend({
  from: (element.getStyle('display') == 'none' ? 0.0 : element.getOpacity() || 0.0),
  to:   1.0,
  afterFinishInternal: function(effect) {
    effect.element.forceRerendering();
  },
  beforeSetup: function(effect) {
    effect.element.setOpacity(effect.options.from).show();
  }}, arguments[1] || { });
  return new Effect.Opacity(element,options);
};

Effect.Puff = function(element) {
  element = $(element);
  var oldStyle = {
    opacity: element.getInlineOpacity(),
    position: element.getStyle('position'),
    top:  element.style.top,
    left: element.style.left,
    width: element.style.width,
    height: element.style.height
  };
  return new Effect.Parallel(
   [ new Effect.Scale(element, 200,
      { sync: true, scaleFromCenter: true, scaleContent: true, restoreAfterFinish: true }),
     new Effect.Opacity(element, { sync: true, to: 0.0 } ) ],
     Object.extend({ duration: 1.0,
      beforeSetupInternal: function(effect) {
        Position.absolutize(effect.effects[0].element);
      },
      afterFinishInternal: function(effect) {
         effect.effects[0].element.hide().setStyle(oldStyle); }
     }, arguments[1] || { })
   );
};

Effect.BlindUp = function(element) {
  element = $(element);
  element.makeClipping();
  return new Effect.Scale(element, 0,
    Object.extend({ scaleContent: false,
      scaleX: false,
      restoreAfterFinish: true,
      afterFinishInternal: function(effect) {
        effect.element.hide().undoClipping();
      }
    }, arguments[1] || { })
  );
};

Effect.BlindDown = function(element) {
  element = $(element);
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, 100, Object.extend({
    scaleContent: false,
    scaleX: false,
    scaleFrom: 0,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makeClipping().setStyle({height: '0px'}).show();
    },
    afterFinishInternal: function(effect) {
      effect.element.undoClipping();
    }
  }, arguments[1] || { }));
};

Effect.SwitchOff = function(element) {
  element = $(element);
  var oldOpacity = element.getInlineOpacity();
  return new Effect.Appear(element, Object.extend({
    duration: 0.4,
    from: 0,
    transition: Effect.Transitions.flicker,
    afterFinishInternal: function(effect) {
      new Effect.Scale(effect.element, 1, {
        duration: 0.3, scaleFromCenter: true,
        scaleX: false, scaleContent: false, restoreAfterFinish: true,
        beforeSetup: function(effect) {
          effect.element.makePositioned().makeClipping();
        },
        afterFinishInternal: function(effect) {
          effect.element.hide().undoClipping().undoPositioned().setStyle({opacity: oldOpacity});
        }
      });
    }
  }, arguments[1] || { }));
};

Effect.DropOut = function(element) {
  element = $(element);
  var oldStyle = {
    top: element.getStyle('top'),
    left: element.getStyle('left'),
    opacity: element.getInlineOpacity() };
  return new Effect.Parallel(
    [ new Effect.Move(element, {x: 0, y: 100, sync: true }),
      new Effect.Opacity(element, { sync: true, to: 0.0 }) ],
    Object.extend(
      { duration: 0.5,
        beforeSetup: function(effect) {
          effect.effects[0].element.makePositioned();
        },
        afterFinishInternal: function(effect) {
          effect.effects[0].element.hide().undoPositioned().setStyle(oldStyle);
        }
      }, arguments[1] || { }));
};

Effect.Shake = function(element) {
  element = $(element);
  var options = Object.extend({
    distance: 20,
    duration: 0.5
  }, arguments[1] || {});
  var distance = parseFloat(options.distance);
  var split = parseFloat(options.duration) / 10.0;
  var oldStyle = {
    top: element.getStyle('top'),
    left: element.getStyle('left') };
    return new Effect.Move(element,
      { x:  distance, y: 0, duration: split, afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x: -distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x:  distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x: -distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x:  distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.Move(effect.element,
      { x: -distance, y: 0, duration: split, afterFinishInternal: function(effect) {
        effect.element.undoPositioned().setStyle(oldStyle);
  }}); }}); }}); }}); }}); }});
};

Effect.SlideDown = function(element) {
  element = $(element).cleanWhitespace();
  var oldInnerBottom = element.down().getStyle('bottom');
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, 100, Object.extend({
    scaleContent: false,
    scaleX: false,
    scaleFrom: window.opera ? 0 : 1,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makePositioned();
      effect.element.down().makePositioned();
      if (window.opera) effect.element.setStyle({top: ''});
      effect.element.makeClipping().setStyle({height: '0px'}).show();
    },
    afterUpdateInternal: function(effect) {
      effect.element.down().setStyle({bottom:
        (effect.dims[0] - effect.element.clientHeight) + 'px' });
    },
    afterFinishInternal: function(effect) {
      effect.element.undoClipping().undoPositioned();
      effect.element.down().undoPositioned().setStyle({bottom: oldInnerBottom}); }
    }, arguments[1] || { })
  );
};

Effect.SlideUp = function(element) {
  element = $(element).cleanWhitespace();
  var oldInnerBottom = element.down().getStyle('bottom');
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, window.opera ? 0 : 1,
   Object.extend({ scaleContent: false,
    scaleX: false,
    scaleMode: 'box',
    scaleFrom: 100,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makePositioned();
      effect.element.down().makePositioned();
      if (window.opera) effect.element.setStyle({top: ''});
      effect.element.makeClipping().show();
    },
    afterUpdateInternal: function(effect) {
      effect.element.down().setStyle({bottom:
        (effect.dims[0] - effect.element.clientHeight) + 'px' });
    },
    afterFinishInternal: function(effect) {
      effect.element.hide().undoClipping().undoPositioned();
      effect.element.down().undoPositioned().setStyle({bottom: oldInnerBottom});
    }
   }, arguments[1] || { })
  );
};

Effect.Squish = function(element) {
  return new Effect.Scale(element, window.opera ? 1 : 0, {
    restoreAfterFinish: true,
    beforeSetup: function(effect) {
      effect.element.makeClipping();
    },
    afterFinishInternal: function(effect) {
      effect.element.hide().undoClipping();
    }
  });
};

Effect.Grow = function(element) {
  element = $(element);
  var options = Object.extend({
    direction: 'center',
    moveTransition: Effect.Transitions.sinoidal,
    scaleTransition: Effect.Transitions.sinoidal,
    opacityTransition: Effect.Transitions.full
  }, arguments[1] || { });
  var oldStyle = {
    top: element.style.top,
    left: element.style.left,
    height: element.style.height,
    width: element.style.width,
    opacity: element.getInlineOpacity() };

  var dims = element.getDimensions();
  var initialMoveX, initialMoveY;
  var moveX, moveY;

  switch (options.direction) {
    case 'top-left':
      initialMoveX = initialMoveY = moveX = moveY = 0;
      break;
    case 'top-right':
      initialMoveX = dims.width;
      initialMoveY = moveY = 0;
      moveX = -dims.width;
      break;
    case 'bottom-left':
      initialMoveX = moveX = 0;
      initialMoveY = dims.height;
      moveY = -dims.height;
      break;
    case 'bottom-right':
      initialMoveX = dims.width;
      initialMoveY = dims.height;
      moveX = -dims.width;
      moveY = -dims.height;
      break;
    case 'center':
      initialMoveX = dims.width / 2;
      initialMoveY = dims.height / 2;
      moveX = -dims.width / 2;
      moveY = -dims.height / 2;
      break;
  }

  return new Effect.Move(element, {
    x: initialMoveX,
    y: initialMoveY,
    duration: 0.01,
    beforeSetup: function(effect) {
      effect.element.hide().makeClipping().makePositioned();
    },
    afterFinishInternal: function(effect) {
      new Effect.Parallel(
        [ new Effect.Opacity(effect.element, { sync: true, to: 1.0, from: 0.0, transition: options.opacityTransition }),
          new Effect.Move(effect.element, { x: moveX, y: moveY, sync: true, transition: options.moveTransition }),
          new Effect.Scale(effect.element, 100, {
            scaleMode: { originalHeight: dims.height, originalWidth: dims.width },
            sync: true, scaleFrom: window.opera ? 1 : 0, transition: options.scaleTransition, restoreAfterFinish: true})
        ], Object.extend({
             beforeSetup: function(effect) {
               effect.effects[0].element.setStyle({height: '0px'}).show();
             },
             afterFinishInternal: function(effect) {
               effect.effects[0].element.undoClipping().undoPositioned().setStyle(oldStyle);
             }
           }, options)
      );
    }
  });
};

Effect.Shrink = function(element) {
  element = $(element);
  var options = Object.extend({
    direction: 'center',
    moveTransition: Effect.Transitions.sinoidal,
    scaleTransition: Effect.Transitions.sinoidal,
    opacityTransition: Effect.Transitions.none
  }, arguments[1] || { });
  var oldStyle = {
    top: element.style.top,
    left: element.style.left,
    height: element.style.height,
    width: element.style.width,
    opacity: element.getInlineOpacity() };

  var dims = element.getDimensions();
  var moveX, moveY;

  switch (options.direction) {
    case 'top-left':
      moveX = moveY = 0;
      break;
    case 'top-right':
      moveX = dims.width;
      moveY = 0;
      break;
    case 'bottom-left':
      moveX = 0;
      moveY = dims.height;
      break;
    case 'bottom-right':
      moveX = dims.width;
      moveY = dims.height;
      break;
    case 'center':
      moveX = dims.width / 2;
      moveY = dims.height / 2;
      break;
  }

  return new Effect.Parallel(
    [ new Effect.Opacity(element, { sync: true, to: 0.0, from: 1.0, transition: options.opacityTransition }),
      new Effect.Scale(element, window.opera ? 1 : 0, { sync: true, transition: options.scaleTransition, restoreAfterFinish: true}),
      new Effect.Move(element, { x: moveX, y: moveY, sync: true, transition: options.moveTransition })
    ], Object.extend({
         beforeStartInternal: function(effect) {
           effect.effects[0].element.makePositioned().makeClipping();
         },
         afterFinishInternal: function(effect) {
           effect.effects[0].element.hide().undoClipping().undoPositioned().setStyle(oldStyle); }
       }, options)
  );
};

Effect.Pulsate = function(element) {
  element = $(element);
  var options    = arguments[1] || { },
    oldOpacity = element.getInlineOpacity(),
    transition = options.transition || Effect.Transitions.linear,
    reverser   = function(pos){
      return 1 - transition((-Math.cos((pos*(options.pulses||5)*2)*Math.PI)/2) + .5);
    };

  return new Effect.Opacity(element,
    Object.extend(Object.extend({  duration: 2.0, from: 0,
      afterFinishInternal: function(effect) { effect.element.setStyle({opacity: oldOpacity}); }
    }, options), {transition: reverser}));
};

Effect.Fold = function(element) {
  element = $(element);
  var oldStyle = {
    top: element.style.top,
    left: element.style.left,
    width: element.style.width,
    height: element.style.height };
  element.makeClipping();
  return new Effect.Scale(element, 5, Object.extend({
    scaleContent: false,
    scaleX: false,
    afterFinishInternal: function(effect) {
    new Effect.Scale(element, 1, {
      scaleContent: false,
      scaleY: false,
      afterFinishInternal: function(effect) {
        effect.element.hide().undoClipping().setStyle(oldStyle);
      } });
  }}, arguments[1] || { }));
};

Effect.Morph = Class.create(Effect.Base, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      style: { }
    }, arguments[1] || { });

    if (!Object.isString(options.style)) this.style = $H(options.style);
    else {
      if (options.style.include(':'))
        this.style = options.style.parseStyle();
      else {
        this.element.addClassName(options.style);
        this.style = $H(this.element.getStyles());
        this.element.removeClassName(options.style);
        var css = this.element.getStyles();
        this.style = this.style.reject(function(style) {
          return style.value == css[style.key];
        });
        options.afterFinishInternal = function(effect) {
          effect.element.addClassName(effect.options.style);
          effect.transforms.each(function(transform) {
            effect.element.style[transform.style] = '';
          });
        };
      }
    }
    this.start(options);
  },

  setup: function(){
    function parseColor(color){
      if (!color || ['rgba(0, 0, 0, 0)','transparent'].include(color)) color = '#ffffff';
      color = color.parseColor();
      return $R(0,2).map(function(i){
        return parseInt( color.slice(i*2+1,i*2+3), 16 );
      });
    }
    this.transforms = this.style.map(function(pair){
      var property = pair[0], value = pair[1], unit = null;

      if (value.parseColor('#zzzzzz') != '#zzzzzz') {
        value = value.parseColor();
        unit  = 'color';
      } else if (property == 'opacity') {
        value = parseFloat(value);
        if (Prototype.Browser.IE && (!this.element.currentStyle.hasLayout))
          this.element.setStyle({zoom: 1});
      } else if (Element.CSS_LENGTH.test(value)) {
          var components = value.match(/^([\+\-]?[0-9\.]+)(.*)$/);
          value = parseFloat(components[1]);
          unit = (components.length == 3) ? components[2] : null;
      }

      var originalValue = this.element.getStyle(property);
      return {
        style: property.camelize(),
        originalValue: unit=='color' ? parseColor(originalValue) : parseFloat(originalValue || 0),
        targetValue: unit=='color' ? parseColor(value) : value,
        unit: unit
      };
    }.bind(this)).reject(function(transform){
      return (
        (transform.originalValue == transform.targetValue) ||
        (
          transform.unit != 'color' &&
          (isNaN(transform.originalValue) || isNaN(transform.targetValue))
        )
      );
    });
  },
  update: function(position) {
    var style = { }, transform, i = this.transforms.length;
    while(i--)
      style[(transform = this.transforms[i]).style] =
        transform.unit=='color' ? '#'+
          (Math.round(transform.originalValue[0]+
            (transform.targetValue[0]-transform.originalValue[0])*position)).toColorPart() +
          (Math.round(transform.originalValue[1]+
            (transform.targetValue[1]-transform.originalValue[1])*position)).toColorPart() +
          (Math.round(transform.originalValue[2]+
            (transform.targetValue[2]-transform.originalValue[2])*position)).toColorPart() :
        (transform.originalValue +
          (transform.targetValue - transform.originalValue) * position).toFixed(3) +
            (transform.unit === null ? '' : transform.unit);
    this.element.setStyle(style, true);
  }
});

Effect.Transform = Class.create({
  initialize: function(tracks){
    this.tracks  = [];
    this.options = arguments[1] || { };
    this.addTracks(tracks);
  },
  addTracks: function(tracks){
    tracks.each(function(track){
      track = $H(track);
      var data = track.values().first();
      this.tracks.push($H({
        ids:     track.keys().first(),
        effect:  Effect.Morph,
        options: { style: data }
      }));
    }.bind(this));
    return this;
  },
  play: function(){
    return new Effect.Parallel(
      this.tracks.map(function(track){
        var ids = track.get('ids'), effect = track.get('effect'), options = track.get('options');
        var elements = [$(ids) || $$(ids)].flatten();
        return elements.map(function(e){ return new effect(e, Object.extend({ sync:true }, options)) });
      }).flatten(),
      this.options
    );
  }
});

Element.CSS_PROPERTIES = $w(
  'backgroundColor backgroundPosition borderBottomColor borderBottomStyle ' +
  'borderBottomWidth borderLeftColor borderLeftStyle borderLeftWidth ' +
  'borderRightColor borderRightStyle borderRightWidth borderSpacing ' +
  'borderTopColor borderTopStyle borderTopWidth bottom clip color ' +
  'fontSize fontWeight height left letterSpacing lineHeight ' +
  'marginBottom marginLeft marginRight marginTop markerOffset maxHeight '+
  'maxWidth minHeight minWidth opacity outlineColor outlineOffset ' +
  'outlineWidth paddingBottom paddingLeft paddingRight paddingTop ' +
  'right textIndent top width wordSpacing zIndex');

Element.CSS_LENGTH = /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/;

String.__parseStyleElement = document.createElement('div');
String.prototype.parseStyle = function(){
  var style, styleRules = $H();
  if (Prototype.Browser.WebKit)
    style = new Element('div',{style:this}).style;
  else {
    String.__parseStyleElement.innerHTML = '<div style="' + this + '"></div>';
    style = String.__parseStyleElement.childNodes[0].style;
  }

  Element.CSS_PROPERTIES.each(function(property){
    if (style[property]) styleRules.set(property, style[property]);
  });

  if (Prototype.Browser.IE && this.include('opacity'))
    styleRules.set('opacity', this.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1]);

  return styleRules;
};

if (document.defaultView && document.defaultView.getComputedStyle) {
  Element.getStyles = function(element) {
    var css = document.defaultView.getComputedStyle($(element), null);
    return Element.CSS_PROPERTIES.inject({ }, function(styles, property) {
      styles[property] = css[property];
      return styles;
    });
  };
} else {
  Element.getStyles = function(element) {
    element = $(element);
    var css = element.currentStyle, styles;
    styles = Element.CSS_PROPERTIES.inject({ }, function(results, property) {
      results[property] = css[property];
      return results;
    });
    if (!styles.opacity) styles.opacity = element.getOpacity();
    return styles;
  };
}

Effect.Methods = {
  morph: function(element, style) {
    element = $(element);
    new Effect.Morph(element, Object.extend({ style: style }, arguments[2] || { }));
    return element;
  },
  visualEffect: function(element, effect, options) {
    element = $(element);
    var s = effect.dasherize().camelize(), klass = s.charAt(0).toUpperCase() + s.substring(1);
    new Effect[klass](element, options);
    return element;
  },
  highlight: function(element, options) {
    element = $(element);
    new Effect.Highlight(element, options);
    return element;
  }
};

$w('fade appear grow shrink fold blindUp blindDown slideUp slideDown '+
  'pulsate shake puff squish switchOff dropOut').each(
  function(effect) {
    Effect.Methods[effect] = function(element, options){
      element = $(element);
      Effect[effect.charAt(0).toUpperCase() + effect.substring(1)](element, options);
      return element;
    };
  }
);

$w('getInlineOpacity forceRerendering setContentZoom collectTextNodes collectTextNodesIgnoreClass getStyles').each(
  function(f) { Effect.Methods[f] = Element[f]; }
);

Element.addMethods(Effect.Methods);
document.observe("dom:loaded", function() {
  if (!$(document.body).hasClassName("identity_validation")) return;

  var valid = {}, username, password, confirmation, request;
  var form = $(document.body).down("form.identity_form");
  var originalUsername = $F("username");

  function get(id) {
    if ($(id)) return $F(id);
  }

  function validateElement(element) {
    element.up(".validated_field").
      removeClassName("invalid").
      addClassName("valid");
    valid[element.id] = true;
  }

  function invalidateElement(element, message) {
    var field = element.up(".validated_field");
    field.removeClassName("valid").
      addClassName("invalid");
    field.down("p.error").update(message);
    valid[element.id] = false;
  }

  function resetElement(element) {
    var field = element.up(".validated_field");
    field.removeClassName("valid").
      removeClassName("invalid");
    field.down("p.error").update("");
    valid[element.id] = false;
  }

  function getErrorForUsername() {
    username = $("username").getValue().strip().gsub(/\s+/, " ");
    if (username.length < 3) {
      return "Must have at least three characters";
    }
  }

  function checkUsernameAvailability() {
    new Ajax.Request("/id/identities/availability", {
      parameters: { username: username, first_name: get("first_name"), last_name: get("last_name") },
      method:     "get",
      evalJSON:   true,
      onComplete: function(transport) {
        var result = transport.responseJSON;
        if (originalUsername.length && result.username == originalUsername) return;
        if (result && result.username == username && username && !result.available) {
          var message = "The username \"" + username.escapeHTML() + "\" is unavailable, sorry.";
          if ($("username_suggestions")) message += "<br />Try another one or select from the suggestions below.";
          invalidateElement($("username"), message);
          suggestUsernames(result.suggestions);
        }
      }
    });
  }

  function suggestUsernames(suggestions) {
    if (!$("username_suggestions")) return;
    if (suggestions && suggestions.length) {
      $("username_suggestions").show().down("ul").update(
        suggestions.map(function(suggestedUsername) {
          var escapedUsername = suggestedUsername.escapeHTML();
          return "<li><a href=# data='" + escapedUsername +
            "'>" + escapedUsername + "</a></li>";
        }).join("")
      );
    } else {
      hideUsernameSuggestions();
    }
  }

  function hideUsernameSuggestions() {
    if (!$("username_suggestions")) return;
    $("username_suggestions").hide();
  }

  function getErrorForPassword() {
    password = $("password").getValue();
    if (password.length < 6) {
      return "For security your password must be at least 6 characters";
    } else if (password == "password") {
      return "Must not be \"password\"";
    } else if (username && username.length && password == username) {
      return "Your password can not be the same as your username";
    }
  }

  function getErrorForPasswordConfirmation() {
    confirmation = $("password_confirmation").getValue();
    if (confirmation.length && confirmation != password)  {
      return "These passwords don't match. Please try again. Remember that passwords are case sensitive.";
    }
  }

  function performInteractiveValidationFor(element, validator, existingValue) {
    var value = element.getValue();
    if (element.getValue() == existingValue) return;

    if (!value.length || validator()) {
      resetElement(element);
    } else {
      validateElement(element);
    }
  }

  function performValidationFor(element, validator, complainAboutBlankValues) {
    var message = (validator || Prototype.K)(), value = element.getValue();

    if (!value.length) {
      if (complainAboutBlankValues) {
        invalidateElement(element, message);
      } else {
        resetElement(element);
      }
      return false;
    } else if (message) {
      invalidateElement(element, message);
      return false;
    } else {
      validateElement(element);
      return true;
    }
  }

  function dummifyElement(element) {
    if (element.hasClassName("dummy")) {
      element.setValue("                      ").writeAttribute("data-dummy", "true");
    }
  }

  function undummifyElement(element) {
    if (element.readAttribute("data-dummy")) {
      element.setValue("").writeAttribute("data-dummy", null);
    }
  }

  function dummify() {
    if (!$F("password") && !$F("password_confirmation")) {
      dummifyElement($("password"));
      dummifyElement($("password_confirmation"));
    }
  }

  function undummify() {
    undummifyElement($("password"));
    undummifyElement($("password_confirmation"));
  }

  function isUsingOpenID() {
    if ($("open_id_url")) {
      return $("open_id_url").up(".signal_id_credentials").visible();
    }
  }

  $("username").observe("keyup", function(event) {
    hideUsernameSuggestions();
    resetElement(this);
  });

  $("username").observe("blur", function(event) {
    hideUsernameSuggestions();
    if (performValidationFor(this, getErrorForUsername)) {
      checkUsernameAvailability();
    }
  });

  $("password").observe("focus", function(event) {
    undummify();
  });

  $("password").observe("keyup", function(event) {
    performInteractiveValidationFor(this, getErrorForPassword, password);
  });

  $("password").observe("blur", function(event) {
    performValidationFor(this, getErrorForPassword);
    dummify();
  });

  $("password_confirmation").observe("focus", function(event) {
    undummify();
  });

  $("password_confirmation").observe("keyup", function(event) {
    if (event.keyCode != Event.KEY_RETURN) {
      performInteractiveValidationFor(this, getErrorForPasswordConfirmation);
    }
  });

  $("password_confirmation").observe("blur", function(event) {
    performValidationFor(this, getErrorForPasswordConfirmation);
    dummify();
  });

  form.observe("click", function(event) {
    var element = event.findElement(".username_suggestions a[data]");
    if (element) {
      username = element.readAttribute("data");
      $("username").setValue(username);
      validateElement($("username"));
      hideUsernameSuggestions();
      checkUsernameAvailability();
      $("password").focus();
      event.stop();
    }
  });

  form.observe("submit", function(event) {
    if (isUsingOpenID()) {
      if (!performValidationFor($("open_id_url"))) {
        event.stop();
      }

    } else {
      if ($("open_id_url")) {
        $("open_id_url").setValue("");
      }

      performValidationFor($("username"), getErrorForUsername, true);

      if ($("password").hasClassName("dummy")) {
        undummify();
        valid.password = valid.password_confirmation = true;
      } else {
        performValidationFor($("password"), getErrorForPassword, true);
        performValidationFor($("password_confirmation"), getErrorForPasswordConfirmation, true);
      }

      if (!valid.username || !valid.password || !valid.password_confirmation) {
        event.stop();
      }
    }
  });

  dummify();

  if ($("username").hasClassName("autofocus")) {
    (function() { $("username").focus() }).defer();
  }
});
Element.addMethods({
  trace: function(element, expression) {
    element = $(element);
    if (element.match(expression)) return element;
    return element.up(expression);
  }
});
Element.addMethods({
  upwards: function(element, iterator) {
    while (element = $(element)) {
      if (element.URL !== undefined) return;
      if (iterator(element)) return element;
      element = element.parentNode;
    }
  }
});

var HoverObserver = Class.create({
  initialize: function(element, options) {
    this.element = $(element);
    this.options = Object.extend(Object.clone(HoverObserver.Options), options || {});
    this.start();
  },

  start: function() {
    if (!this.observers) {
      var events = $w(this.options.clickToHover ? "click" : "mouseover mouseout");
      this.observers = events.map(function(name) {
        var handler = this["on" + name.capitalize()].bind(this);
        this.element.observe(name, handler);
        return { name: name, handler: handler };
      }.bind(this));
    }
  },

  stop: function() {
    if (this.observers) {
      this.observers.each(function(info) {
        this.element.stopObserving(info.name, info.handler);
      }.bind(this));
      delete this.observers;
    }
  },

  onClick: function(event) {
    var element   = this.activeHoverElement = event.findElement();
    var container = this.getContainerForElement(element);

    if (container) {
      if (this.activeContainer && container == this.activeContainer)
        return this.deactivateContainer();
      this.activateContainer(container);
    }
  },

  onMouseover: function(event) {
    var element   = this.activeHoverElement = event.findElement();
    var container = this.getContainerForElement(element);

    if (container) {
      if (this.activeContainer) {
        this.activateContainer(container);
      } else {
        this.startDelayedActivation(container);
      }
    } else {
      this.startDelayedDeactivation();
    }
  },

  onMouseout: function(event) {
    delete this.activeHoverElement;
    this.startDelayedDeactivation();
  },

  activateContainer: function(container) {
    var memo = { toElement: container };
    this.stopDelayedDeactivation();

    if (this.activeContainer) {
      if (this.activeContainer == container) return;
      memo.fromElement = this.activeContainer;
      this.deactivateContainer(memo);
    }

    this.activeContainer = container;
    this.activeContainer.fire(this.options.activationEvent, memo);
    this.activeContainer.addClassName(this.options.activeClassName);
  },

  deactivateContainer: function(memo) {
    if (this.activeContainer) {
      try {
        this.activeContainer.removeClassName(this.options.activeClassName);
        this.activeContainer.fire(this.options.deactivationEvent, memo);
      } catch (e) {
      }

      delete this.activeContainer;
    }
  },

  startDelayedActivation: function(container) {
    if (this.options.activationDelay) {
      (function() {
        if (container == this.getContainerForElement(this.activeHoverElement))
          this.activateContainer(container);

      }).bind(this).delay(this.options.activationDelay);
    } else {
      this.activateContainer(container);
    }
  },

  startDelayedDeactivation: function() {
    if (this.options.deactivationDelay) {
      this.deactivationTimeout = this.deactivationTimeout || function() {
        var container = this.getContainerForElement(this.activeHoverElement);
        if (!container || container != this.activeContainer)
          this.deactivateContainer();

      }.bind(this).delay(this.options.deactivationDelay);
    } else {
      this.deactivateContainer();
    }
  },

  stopDelayedDeactivation: function() {
    if (this.deactivationTimeout) {
      window.clearTimeout(this.deactivationTimeout);
      delete this.deactivationTimeout;
    }
  },

  getContainerForElement: function(element) {
    if (!element) return;
    if (element.hasAttribute && !element.hasAttribute(this.options.containerAttribute)) {
      var target    = this.getTargetForElement(element);
      var container = this.getContainerForTarget(target);
      this.cacheContainerFromElementToTarget(container, element, target);
    }

    return $(element.readAttribute(this.options.containerAttribute));
  },

  getTargetForElement: function(element) {
    if (!element) return;
    return element.trace("." + this.options.targetClassName);
  },

  getContainerForTarget: function(element) {
    if (!element) return;
    var containerClassName = this.options.containerClassName,
        containerAttribute = this.options.containerAttribute,
        expression = "[" + containerAttribute + "], ." + containerClassName;

    var container = (element.hasClassName(containerClassName)) ? element : element.trace(expression);

    if (container && container.hasAttribute(containerAttribute)) {
      return $(container.readAttribute(containerAttribute));
    } else {
      return container;
    }
  },

  cacheContainerFromElementToTarget: function(container, element, target) {
    if (container && target) {
      element.upwards(function(e) {
        e.writeAttribute(this.options.containerAttribute, container.identify());
        if (e == target) return true;
      }.bind(this));
    }
  }
});

Object.extend(HoverObserver, {
  Options: {
    activationDelay:    0,
    deactivationDelay:  0.5,
    targetClassName:    "hover_target",
    containerClassName: "hover_container",
    containerAttribute: "hover_container",
    activeClassName:    "hover",
    activationEvent:    "hover:activated",
    deactivationEvent:  "hover:deactivated",
    clickToHover:       false
  }
});


var OpenBar = {
  selectCurrent: function(application, name) {
    $(document.body).addClassName("with_open_bar");

    var app_id  = 'open_bar_app_' + application;
    var link_id = 'open_bar_link_' + application + '_' + name;

    if ($(app_id)) $(app_id).addClassName('on');

    if ($(link_id)) {
      $(link_id).addClassName('current_account');
      if ($(app_id)) $(app_id).innerHTML += ": " + $(link_id).innerHTML;
      $(link_id).innerHTML = "&bull; " + $(link_id).innerHTML;
    }
  }
};
document.observe("dom:loaded", function() {
  document.observe("click", function(event) {
    if (event.findElement("a.toggle_credentials")) {
      var focused, field;

      $(document.body).select(".signal_id_credentials").each(function(element) {
        if (element.visible()) {
          element.hide();
        } else {
          if (!focused) {
            field = element.down("input[type=text]");
            if (field) {
              (function() { field.focus() }).defer();
              focused = true;
            }
          }
          element.show();
        }
      });

      event.stop();
    }
  });
});

Effect.Height = Class.create();
Object.extend(Effect.Height.prototype, Effect.Base.prototype);
Object.extend(Effect.Height.prototype, {
  initialize: function(element, options) {
    this.element = $(element);
    options = Object.extend({
      from: this.element.getHeight(),
      to: 0
    }, options || {});
    this.start(options);
  },

  setup: function() {
    this.setHeight(this.options.from);
  },

  update: function(position) {
    this.setHeight(position);
  },

  finish: function() {
    this.setHeight(this.options.to);
  },

  setHeight: function(height) {
    this.element.style.height = parseInt(height) + "px";
  }
});

Effect.Blend = Class.create();
Object.extend(Effect.Blend.prototype, Effect.Base.prototype);
Object.extend(Effect.Blend.prototype, {
  initialize: function(element, options) {
    this.element = $(element);
    options = Object.extend({
      invert: false,
      from: 0.0,
      to: 1.0
    }, options || {});
    this.start(options);
  },

  setup: function() {
    this.setOpacityByPosition(this.options.from);
  },

  update: function(position) {
    this.setOpacityByPosition(position);
  },

  finish: function() {
    this.setOpacityByPosition(this.options.to);
  },

  setOpacityByPosition: function(position) {
    var opacity = this.options.invert ? 1.0 - position : position;
    this.element.setOpacity(opacity);
  }
});

var Transitions = {
  animationEnabled: true
};

Element.addMethods({
  transition: function(element, change, options) {
    if (typeof change == "object" && typeof options == "function")
      change = [change, options], options = change.shift(), change = change.shift();

    element = $(element);
    options = options || {};
    options.animate = options.animate !== false && Transitions.animationEnabled;
    options.fade = options.fade !== false;

    function finish() {
      (options.after || Prototype.K)();
    }

    function highlightAndFinish(destinationElement) {
      if (options.highlight) {
        var highlightElement = options.highlight === true ? destinationElement : ($(options.highlight) || destinationElement);
        new Effect.Highlight(highlightElement, { duration: 2, afterFinish: finish });
      } else {
        finish.defer();
      }
    }

    function cloneWithoutIDs(element) {
      element = $(element);
      var clone = element.cloneNode(true);
      clone.id = "";
      clone.getElementsBySelector("*[id]").each(function(e) { e.id = "" });
      return clone;
    }

    if (options.animate) {
      var transitionElement = new Element("div").setStyle({ position: "relative", overflow: "hidden" });
      element.insert({ before: transitionElement });

      var sourceElement = cloneWithoutIDs(element);
      var sourceElementWrapper = sourceElement.wrap("div");
      var destinationElementWrapper = element.wrap("div");
      transitionElement.appendChild(sourceElementWrapper);
      transitionElement.appendChild(destinationElementWrapper);
    }

    change(element);

    if (options.animate) {
      var sourceHeight = sourceElementWrapper.getHeight(), destinationHeight = destinationElementWrapper.getHeight();
      var sourceWidth  = sourceElementWrapper.getWidth(),  destinationWidth  = destinationElementWrapper.getWidth();

      var outerWrapper = new Element("div");
      transitionElement.insert({ before: outerWrapper });
      outerWrapper.setStyle({ overflow: "hidden", height: sourceHeight + "px"});
      outerWrapper.appendChild(transitionElement);

      var maxHeight = destinationHeight > sourceHeight ? destinationHeight : sourceHeight;
      transitionElement.setStyle({ height: maxHeight + "px" });
      sourceElementWrapper.setStyle({ position: "absolute", height: maxHeight + "px", width: sourceWidth + "px", top: 0, left: 0 });
      destinationElementWrapper.setStyle({ position: "absolute", height: maxHeight + "px", width: sourceWidth + "px", top: 0, left: 0, opacity: 0, zIndex: 2000 });

      var effects = [
        new Effect.Height(transitionElement, { sync: true, from: sourceHeight, to: destinationHeight }),
        new Effect.Blend(destinationElementWrapper, { sync: true })
      ];

      if (options.fade) {
        effects.push(new Effect.Blend(sourceElementWrapper, { invert: true, sync: true }));
        destinationElementWrapper.setStyle({ zIndex: 0 });
        sourceElementWrapper.setStyle({ zIndex: 2000 });
      }

      new Effect.Parallel(effects, {
        duration: options.duration || 0.3,

        afterUpdate: function() {
          if (outerWrapper) {
            outerWrapper.insert({ before: transitionElement });
            outerWrapper.remove();
            outerWrapper = false;
          }
        },

        afterFinish: function() {
          var destinationElement = destinationElementWrapper.down();
          if (destinationElement)
            transitionElement.insert({ before: destinationElement });
          transitionElement.remove();

          highlightAndFinish(destinationElement);
        }
      });

    } else {
      highlightAndFinish(element);
    }

    return {
      after: function(after) {
        options.after = (options.after || Prototype.K).wrap(function(proceed) {
          proceed();
          after();
        });
        return this;
      }
    };
  }
});


if (Prototype.Browser.WebKit) {
  document.observe("dom:loaded", function() {
    document.documentElement.setStyle({
      backgroundColor: document.body.getStyle("backgroundColor")
    });
  });
}

Object.extend(Array.prototype, {
  returnFirstApplication: function(iterator) {
    var result;
    this.each(function(value) {
      result = iterator(value);
      if (result) throw $break;
    })
    return result;
  }
});

var MessageTransformers = {
  applyFirst: function(text) {
    return [ImageAutolink, YoutubeVideoAutolink, Autolink].returnFirstApplication(function(transformer) {
      return transformer.transform(text);
    });
  }
};

function $T() {
  return new Date().getTime();
}

function $P(value) {
  return parseInt(document.documentElement.clientWidth * value / 100.0);
}
/*
Macromedia(r) Flash(r) JavaScript Integration Kit License


Copyright (c) 2005 Macromedia, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation and/or
other materials provided with the distribution.

3. The end-user documentation included with the redistribution, if any, must
include the following acknowledgment:

"This product includes software developed by Macromedia, Inc.
(http://www.macromedia.com)."

Alternately, this acknowledgment may appear in the software itself, if and
wherever such third-party acknowledgments normally appear.

4. The name Macromedia must not be used to endorse or promote products derived
from this software without prior written permission. For written permission,
please contact devrelations@macromedia.com.

5. Products derived from this software may not be called "Macromedia" or
"Macromedia Flash", nor may "Macromedia" or "Macromedia Flash" appear in their
name.

THIS SOFTWARE IS PROVIDED "AS IS" AND ANY EXPRESSED OR IMPLIED WARRANTIES,
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL MACROMEDIA OR
ITS CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
DAMAGE.

--

This code is part of the Flash / JavaScript Integration Kit:
http://www.macromedia.com/go/flashjavascript/

Created by:

Christian Cantrell
http://weblogs.macromedia.com/cantrell/
mailto:cantrell@macromedia.com

Mike Chambers
http://weblogs.macromedia.com/mesh/
mailto:mesh@macromedia.com

Macromedia
*/

/**
 * Create a new Exception object.
 * name: The name of the exception.
 * message: The exception message.
 */
function Exception(name, message)
{
    if (name)
        this.name = name;
    if (message)
        this.message = message;
}

/**
 * Set the name of the exception.
 */
Exception.prototype.setName = function(name)
{
    this.name = name;
}

/**
 * Get the exception's name.
 */
Exception.prototype.getName = function()
{
    return this.name;
}

/**
 * Set a message on the exception.
 */
Exception.prototype.setMessage = function(msg)
{
    this.message = msg;
}

/**
 * Get the exception message.
 */
Exception.prototype.getMessage = function()
{
    return this.message;
}

/**
 * Generates a browser-specific Flash tag. Create a new instance, set whatever
 * properties you need, then call either toString() to get the tag as a string, or
 * call write() to write the tag out.
 */

/**
 * Creates a new instance of the FlashTag.
 * src: The path to the SWF file.
 * width: The width of your Flash content.
 * height: the height of your Flash content.
 */
function FlashTag(src, width, height)
{
    this.src       = src;
    this.width     = width;
    this.height    = height;
    this.version   = '7,0,14,0';
    this.id        = null;
    this.bgcolor   = 'ffffff';
    this.flashVars = null;
}

/**
 * Sets the Flash version used in the Flash tag.
 */
FlashTag.prototype.setVersion = function(v)
{
    this.version = v;
}

/**
 * Sets the ID used in the Flash tag.
 */
FlashTag.prototype.setId = function(id)
{
    this.id = id;
}

/**
 * Sets the background color used in the Flash tag.
 */
FlashTag.prototype.setBgcolor = function(bgc)
{
    this.bgcolor = bgc;
}

/**
 * Sets any variables to be passed into the Flash content.
 */
FlashTag.prototype.setFlashvars = function(fv)
{
    this.flashVars = fv;
}

/**
 * Get the Flash tag as a string.
 */
FlashTag.prototype.toString = function()
{
    var ie = (navigator.appName.indexOf ("Microsoft") != -1) ? 1 : 0;
    var flashTag = new String();
    if (ie)
    {
        flashTag += '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" ';
        if (this.id != null)
        {
            flashTag += 'id="'+this.id+'" ';
        }
        flashTag += 'codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version='+this.version+'" ';
        flashTag += 'width="'+this.width+'" ';
        flashTag += 'height="'+this.height+'">';
        flashTag += '<param name="movie" value="'+this.src+'"/>';
        flashTag += '<param name="quality" value="high"/>';
        flashTag += '<param name="bgcolor" value="#'+this.bgcolor+'"/>';
        if (this.flashVars != null)
        {
            flashTag += '<param name="flashvars" value="'+this.flashVars+'"/>';
        }
        flashTag += '</object>';
    }
    else
    {
        flashTag += '<embed src="'+this.src+'" ';
        flashTag += 'quality="high" ';
        flashTag += 'bgcolor="#'+this.bgcolor+'" ';
        flashTag += 'width="'+this.width+'" ';
        flashTag += 'height="'+this.height+'" ';
        flashTag += 'type="application/x-shockwave-flash" ';
        if (this.flashVars != null)
        {
            flashTag += 'flashvars="'+this.flashVars+'" ';
        }
        if (this.id != null)
        {
            flashTag += 'name="'+this.id+'" ';
        }
        flashTag += 'pluginspage="http://www.macromedia.com/go/getflashplayer">';
        flashTag += '</embed>';
    }
    return flashTag;
}

/**
 * Write the Flash tag out. Pass in a reference to the document to write to.
 */
FlashTag.prototype.write = function(doc)
{
    doc.write(this.toString());
}

/**
 * The FlashSerializer serializes JavaScript variables of types object, array, string,
 * number, date, boolean, null or undefined into XML.
 */

/**
 * Create a new instance of the FlashSerializer.
 * useCdata: Whether strings should be treated as character data. If false, strings are simply XML encoded.
 */
function FlashSerializer(useCdata)
{
    this.useCdata = useCdata;
}

/**
 * Serialize an array into a format that can be deserialized in Flash. Supported data types are object,
 * array, string, number, date, boolean, null, and undefined. Returns a string of serialized data.
 */
FlashSerializer.prototype.serialize = function(args)
{
    var qs = new String();

    for (var i = 0; i < args.length; ++i)
    {
        switch(typeof(args[i]))
        {
            case 'undefined':
                qs += 't'+(i)+'=undf';
                break;
            case 'string':
                qs += 't'+(i)+'=str&d'+(i)+'='+escape(args[i]);
                break;
            case 'number':
                qs += 't'+(i)+'=num&d'+(i)+'='+escape(args[i]);
                break;
            case 'boolean':
                qs += 't'+(i)+'=bool&d'+(i)+'='+escape(args[i]);
                break;
            case 'object':
                if (args[i] == null)
                {
                    qs += 't'+(i)+'=null';
                }
                else if (args[i] instanceof Date)
                {
                    qs += 't'+(i)+'=date&d'+(i)+'='+escape(args[i].getTime());
                }
                else // array or object
                {
                    try
                    {
                        qs += 't'+(i)+'=xser&d'+(i)+'='+escape(this._serializeXML(args[i]));
                    }
                    catch (exception)
                    {
                        throw new Exception("FlashSerializationException",
                                            "The following error occurred during complex object serialization: " + exception.getMessage());
                    }
                }
                break;
            default:
                throw new Exception("FlashSerializationException",
                                    "You can only serialize strings, numbers, booleans, dates, objects, arrays, nulls, and undefined.");
        }

        if (i != (args.length - 1))
        {
            qs += '&';
        }
    }

    return qs;
}

/**
 * Private
 */
FlashSerializer.prototype._serializeXML = function(obj)
{
    var doc = new Object();
    doc.xml = '<fp>';
    this._serializeNode(obj, doc, null);
    doc.xml += '</fp>';
    return doc.xml;
}

/**
 * Private
 */
FlashSerializer.prototype._serializeNode = function(obj, doc, name)
{
    switch(typeof(obj))
    {
        case 'undefined':
            doc.xml += '<undf'+this._addName(name)+'/>';
            break;
        case 'string':
            doc.xml += '<str'+this._addName(name)+'>'+this._escapeXml(obj)+'</str>';
            break;
        case 'number':
            doc.xml += '<num'+this._addName(name)+'>'+obj+'</num>';
            break;
        case 'boolean':
            doc.xml += '<bool'+this._addName(name)+' val="'+obj+'"/>';
            break;
        case 'object':
            if (obj == null)
            {
                doc.xml += '<null'+this._addName(name)+'/>';
            }
            else if (obj instanceof Date)
            {
                doc.xml += '<date'+this._addName(name)+'>'+obj.getTime()+'</date>';
            }
            else if (obj instanceof Array)
            {
                doc.xml += '<array'+this._addName(name)+'>';
                for (var i = 0; i < obj.length; ++i)
                {
                    this._serializeNode(obj[i], doc, null);
                }
                doc.xml += '</array>';
            }
            else
            {
                doc.xml += '<obj'+this._addName(name)+'>';
                for (var n in obj)
                {
                    if (typeof(obj[n]) == 'function')
                        continue;
                    this._serializeNode(obj[n], doc, n);
                }
                doc.xml += '</obj>';
            }
            break;
        default:
            throw new Exception("FlashSerializationException",
                                "You can only serialize strings, numbers, booleans, objects, dates, arrays, nulls and undefined");
            break;
    }
}

/**
 * Private
 */
FlashSerializer.prototype._addName= function(name)
{
    if (name != null)
    {
        return ' name="'+name+'"';
    }
    return '';
}

/**
 * Private
 */
FlashSerializer.prototype._escapeXml = function(str)
{
    if (this.useCdata)
        return '<![CDATA['+str+']]>';
    else
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;');
}

/**
 * The FlashProxy object is what proxies function calls between JavaScript and Flash.
 * It handles all argument serialization issues.
 */

/**
 * Instantiates a new FlashProxy object. Pass in a uniqueID and the name (including the path)
 * of the Flash proxy SWF. The ID is the same ID that needs to be passed into your Flash content as lcId.
 */
function FlashProxy(uid, proxySwfName)
{
    this.uid = uid;
    this.proxySwfName = proxySwfName;
    this.flashSerializer = new FlashSerializer(false);
}

/**
 * Call a function in your Flash content.  Arguments should be:
 * 1. ActionScript function name to call,
 * 2. any number of additional arguments of type object,
 *    array, string, number, boolean, date, null, or undefined.
 */
FlashProxy.prototype.call = function()
{

    if (arguments.length == 0)
    {
        throw new Exception("Flash Proxy Exception",
                            "The first argument should be the function name followed by any number of additional arguments.");
    }

    var qs = 'lcId=' + escape(this.uid) + '&functionName=' + escape(arguments[0]);

    if (arguments.length > 1)
    {
        var justArgs = new Array();
        for (var i = 1; i < arguments.length; ++i)
        {
            justArgs.push(arguments[i]);
        }
        qs += ('&' + this.flashSerializer.serialize(justArgs));
    }

    var divName = '_flash_proxy_' + this.uid;
    if(!document.getElementById(divName))
    {
        var newTarget = document.createElement("div");
        newTarget.id = divName;
        document.body.appendChild(newTarget);
    }
    var target = document.getElementById(divName);
    var ft = new FlashTag(this.proxySwfName, 1, 1);
    ft.setVersion('6,0,65,0');
    ft.setFlashvars(qs);
    target.innerHTML = ft.toString();
}

/**
 * This is the function that proxies function calls from Flash to JavaScript.
 * It is called implicitly.
 */
FlashProxy.callJS = function()
{
    var functionToCall = eval(arguments[0]);
    var argArray = new Array();
    for (var i = 1; i < arguments.length; ++i)
    {
        argArray.push(arguments[i]);
    }
    functionToCall.apply(functionToCall, argArray);
}

var Multipart = {}

Multipart.encode = function(boundary, parameters, files) {
  var encoded = {}, parts = []
  for (var key in parameters) encoded[key] = Multipart.encode.param(key, parameters[key])
  for (var key in files)      encoded[key] = Multipart.encode.fileParam(key, files[key])
  for (var key in encoded)    parts.push(encoded[key])
  return Multipart.encode.parts(parts, boundary)
}

Multipart.encode.parts = function(parts, boundary) {
  return '--' + boundary + '\r\n' + parts.join('--' + boundary + '\r\n') + '--' + boundary + '--\r\n'
}

Multipart.encode.param = function(key, value) {
  var encoded = ''
  encoded += 'Content-Disposition: form-data name="' + key + '"\r\n\r\n'
  encoded += value + '\r\n'
  return encoded
}

Multipart.encode.fileParam = function(key, file) {
  var encoded = ''
  encoded += 'Content-Disposition: form-data name="' + key + '" filename="' + file.fileName + '"\r\n'
  encoded += 'Content-Type: application/octet-stream\r\n\r\n'
  encoded += file.getAsBinary() + '\r\n'
  return encoded
}
var Campfire = {
  UnreadMessageCounter: /^\((\d+)\) /,
  Responders: []
};

Campfire.Chat = Class.create({
  initialize: function(options) {
    Object.extend(this, options);

    if (this.debug)
      alert('Chatting in debug mode!');

    if (/MSIE/.test(navigator.userAgent)) {
      this.IE  = true;
      if (/MSIE 7/.test(navigator.userAgent))
        this.IE7 = true;
    }

    this.register.apply(this, Campfire.Responders);
    this.dispatch("chatCreated");
  },

  register: function() {
    this.events = {};
    this.listeners = $A(arguments).map(function(klass) {
      return this[klass.toLowerCase()] = new Campfire[klass](this);
    }.bind(this));
  },

  cacheEventsFor: function(event) {
    var callback = ('on-' + event).camelize();
    this.events[event] = this.listeners.inject([],
      function(callbacks, listener) {
        if (listener[callback]) {
          var __method = listener[callback].bind(listener);
          __method.listener = listener;
          callbacks.push(__method);
        }
        return callbacks;
      });
  },

  dispatch: function() {
    var args = $A(arguments), event = args.shift();

    if (!this.events[event])
      this.cacheEventsFor(event);

    try {
      this.events[event].each(function(callback) {
        callback.apply(callback.listener, args);
      });
    } catch (e) {
      if (this.debug)
        alert('Error in event ' + event + ': ' + e);
    }
  },

  redirectTo: function(url, disableAndDelay) {
    this.poller.stop();

    if (disableAndDelay) {
      this.disableAndDelayRedirectTo(window.location.href);
    } else {
      window.location.href = url;
    }
  },

  disableAndDelayRedirectTo: function(url) {
    $(document.body).addClassName("disabled");
    $("input", "term", "send").invoke("disable");

    var delay = parseInt(Math.random() * 11) * 5 + 5; // 5 to 60 seconds from now
    function showDelay() {
      var text = delay.toString() + " second" + (delay == 1 ? "" : "s");
      $("timeout_text").update("Campfire will be back in " + text);
    }

    var interval = window.setInterval(function() {
      if (delay) {
        showDelay();
        delay -= 1;
      } else {
        $("timeout_text").update("Campfire is restarting&hellip;");
        window.clearInterval(interval);
        window.location.href = url;
      }
    }, 1000);

    showDelay();
  },

  messageFrom: function(element) {
    return new Campfire.Message(this, element);
  },

  findMessage: function(element) {
    var message = $(element).up("tr.message");
    if (message) return this.messageFrom(message);
  }
});

function $dispatch() {
  var args = $A(arguments);
  if (window.chat && Object.isFunction(window.chat.dispatch)) {
    window.chat.dispatch.apply(window.chat, args);
  } else {
    (function() {
      $dispatch.apply(null, args);
    }).delay(0.1);
  }
}
/*
   SoundManager 2: Javascript Sound for the Web
   --------------------------------------------
   http://schillmania.com/projects/soundmanager2/

   Copyright (c) 2008, Scott Schiller. All rights reserved.
   Code licensed under the BSD License:
   http://schillmania.com/projects/soundmanager2/license.txt

   V2.94a.20090206
*/
var soundManager=null;function SoundManager(b,a){this.flashVersion=8;this.debugMode=true;this.useConsole=true;this.consoleOnly=false;this.waitForWindowLoad=false;this.nullURL="null.mp3";this.allowPolling=true;this.useMovieStar=false;this.bgColor="#ffffff";this.useHighPerformance=false;this.flashLoadTimeout=750;this.defaultOptions={autoLoad:false,stream:true,autoPlay:false,onid3:null,onload:null,whileloading:null,onplay:null,onpause:null,onresume:null,whileplaying:null,onstop:null,onfinish:null,onbeforefinish:null,onbeforefinishtime:5000,onbeforefinishcomplete:null,onjustbeforefinish:null,onjustbeforefinishtime:200,multiShot:true,position:null,pan:0,volume:100};this.flash9Options={onbufferchange:null,isMovieStar:null,usePeakData:false,useWaveformData:false,useEQData:false};this.movieStarOptions={onmetadata:null,useVideo:false};var f=null;var e=this;this.version=null;this.versionNumber="V2.94a.20090206";this.movieURL=null;this.url=null;this.altURL=null;this.swfLoaded=false;this.enabled=false;this.o=null;this.id=(a||"sm2movie");this.oMC=null;this.sounds={};this.soundIDs=[];this.muted=false;this.wmode=null;this.isIE=(navigator.userAgent.match(/MSIE/i));this.isSafari=(navigator.userAgent.match(/safari/i));this.isGecko=(navigator.userAgent.match(/gecko/i));this.debugID="soundmanager-debug";this._debugOpen=true;this._didAppend=false;this._appendSuccess=false;this._didInit=false;this._disabled=false;this._windowLoaded=false;this._hasConsole=(typeof console!="undefined"&&typeof console.log!="undefined");this._debugLevels=["log","info","warn","error"];this._defaultFlashVersion=8;this._oRemoved=null;this._oRemovedHTML=null;var g=function(h){return document.getElementById(h)};this.filePatterns={flash8:/\.mp3(\?.*)?$/i,flash9:/\.mp3(\?.*)?$/i};this.netStreamTypes=["aac","flv","mov","mp4","m4v","f4v","m4a","mp4v","3gp","3g2"];this.netStreamPattern=new RegExp("\\.("+this.netStreamTypes.join("|")+")(\\?.*)?$","i");this.filePattern=null;this.features={buffering:false,peakData:false,waveformData:false,eqData:false,movieStar:false};this.sandbox={type:null,types:{remote:"remote (domain-based) rules",localWithFile:"local with file access (no internet access)",localWithNetwork:"local with network (internet access only, no local access)",localTrusted:"local, trusted (local + internet access)"},description:null,noRemote:null,noLocal:null};this._setVersionInfo=function(){if(e.flashVersion!=8&&e.flashVersion!=9){alert('soundManager.flashVersion must be 8 or 9. "'+e.flashVersion+'" is invalid. Reverting to '+e._defaultFlashVersion+".");e.flashVersion=e._defaultFlashVersion}e.version=e.versionNumber+(e.flashVersion==9?" (AS3/Flash 9)":" (AS2/Flash 8)");if(e.flashVersion>8){e.defaultOptions=e._mergeObjects(e.defaultOptions,e.flash9Options);e.features.buffering=true}if(e.flashVersion>8&&e.useMovieStar){e.defaultOptions=e._mergeObjects(e.defaultOptions,e.movieStarOptions);e.filePatterns.flash9=new RegExp("\\.(mp3|"+e.netStreamTypes.join("|")+")(\\?.*)?$","i");e.features.movieStar=true}else{e.useMovieStar=false;e.features.movieStar=false}e.filePattern=e.filePatterns[(e.flashVersion!=8?"flash9":"flash8")];e.movieURL=(e.flashVersion==8?"soundmanager2.swf":"soundmanager2_flash9.swf");e.features.peakData=e.features.waveformData=e.features.eqData=(e.flashVersion==9)};this._overHTTP=(document.location?document.location.protocol.match(/http/i):null);this._waitingforEI=false;this._initPending=false;this._tryInitOnFocus=(this.isSafari&&typeof document.hasFocus=="undefined");this._isFocused=(typeof document.hasFocus!="undefined"?document.hasFocus():null);this._okToDisable=!this._tryInitOnFocus;this.useAltURL=!this._overHTTP;var d="http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html";this.supported=function(){return(e._didInit&&!e._disabled)};this.getMovie=function(h){return e.isIE?window[h]:(e.isSafari?g(h)||document[h]:g(h))};this.loadFromXML=function(h){try{e.o._loadFromXML(h)}catch(i){e._failSafely();return true}};this.createSound=function(i){if(!e._didInit){throw new Error("soundManager.createSound(): Not loaded yet - wait for soundManager.onload() before calling sound-related methods")}if(arguments.length==2){i={id:arguments[0],url:arguments[1]}}var j=e._mergeObjects(i);var h=j;if(e._idCheck(h.id,true)){return e.sounds[h.id]}if(e.flashVersion>8&&e.useMovieStar){if(h.isMovieStar===null){h.isMovieStar=(h.url.match(e.netStreamPattern)?true:false)}if(h.isMovieStar&&(h.usePeakData||h.useWaveformData||h.useEQData)){h.usePeakData=false;h.useWaveformData=false;h.useEQData=false}}e.sounds[h.id]=new f(h);e.soundIDs[e.soundIDs.length]=h.id;if(e.flashVersion==8){e.o._createSound(h.id,h.onjustbeforefinishtime)}else{e.o._createSound(h.id,h.url,h.onjustbeforefinishtime,h.usePeakData,h.useWaveformData,h.useEQData,h.isMovieStar,(h.isMovieStar?h.useVideo:false))}if(h.autoLoad||h.autoPlay){if(e.sounds[h.id]){e.sounds[h.id].load(h)}}if(h.autoPlay){e.sounds[h.id].play()}return e.sounds[h.id]};this.createVideo=function(h){if(arguments.length==2){h={id:arguments[0],url:arguments[1]}}if(e.flashVersion>=9){h.isMovieStar=true;h.useVideo=true}else{return false}return e.createSound(h)};this.destroySound=function(j,h){if(!e._idCheck(j)){return false}for(var k=0;k<e.soundIDs.length;k++){if(e.soundIDs[k]==j){e.soundIDs.splice(k,1);continue}}e.sounds[j].unload();if(!h){e.sounds[j].destruct()}delete e.sounds[j]};this.destroyVideo=this.destroySound;this.load=function(h,i){if(!e._idCheck(h)){return false}e.sounds[h].load(i)};this.unload=function(h){if(!e._idCheck(h)){return false}e.sounds[h].unload()};this.play=function(h,i){if(!e._idCheck(h)){if(typeof i!="Object"){i={url:i}}if(i&&i.url){i.id=h;e.createSound(i)}else{return false}}e.sounds[h].play(i)};this.start=this.play;this.setPosition=function(h,i){if(!e._idCheck(h)){return false}e.sounds[h].setPosition(i)};this.stop=function(h){if(!e._idCheck(h)){return false}e.sounds[h].stop()};this.stopAll=function(){for(var h in e.sounds){if(e.sounds[h] instanceof f){e.sounds[h].stop()}}};this.pause=function(h){if(!e._idCheck(h)){return false}e.sounds[h].pause()};this.pauseAll=function(){for(var h=e.soundIDs.length;h--;){e.sounds[e.soundIDs[h]].pause()}};this.resume=function(h){if(!e._idCheck(h)){return false}e.sounds[h].resume()};this.resumeAll=function(){for(var h=e.soundIDs.length;h--;){e.sounds[e.soundIDs[h]].resume()}};this.togglePause=function(h){if(!e._idCheck(h)){return false}e.sounds[h].togglePause()};this.setPan=function(h,i){if(!e._idCheck(h)){return false}e.sounds[h].setPan(i)};this.setVolume=function(i,h){if(!e._idCheck(i)){return false}e.sounds[i].setVolume(h)};this.mute=function(h){if(typeof h!="string"){h=null}if(!h){for(var j=e.soundIDs.length;j--;){e.sounds[e.soundIDs[j]].mute()}e.muted=true}else{if(!e._idCheck(h)){return false}e.sounds[h].mute()}};this.muteAll=function(){e.mute()};this.unmute=function(h){if(typeof h!="string"){h=null}if(!h){for(var j=e.soundIDs.length;j--;){e.sounds[e.soundIDs[j]].unmute()}e.muted=false}else{if(!e._idCheck(h)){return false}e.sounds[h].unmute()}};this.unmuteAll=function(){e.unmute()};this.getMemoryUse=function(){if(e.flashVersion==8){return 0}if(e.o){return parseInt(e.o._getMemoryUse(),10)}};this.setPolling=function(h){if(!e.o||!e.allowPolling){return false}e.o._setPolling(h)};this.disable=function(j){if(typeof j=="undefined"){j=false}if(e._disabled){return false}e._disabled=true;for(var h=e.soundIDs.length;h--;){e._disableObject(e.sounds[e.soundIDs[h]])}e.initComplete(j)};this.canPlayURL=function(h){return(h?(h.match(e.filePattern)?true:false):null)};this.getSoundById=function(i,j){if(!i){throw new Error("SoundManager.getSoundById(): sID is null/undefined")}var h=e.sounds[i];return h};this.onload=function(){soundManager._wD("<em>Warning</em>: soundManager.onload() is undefined.",2)};this.onerror=function(){};this._idCheck=this.getSoundById;var c=function(){return false};c._protected=true;this._disableObject=function(i){for(var h in i){if(typeof i[h]=="function"&&typeof i[h]._protected=="undefined"){i[h]=c}}h=null};this._failSafely=function(h){if(typeof h=="undefined"){h=false}if(!e._disabled||h){e.disable(h)}};this._normalizeMovieURL=function(h){var i=null;if(h){if(h.match(/\.swf(\?.*)?$/i)){i=h.substr(h.toLowerCase().lastIndexOf(".swf?")+4);if(i){return h}}else{if(h.lastIndexOf("/")!=h.length-1){h=h+"/"}}}return(h&&h.lastIndexOf("/")!=-1?h.substr(0,h.lastIndexOf("/")+1):"./")+e.movieURL};this._getDocument=function(){return(document.body?document.body:(document.documentElement?document.documentElement:document.getElementsByTagName("div")[0]))};this._getDocument._protected=true;this._createMovie=function(n,l){if(e._didAppend&&e._appendSuccess){return false}if(window.location.href.indexOf("debug=1")+1){e.debugMode=true}e._didAppend=true;e._setVersionInfo();var u=(l?l:e.url);var k=(e.altURL?e.altURL:u);e.url=e._normalizeMovieURL(e._overHTTP?u:k);l=e.url;var m=null;if(e.useHighPerformance&&e.useMovieStar){m="Note: disabling highPerformance, not applicable with movieStar mode on";e.useHighPerformance=false}e.wmode=(e.useHighPerformance&&!e.useMovieStar?"transparent":"");var t={name:n,id:n,src:l,width:"100%",height:"100%",quality:"high",allowScriptAccess:"always",bgcolor:e.bgColor,pluginspage:"http://www.macromedia.com/go/getflashplayer",type:"application/x-shockwave-flash",wmode:e.wmode};var w={id:n,data:l,type:"application/x-shockwave-flash",width:"100%",height:"100%",wmode:e.wmode};var o={movie:l,AllowScriptAccess:"always",quality:"high",bgcolor:e.bgColor,wmode:e.wmode};var j=null;var r=null;if(e.isIE){j=document.createElement("div");var h='<object id="'+n+'" data="'+l+'" type="application/x-shockwave-flash" width="100%" height="100%"><param name="movie" value="'+l+'" /><param name="AllowScriptAccess" value="always" /><param name="quality" value="high" />'+(e.useHighPerformance&&!e.useMovieStar?'<param name="wmode" value="'+e.wmode+'" /> ':"")+'<param name="bgcolor" value="'+e.bgColor+'" /><!-- --></object>'}else{j=document.createElement("embed");for(r in t){if(t.hasOwnProperty(r)){j.setAttribute(r,t[r])}}}var q="soundManager._createMovie(): appendChild/innerHTML set failed. May be app/xhtml+xml DOM-related.";var i=e._getDocument();if(i){e.oMC=g("sm2-container")?g("sm2-container"):document.createElement("div");if(!e.oMC.id){e.oMC.id="sm2-container";e.oMC.className="movieContainer";var z=null;var p=null;if(e.useHighPerformance){z={position:"fixed",width:"8px",height:"8px",bottom:"0px",left:"0px"}}else{z={position:"absolute",width:"1px",height:"1px",top:"-999px",left:"-999px"}}var y=null;for(y in z){if(z.hasOwnProperty(y)){e.oMC.style[y]=z[y]}}try{if(!e.isIE){e.oMC.appendChild(j)}i.appendChild(e.oMC);if(e.isIE){p=e.oMC.appendChild(document.createElement("div"));p.className="sm2-object-box";p.innerHTML=h}e._appendSuccess=true}catch(v){throw new Error(q)}}else{e.oMC.appendChild(j);if(e.isIE){p=e.oMC.appendChild(document.createElement("div"));p.className="sm2-object-box";p.innerHTML=h}e._appendSuccess=true}}};this._writeDebug=function(h,j,i){};this._writeDebug._protected=true;this._wdCount=0;this._wdCount._protected=true;this._wD=this._writeDebug;this._toggleDebug=function(){};this._toggleDebug._protected=true;this._debug=function(){};this._debugTS=function(j,h,i){};this._debugTS._protected=true;this._mergeObjects=function(j,h){var m={};for(var k in j){if(j.hasOwnProperty(k)){m[k]=j[k]}}var l=(typeof h=="undefined"?e.defaultOptions:h);for(var n in l){if(l.hasOwnProperty(n)&&typeof m[n]=="undefined"){m[n]=l[n]}}return m};this.createMovie=function(h){if(h){e.url=h}e._initMovie()};this.go=this.createMovie;this._initMovie=function(){if(e.o){return false}e.o=e.getMovie(e.id);if(!e.o){if(!e.oRemoved){e._createMovie(e.id,e.url)}else{if(!e.isIE){e.oMC.appendChild(e.oRemoved)}else{e.oMC.innerHTML=e.oRemovedHTML}e.oRemoved=null;e._didAppend=true}e.o=e.getMovie(e.id)}};this.waitForExternalInterface=function(){if(e._waitingForEI){return false}e._waitingForEI=true;if(e._tryInitOnFocus&&!e._isFocused){return false}if(e.flashLoadTimeout>0){setTimeout(function(){if(!e._didInit&&e._okToDisable){e._failSafely(true)}},e.flashLoadTimeout)}};this.handleFocus=function(){if(e._isFocused||!e._tryInitOnFocus){return true}e._okToDisable=true;e._isFocused=true;if(e._tryInitOnFocus){window.removeEventListener("mousemove",e.handleFocus,false)}e._waitingForEI=false;setTimeout(e.waitForExternalInterface,500);if(window.removeEventListener){window.removeEventListener("focus",e.handleFocus,false)}else{if(window.detachEvent){window.detachEvent("onfocus",e.handleFocus)}}};this.initComplete=function(h){if(e._didInit){return false}e._didInit=true;if(e._disabled||h){e.onerror.apply(window);return false}else{}if(e.waitForWindowLoad&&!e._windowLoaded){if(window.addEventListener){window.addEventListener("load",e.initUserOnload,false)}else{if(window.attachEvent){window.attachEvent("onload",e.initUserOnload)}}return false}else{e.initUserOnload()}};this.initUserOnload=function(){e.onload.apply(window)};this.init=function(){e._initMovie();if(e._didInit){return false}if(window.removeEventListener){window.removeEventListener("load",e.beginDelayedInit,false)}else{if(window.detachEvent){window.detachEvent("onload",e.beginDelayedInit)}}try{e.o._externalInterfaceTest(false);e.setPolling(true);if(!e.debugMode){e.o._disableDebug()}e.enabled=true}catch(h){e._failSafely(true);e.initComplete();return false}e.initComplete()};this.beginDelayedInit=function(){e._windowLoaded=true;setTimeout(e.waitForExternalInterface,500);setTimeout(e.beginInit,20)};this.beginInit=function(){if(e._initPending){return false}e.createMovie();e._initMovie();e._initPending=true;return true};this.domContentLoaded=function(){if(document.removeEventListener){document.removeEventListener("DOMContentLoaded",e.domContentLoaded,false)}e.go()};this._externalInterfaceOK=function(){if(e.swfLoaded){return false}e.swfLoaded=true;e._tryInitOnFocus=false;if(e.isIE){setTimeout(e.init,100)}else{e.init()}};this._setSandboxType=function(h){var i=e.sandbox;i.type=h;i.description=i.types[(typeof i.types[h]!="undefined"?h:"unknown")];if(i.type=="localWithFile"){i.noRemote=true;i.noLocal=false}else{if(i.type=="localWithNetwork"){i.noRemote=false;i.noLocal=true}else{if(i.type=="localTrusted"){i.noRemote=false;i.noLocal=false}}}};this.reboot=function(){if(e.soundIDs.length){}for(var h=e.soundIDs.length;h--;){e.sounds[e.soundIDs[h]].destruct()}try{if(e.isIE){e.oRemovedHTML=e.o.innerHTML}e.oRemoved=e.o.parentNode.removeChild(e.o)}catch(j){}e.enabled=false;e._didInit=false;e._waitingForEI=false;e._initPending=false;e._didInit=false;e._didAppend=false;e._appendSuccess=false;e._didInit=false;e._disabled=false;e._waitingforEI=true;e.swfLoaded=false;e.soundIDs={};e.sounds=[];e.o=null;window.setTimeout(function(){soundManager.beginDelayedInit()},20)};this.destruct=function(){e.disable(true)};f=function(h){var i=this;this.sID=h.id;this.url=h.url;this.options=e._mergeObjects(h);this.instanceOptions=this.options;this._iO=this.instanceOptions;this.pan=this.options.pan;this.volume=this.options.volume;this._debug=function(){if(e.debugMode){var l=null;var n=[];var k=null;var m=null;var j=64;for(l in i.options){if(i.options[l]!==null){if(i.options[l] instanceof Function){k=i.options[l].toString();k=k.replace(/\s\s+/g," ");m=k.indexOf("{");n[n.length]=" "+l+": {"+k.substr(m+1,(Math.min(Math.max(k.indexOf("\n")-1,j),j))).replace(/\n/g,"")+"... }"}else{n[n.length]=" "+l+": "+i.options[l]}}}}};this._debug();this.id3={};this.resetProperties=function(j){i.bytesLoaded=null;i.bytesTotal=null;i.position=null;i.duration=null;i.durationEstimate=null;i.loaded=false;i.playState=0;i.paused=false;i.readyState=0;i.muted=false;i.didBeforeFinish=false;i.didJustBeforeFinish=false;i.isBuffering=false;i.instanceOptions={};i.instanceCount=0;i.peakData={left:0,right:0};i.waveformData=[];i.eqData=[]};i.resetProperties();this.load=function(j){if(typeof j!="undefined"){i._iO=e._mergeObjects(j);i.instanceOptions=i._iO}else{j=i.options;i._iO=j;i.instanceOptions=i._iO}if(typeof i._iO.url=="undefined"){i._iO.url=i.url}if(i._iO.url==i.url&&i.readyState!==0&&i.readyState!=2){return false}i.loaded=false;i.readyState=1;i.playState=0;try{if(e.flashVersion==8){e.o._load(i.sID,i._iO.url,i._iO.stream,i._iO.autoPlay,(i._iO.whileloading?1:0))}else{e.o._load(i.sID,i._iO.url,i._iO.stream?true:false,i._iO.autoPlay?true:false);if(i._iO.isMovieStar&&i._iO.autoLoad&&!i._iO.autoPlay){i.pause()}}}catch(k){e.onerror();e.disable()}};this.unload=function(){if(i.readyState!==0){if(i.readyState!=2){i.setPosition(0,true)}e.o._unload(i.sID,e.nullURL);i.resetProperties()}};this.destruct=function(){e.o._destroySound(i.sID);e.destroySound(i.sID,true)};this.play=function(k){if(!k){k={}}i._iO=e._mergeObjects(k,i._iO);i._iO=e._mergeObjects(i._iO,i.options);i.instanceOptions=i._iO;if(i.playState==1){var j=i._iO.multiShot;if(!j){return false}}if(!i.loaded){if(i.readyState===0){i._iO.stream=true;i._iO.autoPlay=true;i.load(i._iO)}else{if(i.readyState==2){return false}}}if(i.paused){i.resume()}else{i.playState=1;if(!i.instanceCount||e.flashVersion==9){i.instanceCount++}i.position=(typeof i._iO.position!="undefined"&&!isNaN(i._iO.position)?i._iO.position:0);if(i._iO.onplay){i._iO.onplay.apply(i)}i.setVolume(i._iO.volume,true);i.setPan(i._iO.pan,true);e.o._start(i.sID,i._iO.loop||1,(e.flashVersion==9?i.position:i.position/1000))}};this.start=this.play;this.stop=function(j){if(i.playState==1){i.playState=0;i.paused=false;if(i._iO.onstop){i._iO.onstop.apply(i)}e.o._stop(i.sID,j);i.instanceCount=0;i._iO={}}};this.setPosition=function(k,j){if(typeof k=="undefined"){k=0}var l=Math.min(i.duration,Math.max(k,0));i._iO.position=l;e.o._setPosition(i.sID,(e.flashVersion==9?i._iO.position:i._iO.position/1000),(i.paused||!i.playState))};this.pause=function(){if(i.paused||i.playState===0){return false}i.paused=true;e.o._pause(i.sID);if(i._iO.onpause){i._iO.onpause.apply(i)}};this.resume=function(){if(!i.paused||i.playState===0){return false}i.paused=false;e.o._pause(i.sID);if(i._iO.onresume){i._iO.onresume.apply(i)}};this.togglePause=function(){if(!i.playState){i.play({position:(e.flashVersion==9?i.position:i.position/1000)});return false}if(i.paused){i.resume()}else{i.pause()}};this.setPan=function(k,j){if(typeof k=="undefined"){k=0}if(typeof j=="undefined"){j=false}e.o._setPan(i.sID,k);i._iO.pan=k;if(!j){i.pan=k}};this.setVolume=function(j,k){if(typeof j=="undefined"){j=100}if(typeof k=="undefined"){k=false}e.o._setVolume(i.sID,(e.muted&&!i.muted)||i.muted?0:j);i._iO.volume=j;if(!k){i.volume=j}};this.mute=function(){i.muted=true;e.o._setVolume(i.sID,0)};this.unmute=function(){i.muted=false;var j=typeof i._iO.volume!="undefined";e.o._setVolume(i.sID,j?i._iO.volume:i.options.volume)};this._whileloading=function(j,k,l){if(!i._iO.isMovieStar){i.bytesLoaded=j;i.bytesTotal=k;i.duration=Math.floor(l);i.durationEstimate=parseInt((i.bytesTotal/i.bytesLoaded)*i.duration,10);if(i.readyState!=3&&i._iO.whileloading){i._iO.whileloading.apply(i)}}else{i.bytesLoaded=j;i.bytesTotal=k;i.duration=Math.floor(l);i.durationEstimate=i.duration;if(i.readyState!=3&&i._iO.whileloading){i._iO.whileloading.apply(i)}}};this._onid3=function(n,k){var o=[];for(var m=0,l=n.length;m<l;m++){o[n[m]]=k[m]}i.id3=e._mergeObjects(i.id3,o);if(i._iO.onid3){i._iO.onid3.apply(i)}};this._whileplaying=function(k,l,j,m){if(isNaN(k)||k===null){return false}i.position=k;if(i._iO.usePeakData&&typeof l!="undefined"&&l){i.peakData={left:l.leftPeak,right:l.rightPeak}}if(i._iO.useWaveformData&&typeof j!="undefined"&&j){i.waveformData=j}if(i._iO.useEQData&&typeof m!="undefined"&&m){i.eqData=m}if(i.playState==1){if(i._iO.whileplaying){i._iO.whileplaying.apply(i)}if(i.loaded&&i._iO.onbeforefinish&&i._iO.onbeforefinishtime&&!i.didBeforeFinish&&i.duration-i.position<=i._iO.onbeforefinishtime){i._onbeforefinish()}}};this._onload=function(j){j=(j==1?true:false);i.loaded=j;i.readyState=j?3:2;if(i._iO.onload){i._iO.onload.apply(i)}};this._onbeforefinish=function(){if(!i.didBeforeFinish){i.didBeforeFinish=true;if(i._iO.onbeforefinish){i._iO.onbeforefinish.apply(i)}}};this._onjustbeforefinish=function(j){if(!i.didJustBeforeFinish){i.didJustBeforeFinish=true;if(i._iO.onjustbeforefinish){i._iO.onjustbeforefinish.apply(i)}}};this._onfinish=function(){if(i._iO.onbeforefinishcomplete){i._iO.onbeforefinishcomplete.apply(i)}i.didBeforeFinish=false;i.didJustBeforeFinish=false;if(i.instanceCount){i.instanceCount--;if(!i.instanceCount){i.playState=0;i.paused=false;i.instanceCount=0;i.instanceOptions={};if(i._iO.onfinish){i._iO.onfinish.apply(i)}}}else{}};this._onmetadata=function(j){if(!j.width&&!j.height){j.width=320;j.height=240}i.metadata=j;i.width=j.width;i.height=j.height;if(i._iO.onmetadata){i._iO.onmetadata.apply(i)}};this._onbufferchange=function(j){if(j==i.isBuffering){return false}i.isBuffering=(j==1?true:false);if(i._iO.onbufferchange){i._iO.onbufferchange.apply(i)}}};if(window.addEventListener){window.addEventListener("focus",e.handleFocus,false);window.addEventListener("load",e.beginDelayedInit,false);window.addEventListener("unload",e.destruct,false);if(e._tryInitOnFocus){window.addEventListener("mousemove",e.handleFocus,false)}}else{if(window.attachEvent){window.attachEvent("onfocus",e.handleFocus);window.attachEvent("onload",e.beginDelayedInit);window.attachEvent("unload",e.destruct)}else{soundManager.onerror();soundManager.disable()}}if(document.addEventListener){document.addEventListener("DOMContentLoaded",e.domContentLoaded,false)}}soundManager=new SoundManager();

soundManager.url = "/movies/";

function toggleSubmit(submit_element) {
  $(submit_element).disabled = !this.checked;
}

function updateChartWithSelectedLevel(level, price) {
  $('selected_plan_price').innerHTML = price;
  $$('table.pricing tr.shaded').first().className = '';
  $(level).className = 'shaded';
}

function changeTheme(theme) {
  var pattern = new RegExp('/' + theme + '\\.css');
  $$('link').each(function(link) {
    if (link.href.match(pattern)) {
      link.disabled = false;
    } else if (link.title == 'Theme' &&
        (link.rel == 'Stylesheet' || !link.disabled)) {
      link.disabled = true;
    }
  });
}

function uploadLogo() {
  if (!$('upload').value) return false;
  Element.show('upload_form_progress');
  Element.hide('upload_form_contents');
  $('upload_form_tag').target = 'upload_target';
  $('upload_form_tag').submit();
  return false;
}

function toggleStar(star_element) {
  if ($(star_element).up('.star').hasClassName('starred')) {
    $(star_element).up('.star').removeClassName('starred');
  } else {
    $(star_element).up('.star').addClassName('starred')
  }
}
Ajax.Popup = Class.create(Ajax.Updater, {
  initialize: function(url, options) {
    this.popup = this.createWindow(options || {});
    this.temporaryElement = Element.extend(document.createElement("div"));
    Ajax.Updater.prototype.initialize.call(this, this.temporaryElement, url, options);

    var onComplete = this.options.onComplete;
    this.options.onComplete = function() {
      if (this.popup.closed) return;
      onComplete.apply(this, arguments);
      this.popup.document.title = this.options.title || '';
      this.popup.document.body.appendChild(this.temporaryElement);
    }.bind(this);
  },

  createWindow: function(options) {
    var defaults = $H({width: 480, height: 320, scrollbars: 'yes', status: 'no',
      toolbar: 'no', location: 'no', menubar: 'no', directories: 'no', resizable: 'yes'});
    var parameters = defaults.merge(options.window || {}).invoke('join', '=').join(',');

    var popup = window.open('', options.name || 'popup', parameters);
    popup.document.write('<html><body id="popup_body"></body></html>');
    popup.document.close();

    return popup;
  }
});
var Autolink = {
  Patterns: {
    url:   /((href=(?:'|")?)?(https?:\/\/|\bwww\.)(\S+)(\/(?:\S+))?)//*'*/,
    email: /([\w\.!#\$%\-+.]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)+)/
  },

  Linkers: {
    url: function(string, tagOptions, replacement) {
      return Autolink.replaceURLs(string, function(url, extra) {
        var text = (replacement || Prototype.K)(url);
        return '<a href="' + url + '"' +
          Autolink.htmlForTagOptions(tagOptions) + '>' +
          text + '</a>' + extra;
      });
    },

    email: function(string, tagOptions, replacement) {
      replacement = replacement || Prototype.K;
      return string.gsub(Autolink.Patterns.email, function(match) {
        return '<a href="mailto:' + match[1] + '"' +
          Autolink.htmlForTagOptions(tagOptions) + '>' +
          replacement(match[1]) + '</a>';
      });
    }
  },

  all: function(string, tagOptions, replacement) {
    for (var name in Autolink.Linkers)
      string = Autolink.Linkers[name](string, tagOptions, replacement);
    return string;
  },

  htmlForTagOptions: function(tagOptions) {
    return $H(tagOptions || {}).map(function(pair) {
      return pair.key + '="' + pair.value + '"';
    }).join(' ');
  },

  replaceURLs: function(string, replacement) {
    var extra = {};
    function trim(string) {
      if (!string) return;
      var pattern = /([^-0-9A-Za-z\/]+)$/, match;
      if (match = string.match(pattern))
        string = string.replace(match, '');
      extra.value = (match || [])[1];
      return string;
    }

    return string.gsub(Autolink.Patterns.url, function(match) {
      var all = match[1], existingLink = match[2], scheme = match[3],
        domain = match[4], path = match[5];
      if (existingLink) return all;
      if (scheme == 'www.') all = 'http://' + all;
      all = trim(all), path = trim(path);
      return replacement(all, extra.value || '');
    });
  },

  transform: function(message) {
    return this.all(message.escapeHTML(), {target: '_blank'},
      function(text) { return text.truncate(50, '&hellip;') }
    )
  }
};

Object.extend(Autolink, Autolink.Linkers);

var ImageAutolink = {
  image_url_match: function(text) {
    return text.strip().match(/^(http\S+(?:jpe?g|gif|png))(\?.*)?$/i)
  },

  inline_image: function(url) {
    return '<a href="'  + url + '" class="image loading" target="_blank">' +
           '<img src="' + url + '" onload="$dispatch(&quot;inlineImageLoaded&quot;, this)" onerror="$dispatch(&quot;inlineImageLoadFailed&quot;, this)" /></a>';
  },

  link: function(text, replacement) {
    var match = this.image_url_match(text);
    if (!match) return false;
    return replacement(match[1]);
  },

  transform: function(message) {
    return this.link(message, function(url) { return this.inline_image(url) }.bind(this))
  }
};

var YoutubeVideoAutolink = {
  inlineYoutubeVideo: function(url, id) {
    return ('<a href="#{url}" class="image youtube_video" target="_blank">' +
      '<img src="http://img.youtube.com/vi/#{id}/0.jpg" /></a>').interpolate({ url: url, id: id });
  },

  link: function(text, replacement) {
    var url = text.strip();
    var match = url.match(/^(?:http\S+[Yy][Oo][Uu][Tt][Uu][Bb][Ee]\.[Cc][Oo][Mm]\/watch\?v=)([\w-]+)(?:\S*)$/);
    if (!match) return false;
    return replacement(url, match[1]);
  },

  transform: function(message) {
    return this.link(message, this.inlineYoutubeVideo.bind(this));
  }
};
Campfire.Addresser = Class.create({
  initialize: function(chat) {
    this.chat = chat;
    this.element = $('tooltip');
  },

  onMessagesInserted: function() {
    this._participants = null;
  },

  onPreparationForKeyPress: function(event) {
    if (this.addressee && event.keyCode == Event.KEY_RETURN)
      this.complete(Event.element(event));
  },

  onKeyPressed: function(event) {
    var address;
    if (address = this.extractAddress(Event.element(event)))
      if (this.addressee = this.findAddressee(address))
        return this.showTooltip();

    this.cancelTooltip();
  },

  extractAddress: function(element) {
    return $F(element).match(Campfire.Addresser.Pattern);
  },

  findAddressee: function(address) {
    var abbreviation = address[1], punctuation = address[2];
    if (!/\S/.test(punctuation)) punctuation = ": ";

    var initials    = new RegExp("^" + abbreviation.split("").join(".*\\W"), "i");
    var succession  = new RegExp(abbreviation.split("").join(".*"), "i");
    var participant = this.findParticipantBy(initials) ||
                      this.findParticipantBy(succession);

    if (participant)
      return { participant: participant, punctuation: punctuation };
  },

  findParticipantBy: function(pattern) {
    var match;
    if (match = this.participants().grep(pattern))
      if (match.length == 1)
        return match[0].replace(/ \(guest\)$/, "");
  },

  complete: function(element) {
    element.value = element.value.replace(
      Campfire.Addresser.Pattern,
      this.addressee.participant + this.addressee.punctuation
    );
    this.cancelTooltip();
  },

  showTooltip: function(match) {
    if (!this.element.visible())
      this.element.visualEffect("appear", { duration: 0.15 });
    this.element.update(this.addressee.participant + this.addressee.punctuation);
  },

  cancelTooltip: function() {
    if (this.element.visible())
      this.element.visualEffect("fade", { duration: 0.15 });
    this.addressee = null;
  },

  participants: function() {
    var elements = $(this.chat.participantList).select("span.name");
    return this._participants = this._participants ||
      elements.pluck("innerHTML").invoke("unescapeHTML");
  }
});

Campfire.Addresser.Pattern = /^(?:\/\/|@)([^\s.:;,-]+)([\s.:;,-]+|$)/;

Campfire.Responders.push("Addresser");
Campfire.FailedMessageHandler = Class.create({
  initialize: function(chat) {
    this.chat = chat;
  },

  onMessageSendSucceeded: function(outgoingMessage) {
    this.removeNoticeFrom(outgoingMessage);
  },

  onMessageSendFailed: function(outgoingMessage) {
    this.removeNoticeFrom(outgoingMessage);
    this.addNoticeTo(outgoingMessage);
  },

  addNoticeTo: function(outgoingMessage, kind) {
    var message = outgoingMessage.message;
    message.setNotice(Campfire.FailedMessageHandler.Notices[kind || message.kind || "text"]);
    message.getNoticeElement().observe("click", this.onNoticeClicked.bind(this, outgoingMessage));
  },

  removeNoticeFrom: function(outgoingMessage) {
    outgoingMessage.message.removeNotice();
  },

  onNoticeClicked: function(outgoingMessage, event) {
    var link = event.findElement("a.retry"), element = event.findElement("div.failed");
    if (link) {
      this.showBusyNoticeFor(outgoingMessage);
      outgoingMessage.send();
      this.chat.windowmanager.focus();
      event.stop();
    }
  },

  showBusyNoticeFor: function(outgoingMessage) {
    this.removeNoticeFrom(outgoingMessage);
    this.addNoticeTo(outgoingMessage, "busy");
  }
});

Campfire.FailedMessageHandler.Notices = {
  text: '<div class="failed">Sorry, this message wasn\'t sent. You may have lost your internet connection. <a href="#" class="retry">Try again</a>.</div>',
  paste: '<div class="failed">Sorry, your paste wasn\'t sent. You may have lost your internet connection. <a href="#" class="retry">Try again</a>.</div>',
  busy: '<div class="failed busy">Trying to send your message again…</div>'
};

Campfire.Responders.push("FailedMessageHandler");
Campfire.InlineImageHandler = Class.create({
  initialize: function(chat) {
    this.chat = chat;
  },

  onInlineImageLoaded: function(element) {
    this.resizingMessageFor(element, function(message) {
      element.up("a").removeClassName("loading").addClassName("loaded");
    });
  },

  onInlineImageLoadFailed: function(element) {
    this.resizingMessageFor(element, function(message) {
      element.up("a").removeClassName("loading").addClassName("failed");
    });
  },

  resizingMessageFor: function(element, callback) {
    element = $(element);
    var messageElement = element.up("tr.message");
    if (messageElement) {
      var message = this.chat.messageFrom(messageElement);
      message.resize(callback.bind(this, message));
    }
  }
});

Campfire.Responders.push("InlineImageHandler");
Campfire.LayoutManager = Class.create({
  initialize: function(chat) {
    this.chat = chat;
    Event.observe(window, "resize", this.onResize.bind(this));
  },

  onChatCreated: function() {
    this.layout();
  },

  layout: function() {
    this.adjustChatMessageColumnWidth();
    this.adjustChatControls();
  },

  onResize: function(event) {
    this.layout();
  },

  onMessagesInserted: function(messages) {
    this.adjustChatMessageColumnWidth();
  },

  adjustChatMessageColumnWidth: function() {
    if (this.chat.IE && !this.chat.IE7) return false;
    var viewportWidth = this.getChatViewportWidth();
    var authorColumnWidth = this.getChatAuthorColumnWidth();
    var messageColumnWidth = viewportWidth - authorColumnWidth - 10;

    var stylesheet = $A(document.styleSheets).last();
    var rules = stylesheet.cssRules || stylesheet.rules;
    var style = rules[rules.length - 1].style;
    if (style) style.width = messageColumnWidth - 26 + 'px';
  },

  adjustChatControls: function() {
    if ((this.chat.IE && !this.chat.IE7) || !this.chat.speaker) return false;
    var controlsWidth = Element.getDimensions(this.chat.speaker.controls).width;
    this.chat.speaker.input.style.width =
      this.getChatViewportWidth() - controlsWidth - 10 + 'px';
  },

  getChatViewportWidth: function() {
    var element = this.chat.transcript.element.parentNode.parentNode;
    return Element.getDimensions(element).width;
  },

  getChatAuthorColumnWidth: function() {
    var element = this.chat.transcript.element.getElementsByTagName('td')[1];
    if (!element) return 0;
    return Position.cumulativeOffset(element)[0] -
      Position.cumulativeOffset(this.chat.transcript.element)[0];
  }
});

Campfire.Responders.push("LayoutManager");

Campfire.Message = Class.create({
  initialize: function(chat, element) {
    this.chat = chat;
    this.element = element;

    var children    = element.getElementsByTagName('td');
    this.authorCell = children[0];
    this.bodyCell   = children[1];

    this.kind = (element.className.match(/\s*(\w+)_message\s*/) || [])[1];
  },

  id: function() {
    return parseInt(this.element.id.match(/\d+/)) || 0;
  },

  pending: function() {
    return Element.hasClassName(this.element, 'pending');
  },

  innerElement: function(name) {
    var property = "_" + name;
    if (this[property]) return this[property];

    var node = $(this[name + 'Cell']);
    if (this.actsLikeTextMessage() || this.kind == 'timestamp')
      return this[property] = node.down('.' + name);
    return this[property] = node;
  },

  authorElement: function() {
    return this.innerElement('author');
  },

  bodyElement: function() {
    return this.innerElement('body');
  },

  author: function() {
    return this.authorElement().innerHTML;
  },

  actsLikeTextMessage: function() {
    return ['text', 'upload', 'paste', 'sound', 'tweet'].include(this.kind);
  },

  hideDateForTimestamp: function(lastTimestamp) {
    return !(!lastTimestamp || this.author() != lastTimestamp.author());
  },

  hideAuthorForMessage: function(lastMessage) {
    if (!lastMessage) return;
    if (lastMessage.kind == 'timestamp')
      return this.hideDateForTimestamp(lastMessage);
    return !(this.author() != lastMessage.author() ||
      !this.actsLikeTextMessage() || !lastMessage.actsLikeTextMessage());
  },

  setKind: function(kind) {
    Element.removeClassName(this.element, this.kind + '_message');
    this.kind = kind;
    Element.addClassName(this.element, this.kind + '_message');
  },

  setAuthorVisibilityInRelationTo: function(message) {
    Element[this.hideAuthorForMessage(message) ? 'hide' : 'show'](this.authorElement());
  },

  updateBody: function(body) {
    this.resize(function() {
      $(this.bodyElement()).update(body);
    });
  },

  setNotice: function(notice) {
    this.resize(function() {
      this.getNoticeElement(true).update(notice);
      this.element.addClassName("with_notice");
    });
  },

  removeNotice: function() {
    this.resize(function() {
      var noticeElement = this.getNoticeElement();
      if (noticeElement) {
        noticeElement.remove();
        this.element.removeClassName("with_notice");
      }
    });
  },

  getSound: function() {
    var element = $(this.bodyCell);
    if (!element.hasAttribute("data-sound")) return "";
    return element.readAttribute("data-sound");
  },

  getNoticeElement: function(createIfMissing) {
    var bodyElement = $(this.bodyElement());
    var noticeElement = bodyElement.next("div.notice");

    if (!noticeElement && createIfMissing) {
      noticeElement = new Element("div").addClassName("notice");
      bodyElement.insert({ after: noticeElement });
    }

    return noticeElement;
  },

  inspect: function() {
    return $H(this).merge({id: this.id(), pending: this.pending()}).inspect();
  },

  resize: function(callback) {
    this.chat.windowmanager.adjustScrollOffsetRelativeToElementHeightChange(this.element, callback.bind(this));
  }
});
Campfire.OutgoingMessage = Class.create({
  initialize: function(chat, message, body, kind) {
    this.chat = chat;
    this.message = message;
    this.element = message.element;
    this.parameters = $H({ message: body, kind: kind, t: $T() });
  },

  send: function() {
    if (this.request) return;

    if (this.count) {
      this.count++;
    } else {
      this.count = 1;
    }

    var parameters = this.parameters.merge({ now: $T(), attempt: this.count });

    this.request = new Ajax.Request(this.chat.speakURL, {
      timeout:     false,
      parameters:  parameters.toQueryString(),
      onSuccess:   this.onSuccess.bind(this),
      onFailure:   this.onFailure.bind(this),
      onException: this.onFailure.bind(this)
    });

    this.timeout = this.onTimeout.bind(this).delay(Campfire.OutgoingMessage.TIMEOUT);
  },

  onSuccess: function(transport) {
    if (!transport.status) return this.onFailure();
    this.finish();
    this.chat.dispatch("messageSendSucceeded", this);

    var messageID = transport.headerJSON, body = transport.responseText.strip();
    this.chat.dispatch("messageAccepted", this.message, messageID);
    if (body) this.chat.dispatch("messageBodyUpdated", this.message, body);
  },

  onFailure: function(transport) {
    this.finish();

    if (this.count == 1) {
      this.send.bind(this).defer();
    } else {
      this.chat.dispatch("messageSendFailed", this);
    }
  },

  onTimeout: function() {
    if (this.request.transport) {
      this.chat.dispatch("requestAborted", this.request);
      this.request.transport.abort();
    }

    this.onFailure();
  },

  finish: function() {
    window.clearTimeout(this.timeout);
    this.request = false;
    this.timeout = false;
  }
});

Campfire.OutgoingMessage.TIMEOUT = 15;
Campfire.Poller = Class.create({
  initialize: function(chat) {
    this.chat     = chat;
    this.url      = chat.pollURL;
    this.defaultInterval = chat.pollInterval || 3;
    this.interval = this.defaultInterval;
    this.lastCacheID = this.chat.lastCacheID;
    this.timestamp = chat.timestamp;
    this.start();
  },

  start: function() {
    this.stopped = this.request = false;
    this.registerTimer();
  },

  stop: function() {
    this.stopped = true;
  },

  registerTimer: function() {
    window.setTimeout(this.poll.bind(this), this.interval * 1000);
  },

  parametersForRequest: function() {
    return $H({
      l: this.lastCacheID,          // l: the last cache fragment id
      m: this.chat.membershipKey,   // m: the user's membership key
      t: $T(),                      // t: the timestamp of the current request,
      s: this.timestamp             // s: the server timestamp of the last
    });
  },

  poll: function() {
    if (this.stopped || this.request) {
      if (this.chat.debug)
        alert('Polling is stopped! stopped=' + this.stopped + ', request=' + this.request);
      return;
    }
    this.request = new Ajax.Request(this.url, {
      method:      "get",
      evalScripts: true,
      parameters:  this.parametersForRequest().toQueryString(),
      onComplete:  this.onComplete.bind(this),
      onException: this.onException.bind(this)
    });
    this.chat.dispatch('pollStarted');
  },

  onComplete: function(transport) {
    this.interval = this.defaultInterval;
    this.chat.dispatch('pollCompleted');
  },

  onPollCompleted: function() {
    this.request = false;
    this.registerTimer();
  },

  onException: function(exception) {
    if (this.chat.debug)
      alert('Polling exception on ' + this.url + ' at ' + this.interval + 'sec interval: ' + exception);
    this.interval = 2 * this.interval;
    if (this.interval > 60)
      this.interval = 60;
    this.chat.dispatch('pollCompleted');
  }
});

Campfire.Responders.push("Poller");
Campfire.RequestWatchdog = Class.create({
  initialize: function(chat) {
    this.chat = chat;
    this.requests = [];
    Ajax.Responders.register(this);
  },

  onCreate: function(request) {
    request.timestamp = $T();
    if (request.options.timeout !== false) {
      this.requests.push(request);
      this.setTimeoutForRequest(request);
    }
  },

  onComplete: function(request) {
    this.requests = this.requests.without(request);
  },

  onRequestTimeout: function(request) {
    if (this.requests.include(request)) {
      this.chat.dispatch("requestAborted", request);
      request.transport.abort();
      this.chat.poller.stop();
      this.onComplete(request);
      this.chat.poller.start();
    }
  },

  setTimeoutForRequest: function(request, timeout) {
    return window.setTimeout(this.onRequestTimeout.bind(this, request),
      (timeout || Campfire.RequestWatchdog.Threshold) * 1000);
  },

  onRequestAborted: function(request) {
    this.log(request);
  },

  log: function(request) {
    var params = $H({
      timestamp:  request.timestamp,
      location:   request.url,
      readyState: request.transport.readyState
    }).toQueryString();

    var image = $(document.body.appendChild(document.createElement("img")));
    image.setStyle({ position: "absolute", left: 0, top: 0, width: "1px", height: "1px" });
    image.src = window.location.protocol + "//123.campfirenow.com/images/jslog.gif?" + params;
    image.onload = function() { image.remove() };
  }
});

Campfire.RequestWatchdog.Threshold = 5;

Campfire.Responders.push("RequestWatchdog");
Campfire.SoundManager = Class.create({
  initialize: function(chat) {
    this.chat    = chat;
    this.enabled = chat.soundsEnabled;
    this.sounds  = {};

    if ($('sounds')) {
      $('sounds').hide();
      window.soundManager.onerror = (function() {
        this.enabled = false;
      }).bind(this);
      window.soundManager.onload = function() {
        $('sounds').show();
        window.soundManager.onerror = Prototype.emptyFunction;
      }
    }
  },

  getURLForSound: function(sound) {
    return '/sounds/' + sound + '.mp3';
  },

  getSound: function(sound) {
    return this.sounds[sound] = this.sounds[sound] || soundManager.createSound({
      id:  sound,
      url: this.getURLForSound(sound)
    });
  },

  play: function(sound, force) {
    if (!force && this.isMuted()) return;
    this.getSound(sound).play();
    this.chat.dispatch('soundPlayed', this.getURLForSound(sound));
  },

  playMessage: function(element) {
    var message = this.chat.messageFrom(element.up("tr"));
    this.play(message.getSound(), true);
    if (this.chat.speaker) this.chat.speaker.focus();
  },

  onMessagesInserted: function(messages) {
    var sound;

    for (var i = 0; i < messages.length; i++) {
      if (messages[i].kind == 'sound')
        sound = messages[i].getSound();
      else if (!sound && messages[i].actsLikeTextMessage())
        sound = 'incoming';
    }

    if (sound) this.play(sound);
  },

  onPreparationForMessageSpoken: function() {
    this.speaking = true;
  },

  onMessageSpoken: function() {
    this.speaking = false;
  },

  isMuted: function() {
    return !this.enabled || this.speaking;
  }
});

Campfire.Responders.push("SoundManager");
Campfire.Speaker = Class.create({
  initialize: function(chat) {
    this.chat     = chat;
    this.input    = $(chat.speakElement);
    this.form     = $(this.input.form);
    this.controls = $('chat_controls');
    this.filters  = Campfire.Speaker.Filters.toArray();
    this.registerCallbacks();
    this.focus();
  },

  registerCallbacks: function() {
    Event.observe(this.input, 'keypress', this.onKeyPress.bind(this));
    Event.observe(this.input, 'keyup', this.onKeyUp.bind(this));
    Event.observe(this.form, 'submit', this.onSubmit.bind(this));
  },

  focus: function() {
    window.setTimeout(Field.focus.bind(Field, this.input), 10);
  },

  speak: function(body, kind) {
    if (!(body = this.filterMessage(body))) return;
    if (kind === true) kind = "paste"; // support the old 'sendAsPaste' argument
    var message;

    this.chat.dispatch('preparationForMessageSpoken', body);

    if (kind == "paste") {
      message = this.chat.transcript.insertPendingMessage('');
      message.setKind('paste');
      message.updateBody('<span class="loading">Pasting...</span>');

    } else if (kind == "tweet") {
      message = this.chat.transcript.insertPendingMessage('');
      message.setKind('tweet');
      message.updateBody('<span class="loading">Loading...</span>');

    } else if (kind == "sound") {
      (function() { this.chat.soundmanager.play(body) }).bind(this).defer();
      message = this.chat.transcript.insertPendingMessage(body,
        new Template(this.chat.soundTemplate),
        { description: this.chat.sounds[body] }
      );

    } else {
      message = this.chat.transcript.insertPendingMessage(body);
    }

    new Campfire.OutgoingMessage(this.chat, message, body, kind).send();

    this.chat.dispatch('messageSpoken', message);
  },

  send: function(forcePaste) {
    var value = $F(this.input);
    if (value.blank()) return;

    var kind = this.kindOfMessage(value);
    if (forcePaste) kind = "paste";

    this.speak(value, kind);
    this.input.value = '';
  },

  kindOfMessage: function(message) {
    if (message.match(/\r|\n/))
      return 'paste';

    if (message.strip().match(/^http\S+twitter\.com\/\w+\/status(?:es)?\/\d+$/i))
      return 'tweet';

    return 'text';
  },

  onSubmit: function(event) {
    this.send();
    Event.stop(event);
    this.focus();
  },

  onKeyPress: function(event) {
    this.chat.dispatch('preparationForKeyPress', event);
    switch (event.keyCode) {
      case Event.KEY_RETURN:
      case 3: /* safari sends ASCII 3 for the enter key */
        if (event.shiftKey) {
          return;
        } else if (event.ctrlKey || event.metaKey) {
          this.send(true);
        } else {
          this.send();
        }
        Event.stop(event);
    }
  },

  onKeyUp: function(event) {
    this.chat.dispatch('keyPressed', event);
  },

  filterMessage: function(message) {
    for (var i = 0; i < this.filters.length; i++)
      if (!(message = this.filters[i].call(this, message)))
        return false;
    return message;
  }
});

Campfire.evaluator = function(script) { return eval(script) };

Campfire.Speaker.Filters = [
  function(message) {
    var match;
    if (match = message.match(/^\/me +(.*)/)) {
      if ((match = match[1].toString()).blank()) return false;
      return '*' + match + '*';
    } else {
      return message;
    }
  },

  function(message) {
    var matches, sound, description;
    if (matches = message.match(/^\/plays? +([^ ]+)/)) {
      sound = matches[1].toString();
      if (this.chat.sounds[sound]) {
        this.chat.speaker.speak(sound, "sound");
      }
      return false;
    } else {
      return message;
    }
  },

  function(message) {
    var match;
    if (match = message.match(/^\/eval +(.*)/)) {
      if ((match = match[1].toString()).blank()) return false;
      var query = ">>> " + match, result;
      var body  = '<code>' + query.escapeHTML() + '</code>';
      try {
        result = Campfire.evaluator.call(null, match);
        if (typeof result != "undefined")
          result = Object.inspect(result);
      } catch (e) {
        result = e.toString();
      }

      if (typeof result != "undefined")
        body += '<br /><pre><code>' + result.escapeHTML() + '</code></pre>';

      var element = this.chat.transcript.insertPendingMessage('');
      element.setKind('paste');
      element.updateBody(body);

      this.chat.windowmanager.scrollToBottom();

    } else {
      return message;
    }
  }
];

Campfire.Responders.push("Speaker");
Campfire.StarManager = Class.create({
  initialize: function(chat) {
    this.chat = chat;
  },

  toggle: function(element) {
    var message = this.chat.findMessage(element), star = $(element).up("span.star");
    var method  = star.hasClassName("starred") ? "delete" : "post";

    if (!star.hasClassName("busy")) {
      star.toggleClassName("starred").addClassName("busy");
      new Ajax.Request("/messages/" + message.id() + "/star", { method: method });
    }
  },

  onMessageSpoken: function(message) {
    var star = this.findStar(message);
    if (star) star.hide();
  },

  onMessageAccepted: function(message) {
    var star = this.findStar(message);
    if (star) star.show();
  },

  findStar: function(message) {
    return message.element.down("span.star");
  }
});

Campfire.Responders.push("StarManager");
(function() {
  var tabHasFocus;
  var object, focusEventName, unfocusEventName;

  if (Prototype.Browser.IE) {
    object = document, focusEventName = "focusin", unfocusEventName = "focusout";
  } else if (Prototype.Browser.Gecko) {
    object = document, focusEventName = "focus", unfocusEventName = "blur";
  } else {
    object = window, focusEventName = "focus", unfocusEventName = "blur";
  }

  document.observe("dom:loaded", function() {
    notifyOfTabFocusChange(document.hasFocus());
  });

  Event.observe(object, focusEventName, function() {
    notifyOfTabFocusChange(true);
  });

  Event.observe(object, unfocusEventName, function() {
    notifyOfTabFocusChange(false);
  });

  function notifyOfTabFocusChange(hasFocus) {
    if (tabHasFocus !== hasFocus) {
      tabHasFocus = hasFocus;
      if (hasFocus) {
        document.fire("tab:focused");
      } else {
        document.fire("tab:unfocused");
      }
    }
  }
})();

Campfire.UnreadIndicator = Class.create({
  initialize: function(chat) {
    this.chat = chat;
    this.unreadCount = 0;

    document.observe("tab:focused", this.onFocus.bind(this));
    document.observe("tab:unfocused", this.onUnfocus.bind(this));
  },

  onFocus: function() {
    this.focused = true;
    this.resetUnreadCount();
  },

  onUnfocus: function() {
    this.focused = false;
  },

  onMessagesInserted: function(messages) {
    if (!this.focused) {
      var count = 0;
      for (var i = 0; i < messages.length; i++)
        if (messages[i].actsLikeTextMessage()) count++;
      this.incrementUnreadCountBy(count);
    }
  },

  incrementUnreadCountBy: function(count) {
    this.unreadCount += count;
    this.updateUnreadCounter.bind(this).defer();
  },

  resetUnreadCount: function() {
    this.unreadCount = 0;
    this.updateUnreadCounter.bind(this).defer();
  },

  updateUnreadCounter: function() {
    var title = document.title;
    document.title = "";
    if (this.unreadCount) {
      var match = title.match(Campfire.UnreadMessageCounter);
      if (match) {
        document.title = title.replace(Campfire.UnreadMessageCounter,
          "(" + this.unreadCount + ") ");
      } else {
        document.title = "(" + this.unreadCount + ") " + title;
      }
    } else {
      document.title = title.replace(Campfire.UnreadMessageCounter, "");
    }
  }
});

Campfire.Responders.push("UnreadIndicator");

if (window.fluid) {
  Campfire.UnreadIndicator.addMethods({
    updateUnreadCounter: function() {
      fluid.setDockBadge((this.unreadCount || "").toString());
    }
  });

  Campfire.GrowlNotifier = Class.create({
    initialize: function(chat) {
      this.chat = chat;
      this.pattern = new RegExp("^" + RegExp.escape(this.chat.username));
    },

    onMessagesInserted: function(messages) {
      for (var i = 0; i < messages.length; i++) {
        var message = messages[i];
        if (message.kind == "text") {
          var bodyElement = message.bodyElement();
          var body = bodyElement.innerHTML.unescapeHTML();

          if (body.match(this.pattern)) {
            window.fluid.showGrowlNotification({
              title: document.title,
              description: "(" + message.author() + ") " + body,
              priority: 1,
              sticky: false,
              onclick: function() {
                bodyElement.visualEffect("highlight", { duration: 2 });
              }
            });
          }
        }
      }
    }
  });

  Campfire.Responders.push("GrowlNotifier");
}
Campfire.WindowManager = Class.create({
  initialize: function(chat) {
    this.chat = chat;
    this.reset();

    document.observe("dom:loaded", this.registerCallbacks.bind(this));
  },

  registerCallbacks: function() {
    Event.observe(window, "scroll", this.onScroll.bind(this));
    Event.observe(window, "resize", this.onResize.bind(this));
    this.scrollToBottom.bind(this).defer();
  },

  scrollToBottom: function() {
    if (!this.chat.scrollToBottom) return;

    if (this.chat.IE) {
      $('last_message').scrollIntoView(true);
    } else {
      this.scrollTo(0, this.getPageHeight() + this.getWindowHeight() + 100);
    }

    this.scrolledToBottom = true;
  },

  adjustScrollOffsetRelativeToElementHeightChange: function(element, callback) {
    element = $(element);

    var originalHeight = element.getHeight();
    callback();

    if (this.scrolledToBottom) {
      this.scrollToBottom();

    } else {
      var differenceInHeight = element.getHeight() - originalHeight;
      var offsets = this.getScrollOffsets();

      if (this.getElementTop(element) < this.getViewportTop()) {
        offsets.top += differenceInHeight;
      }

      this.scrollTo(offsets.left, offsets.top);
    }
  },

  scrollTo: function(left, top) {
    window.scrollTo(left, top);
  },

  getScrollOffsets: function() {
    return document.viewport.getScrollOffsets();
  },

  reset: function() {
    this.scrollToBottom();
    this.focus();
  },

  focus: function() {
    this.chat.speaker && this.chat.speaker.focus();
  },

  onScroll: function(event) {
    this.scrolledToBottom = this.isScrolledToBottom();
  },

  onResize: function(event) {
    if (!this.chat.IE && this.scrolledToBottom && !this.isScrolledToBottom())
      this.scrollToBottom();
  },

  onMessagesInsertedBeforeDisplay: function() {
    this.scrolledToBottom = this.isScrolledToBottom();
  },

  onMessagesInserted: function(messages) {
    if (this.scrolledToBottom)
      this.scrollToBottom();
  },

  onMessageSpoken: function() {
    this.scrollToBottom();
    this.chat.speaker.focus();
  },

  onMessageBodyUpdated: function() {
    this.scrollToBottom();
  },

  getPageHeight: function() {
    return Math.max(document.documentElement.offsetHeight,
      document.body.scrollHeight);
  },

  getWindowHeight: function() {
    return window.innerHeight || document.body.clientHeight;
  },

  getScrollOffset: function() {
    return Math.max(document.documentElement.scrollTop,
      document.body.scrollTop);
  },

  getViewportTop: function() {
    return $("Header").getHeight() +
      document.viewport.getScrollOffsets().top;
  },

  getElementTop: function(element) {
    return $(element).positionedOffset().top;
  },

  isScrolledToBottom: function() {
    return this.getScrollOffset() + this.getWindowHeight() >=
      this.getPageHeight();
  }
});

Campfire.Responders.push("WindowManager");
/**
 *
 * Find more about the scrolling function at
 * http://cubiq.org/scrolling-div-for-mobile-webkit-turns-3/16
 *
 * Copyright (c) 2009 Matteo Spinelli, http://cubiq.org/
 * Released under MIT license
 * http://cubiq.org/dropbox/mit-license.txt
 *
 * Version 3.0beta4 - Last updated: 2010.04.02
 *
 */

function iScroll (el, options) {
  this.element = typeof el == 'object' ? el : document.getElementById(el);
  this.wrapper = this.element.parentNode;

  this.wrapper.style.overflow = 'hidden';
  this.wrapper.style.position = 'relative';
  this.element.style.webkitTransitionProperty = '-webkit-transform';
  this.element.style.webkitTransitionTimingFunction = 'cubic-bezier(0,0,0.25,1)';
  this.element.style.webkitTransitionDuration = '0';
  this.element.style.webkitTransform = 'translate3d(0,0,0)';

  this.options = {
    bounce: true,
    hScrollBar: true,
    vScrollBar: true
  };

  if (typeof options == 'object') {
    for (var i in options) {
      this.options[i] = options[i];
    }
  }

  this.refresh();

  this.element.addEventListener('touchstart', this);
  this.element.addEventListener('touchmove', this);
  this.element.addEventListener('touchend', this);
  window.addEventListener('orientationchange', this);
}

iScroll.prototype = {
  _x: 0,
  _y: 0,

  handleEvent: function (e) {
    switch (e.type) {
      case 'touchstart': this.onTouchStart(e); break;
      case 'touchmove': this.onTouchMove(e); break;
      case 'touchend': this.onTouchEnd(e); break;
      case 'webkitTransitionEnd': this.onTransitionEnd(e); break;
      case 'orientationchange': this.refresh(); this.scrollTo(0,0,'0'); break;
    }
  },

  refresh: function () {
    this.element.style.webkitTransitionDuration = '0';
    this.scrollWidth = this.wrapper.clientWidth;
    this.scrollHeight = this.wrapper.clientHeight;
    this.maxScrollX = this.scrollWidth - this.element.offsetWidth;
    this.maxScrollY = this.scrollHeight - this.element.offsetHeight;
    this.scrollX = this.element.offsetWidth > this.scrollWidth ? true : false;
    this.scrollY = this.element.offsetHeight > this.scrollHeight ? true : false;

    if (this.options.hScrollBar && this.scrollX) {
      this.scrollBarX = new scrollbar('horizontal', this.wrapper);
      this.scrollBarX.init(this.scrollWidth, this.element.offsetWidth);
    } else if (this.scrollBarX) {
      this.scrollBarX = this.scrollBarX.remove();
    }

    if (this.options.vScrollBar && this.scrollY) {
      this.scrollBarY = new scrollbar('vertical', this.wrapper);
      this.scrollBarY.init(this.scrollHeight, this.element.offsetHeight);
    } else if (this.scrollBarY) {
      this.scrollBarY = this.scrollBarY.remove();
    }
  },

  setPosition: function (x, y) {
    this._x = x !== null ? x : this._x;
    this._y = y !== null ? y : this._y;

    this.element.style.webkitTransform = 'translate3d(' + this._x + 'px,' + this._y + 'px,0)';

    if (this.scrollBarX) {
      this.scrollBarX.setPosition(this.scrollBarX.maxScroll / this.maxScrollX * this._x);
    }
    if (this.scrollBarY) {
      this.scrollBarY.setPosition(this.scrollBarY.maxScroll / this.maxScrollY * this._y);
    }
  },

  onTouchStart: function(e) {
      if (e.targetTouches.length != 1) {
          return false;
        }

    e.preventDefault();
    e.stopPropagation();

    this.element.style.webkitTransitionDuration = '0';

    if (this.scrollBarX) {
      this.scrollBarX.bar.style.webkitTransitionDuration = '0, 250ms';
    }
    if (this.scrollBarY) {
      this.scrollBarY.bar.style.webkitTransitionDuration = '0, 250ms';
    }

    var theTransform = new WebKitCSSMatrix(window.getComputedStyle(this.element).webkitTransform);
    if (theTransform.m41 != this.x || theTransform.m42 != this.y) {
      this.setPosition(theTransform.m41, theTransform.m42);
    }

    this.touchStartX = e.touches[0].pageX;
    this.scrollStartX = this.x;

    this.touchStartY = e.touches[0].pageY;
    this.scrollStartY = this.y;

    this.scrollStartTime = e.timeStamp;
    this.moved = false;
  },

  onTouchMove: function(e) {
    if (e.targetTouches.length != 1) {
      return false;
    }

    var leftDelta = this.scrollX === true ? e.touches[0].pageX - this.touchStartX : 0;
    var topDelta = this.scrollY === true ? e.touches[0].pageY - this.touchStartY : 0;

    if (this.x > 0 || this.x < this.maxScrollX) {
      leftDelta = Math.round(leftDelta / 4);    // Slow down if outside of the boundaries
    }

    if (this.y > 0 || this.y < this.maxScrollY) {
      topDelta = Math.round(topDelta / 4);    // Slow down if outside of the boundaries
    }

    if (this.scrollBarX && !this.scrollBarX.visible) {
      this.scrollBarX.show();
    }
    if (this.scrollBarY && !this.scrollBarY.visible) {
      this.scrollBarY.show();
    }

    this.setPosition(this.x + leftDelta, this.y + topDelta);

    this.touchStartX = e.touches[0].pageX;
    this.touchStartY = e.touches[0].pageY;
    this.moved = true;

    if( e.timeStamp-this.scrollStartTime > 250 ) {
      this.scrollStartX = this.x;
      this.scrollStartY = this.y;
      this.scrollStartTime = e.timeStamp;
    }
  },

  onTouchEnd: function(e) {
    if (e.targetTouches.length > 0) {
      return false;
    }

    if (!this.moved) {
      var theEvent = document.createEvent('MouseEvents');
      theEvent.initMouseEvent("click", true, true, document.defaultView, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null);
      e.changedTouches[0].target.dispatchEvent(theEvent);
      return false;
    }

    var time = e.timeStamp - this.scrollStartTime;

    var momentumX = this.scrollX === true
      ? this.momentum(this.x - this.scrollStartX,
              time,
              -this.x + 50,
              this.x + this.element.offsetWidth - this.scrollWidth + 50)
      : { dist: 0, time: 0 };

    var momentumY = this.scrollY === true
      ? this.momentum(this.y - this.scrollStartY,
              time,
               -this.y + /*this.scrollHeight/3*/ 50,
              this.y + this.element.offsetHeight - this.scrollHeight + /*this.scrollHeight/3*/ 50)
      : { dist: 0, time: 0 };

    if (!momentumX.dist && !momentumY.dist) {
      this.onTransitionEnd(); // I know, I know... This is lame
      return false;
    }

    var newDuration = Math.max(momentumX.time, momentumY.time);
    var newPositionX = this.x + momentumX.dist;
    var newPositionY = this.y + momentumY.dist;

    this.element.addEventListener('webkitTransitionEnd', this);

    this.scrollTo(newPositionX, newPositionY, newDuration + 'ms');

    if (this.scrollBarX) {
      this.scrollBarX.scrollTo(this.scrollBarX.maxScroll / this.maxScrollX * newPositionX, newDuration + 'ms');
    }
    if (this.scrollBarY) {
      this.scrollBarY.scrollTo(this.scrollBarY.maxScroll / this.maxScrollY * newPositionY, newDuration + 'ms');
    }
  },

  onTransitionEnd: function () {
    this.element.removeEventListener('webkitTransitionEnd', this);
    this.resetPosition();

    if (this.scrollBarX) {
      this.scrollBarX.hide();
    }
    if (this.scrollBarY) {
      this.scrollBarY.hide();
    }
  },

  resetPosition: function () {
    var resetX = resetY = null;
    if (this.x > 0 || this.x < this.maxScrollX) {
      resetX = this.x >= 0 ? 0 : this.maxScrollX;
    }

    if (this.y > 0 || this.y < this.maxScrollY) {
      resetY = this.y >= 0 ? 0 : this.maxScrollY;
    }

    if (resetX !== null || resetY !== null) {
      this.scrollTo(resetX, resetY, '500ms');

      if (this.scrollBarX) {
        this.scrollBarX.scrollTo(this.scrollBarX.maxScroll / this.maxScrollX * (resetX || this.x), '500ms');
      }
      if (this.scrollBarY) {
        this.scrollBarY.scrollTo(this.scrollBarY.maxScroll / this.maxScrollY * (resetY || this.y), '500ms');
      }
    }
  },

  scrollTo: function (destX, destY, runtime) {
    this.element.style.webkitTransitionDuration = runtime || '400ms';
    this.setPosition(destX, destY);
  },

  momentum: function (dist, time, maxDist1, maxDist2) {
    friction = 0.1;
    deceleration = 1.5;

    var speed = Math.abs(dist) / time * 1000;
    var newDist = speed * speed / (20 * friction) / 1000;

    if (dist > 0 && maxDist1 !== undefined && newDist > maxDist1) {
      speed = speed * maxDist1 / newDist;
      newDist = maxDist1;
    }
    if (dist < 0 && maxDist2 !== undefined && newDist > maxDist2) {
      speed = speed * maxDist2 / newDist;
      newDist = maxDist2;
    }

    newDist = newDist * (dist < 0 ? -1 : 1);

    var newTime = -speed / -deceleration;
    if (newTime < 1) {  // We can't go back in time
      newTime = 1;
    }

    return { dist: Math.round(newDist), time: Math.round(newTime) };
  }
};

try {
  iScroll.prototype.__defineGetter__("x", function() { return this._x });
  iScroll.prototype.__defineGetter__("y", function() { return this._y });
} catch(e) {}

var scrollbar = function (dir, wrapper) {
  this.dir = dir;
  this.bar = document.createElement('div');
  this.bar.className = 'scrollbar ' + dir;
  this.bar.style.webkitTransitionTimingFunction = 'cubic-bezier(0,0,0.25,1)';
  this.bar.style.webkitTransform = 'translate3d(0,0,0)';
  this.bar.style.webkitTransitionProperty = '-webkit-transform,opacity';
  this.bar.style.webkitTransitionDuration = '0,250ms';
  this.bar.style.pointerEvents = 'none';
  this.bar.style.opacity = '0';

  wrapper.appendChild(this.bar);
}

scrollbar.prototype = {
  size: 0,
  maxSize: 0,
  maxScroll: 0,
  visible: false,

  init: function (scroll, size) {
    var offset = this.dir == 'horizontal' ? this.bar.offsetWidth - this.bar.clientWidth : this.bar.offsetHeight - this.bar.clientHeight;
    this.maxSize = scroll - 8;    // 8 = distance from top + distance from bottom
    this.size = Math.round(this.maxSize * this.maxSize / size) + offset;
    this.maxScroll = this.maxSize - this.size;
    this.bar.style[this.dir == 'horizontal' ? 'width' : 'height'] = (this.size - offset) + 'px';
  },

  setPosition: function (pos) {
    if (pos < 0) {
      pos = 0;
    } else if (pos > this.maxScroll) {
      pos = this.maxScroll;
    }

    pos = this.dir == 'horizontal' ? 'translate3d(' + Math.round(pos) + 'px,0,0)' : 'translate3d(0,' + Math.round(pos) + 'px,0)';
    this.bar.style.webkitTransform = pos;
  },

  scrollTo: function (pos, runtime) {
    this.bar.style.webkitTransitionDuration = (runtime || '400ms') + ',250ms';
    this.setPosition(pos);
  },

  show: function () {
    this.visible = true;
    this.bar.style.opacity = '1';
  },

  hide: function () {
    this.visible = false;
    this.bar.style.opacity = '0';
  },

  remove: function () {
    this.bar.parentNode.removeChild(this.bar);
    return null;
  }
};

if (window.navigator.userAgent.match(/iPad.*Mobile.*Safari/)) {
  document.observe("dom:loaded", function(event) {
    var wrapper, transcript, iscroll;

    document.body.addClassName("ipad");
    if (!document.body.hasClassName("chat")) return;

    transcript = $("Container").down(".col");
    wrapper = new Element("div").addClassName("ipad_scroll_wrapper");
    transcript.wrap(wrapper);

    iscroll = new iScroll(transcript);
    layout.defer();

    Event.observe(window, "orientationchange", function() {
      chat.windowmanager.scrollToBottom();
    });

    function layout() {
      if (!wrapper) return;
      var height = $("clipper").up().offsetTop - wrapper.offsetTop;
      wrapper.setStyle({ height: height + "px" });
      iscroll.refresh();
    }

    function getWrapperHeight() {
      if (wrapper) return wrapper.getHeight();
      return 0;
    }

    function getTranscriptHeight() {
      if (transcript) return transcript.getHeight() - getWrapperHeight();
      return 0;
    }

    function augment(klass, methods) {
      var wrappedMethods = {}, methodName;
      for (methodName in methods) {
        wrappedMethods[methodName] = klass.prototype[methodName].wrap(methods[methodName]);
      }
      klass.addMethods(wrappedMethods);
    }

    augment(Campfire.LayoutManager, {
      layout: function($super) {
        $super();
        layout();
      },

      adjustChatMessageColumnWidth: function($super) {
        $super();
        layout();
      }
    });

    augment(Campfire.WindowManager, {
      scrollTo: function($super, left, top) {
        top = Math.max(-Math.abs(top), -getTranscriptHeight());
        if (iscroll) iscroll.scrollTo(-Math.abs(left), top, '0');
        layout();
      },

      scrollToBottom: function($super) {
        this.scrollTo(0, getTranscriptHeight());
      },

      getScrollOffsets: function() {
        return Element._returnOffset(-iscroll.x, -iscroll.y);
      },

      getWindowHeight: function() {
        return 0;
      },

      getScrollOffset: function() {
        return this.getScrollOffsets().top;
      },

      getPageHeight: function() {
        return getTranscriptHeight();
      }
    });
  });
}
if (window.propane) {
  document.observe("dom:loaded", function() {
    $(document.body).addClassName("propane");
  });
}
Campfire.TimestampManager = Class.create({
  initialize: function(chat) {
    this.chat       = chat;
    this.transcript = chat.transcript;
  },

  removePendingTimestamp: function() {
    if (this.pendingTimestamp) {
      this.chat.transcript.messages =
        this.chat.transcript.messages.without(this.pendingTimestamp);
      Element.remove(this.pendingTimestamp.element);
      this.pendingTimestamp = null;
    }
  },

  hidePendingTimestamp: function() {
    if (this.pendingTimestamp) {
      this.pendingTimestamp.resize(function() {
        this.element.addClassName("hidden");
      });
    }
  },

  showPendingTimestamp: function() {
    if (this.pendingTimestamp) {
      this.pendingTimestamp.resize(function() {
        this.element.removeClassName("hidden");
      });
    }
  },

  onMessagesInserted: function(messages) {
    var firstMessage = messages[0];
    if (messages.length == 1 && firstMessage.kind == 'timestamp') {
      this.removePendingTimestamp();
      this.pendingTimestamp = firstMessage;
      this.hidePendingTimestamp();
    } else if (this.pendingTimestamp) {
      if (firstMessage.kind == 'timestamp') {
        this.removePendingTimestamp();
      } else {
        this.showPendingTimestamp();
        this.pendingTimestamp = null;
      }
    }
  }
});

Campfire.Responders.push("TimestampManager");
Campfire.Transcript = Class.create({
  initialize: function(chat) {
    this.chat     = chat;
    this.element  = $(chat.transcriptElement);
    this.template = new Template(chat.messageTemplate || '');
    this.findMessages();
  },

  findMessages: function() {
    var elements = this.element.select('.message');
    this.messages = elements.map(function(element) {
      var message = this.chat.messageFrom(element);
      if (message.kind == 'timestamp') this.lastTimestampMessage = message;
      return message;
    }.bind(this));
    this.updateTranscriptLink();
  },

  bodyForPendingMessage: function(message) {
    return MessageTransformers.applyFirst(message);
  },

  insertPendingMessage: function(message, template, options) {
    options = Object.extend(Object.extend({}, options || {}), {
      id: 'pending', body: this.bodyForPendingMessage(message)
    });

    var html = (template || this.template).evaluate(options);
    var element = this.insertMessages(html, 'pending').first();
    element.element.id = '';
    return element;
  },

  insertMessages: function() {
    var ids = $A(arguments), html = ids.shift();
    new Insertion.Bottom(this.element, html);
    var messages = ids.map(this.getMessageById.bind(this));
    this.chat.dispatch('messagesInsertedBeforeDisplay', messages);
    messages.pluck('element').each(Element.show);
    this.chat.dispatch('messagesInserted', messages);
    return messages;
  },

  queueMessage: function(message, id) {
    this.messageQueue = this.messageQueue || [];
    this.messageQueue.push([message, id]);
  },

  trimHistoryBy: function(size) {
    var adjustment = this.messages.length - this.chat.messageHistory + size;
    if (adjustment > 0) {
      adjustment.times(function() {
        Element.remove(this.messages.shift().element);
      }.bind(this));
      for (var i = 0, message; i < this.messages.length; i++)
        if ((message = this.messages[i]).actsLikeTextMessage())
          return message.setAuthorVisibilityInRelationTo(null);
    }
  },

  updateTranscriptLink: function() {
    if (this.messages.length >= this.chat.messageHistory) {
      if (!$('todays_transcript')) return;
      Element.show('todays_transcript');
      var link = $('todays_transcript_link');
      link.href = link.href.replace(/\/\d+$/,
        '/' + this.messages.first().id());
    }
  },

  onMessagesInsertedBeforeDisplay: function(messages) {
    for (var i = 0; i < messages.length; i++) {
      var message = messages[i];
      if (message.kind == 'timestamp') {
        if (this.lastTimestampMessage)
          message.setAuthorVisibilityInRelationTo(this.lastTimestampMessage);
        this.lastTimestampMessage = message;
      } else {
        message.setAuthorVisibilityInRelationTo(this.messages.last());
      }
      if (Element.hasClassName(message.element, 'user_' + this.chat.userID))
        Element.addClassName(message.element, 'you');
      this.messages.push(message);
    }

    this.updateTranscriptLink();
    this.trimHistoryBy(messages.length);
  },

  onMessageAccepted: function(message, id) {
    var element = message.element;
    element.id = 'message_' + id;
    Element.removeClassName(element, 'pending');
  },

  onMessageBodyUpdated: function(message, body) {
    message.updateBody(body);
  },

  onPollCompleted: function() {
    if (!this.messageQueue) return;
    var args = [''], message;
    for (var i = 0; i < this.messageQueue.length; i++) {
      message = this.messageQueue[i];
      args[0] += message[0];
      args.push(message[1]);
    }
    delete this.messageQueue;
    this.insertMessages.apply(this, args);
  },

  getRows: function() {
    return this.element.getElementsByTagName('tr');
  },

  getMessage: function(element) {
    return this.chat.messageFrom(element);
  },

  getMessageById: function(id) {
    return this.getMessage($('message_' + id));
  }
});

Campfire.Responders.push("Transcript");
Campfire.Uploader = Class.create({
  initialize: function(chat) {
    this.chat = chat;
  },

  chooseFile: function() {
    Element.show('upload_form_contents');
    Element.hide('upload_form_progress');
  },

  start: function() {
    if (this.value()) {
      this.showProgress();
      $('upload_form_tag').submit();
      this.chat.speaker.focus();
    }
  },

  reset: function() {
    Element.update('upload_form_tag', $('upload_form_tag').innerHTML);
  },

  showProgress: function() {
    Element.show('upload_form_progress');
    Element.hide('upload_form_contents');
    Element.update('upload_form_status', 'Uploading <strong>' + this.filename() + '</strong>&hellip;');
  },

  hideProgress: function() {
    Element.hide('upload_form_progress');
    Element.show('upload_form_contents');
    Element.update('upload_form_status', 'Finishing upload&hellip;');
  },

  waitForMessage: function(id) {
    this.pending = id;
    if (this.messageExists(id))
      this.finish();
    else
      Element.update('upload_form_status', 'Finishing upload&hellip;');
  },

  messageExists: function() {
    return !!$('message_' + this.pending);
  },

  finish: function() {
    if (!this.pending) return;
    this.reset();
    this.chooseFile();
    $('uploader').showHide.hide();
    delete this.pending;
  },

  value: function() {
    return $('upload').value;
  },

  filename: function() {
    var value = this.value();
    return (value.match(/([^:\\\/]+)$/) || [null, value])[1];
  },

  onMessagesInserted: function(messages) {
    if (!this.messageExists(this.pending)) return;
    this.finish();
  },

  enableUploads: function(flag) {
    Element[flag ? 'show' : 'hide']('upload_file_link');
  }
});

Campfire.Responders.push("Uploader");

if (Prototype.Browser.WebKit) {
  document.observe('dom:loaded', function() {
    var uploader = $('uploader')
    if (!uploader) return
    document.body.insert(UploadDropBox())

    var drag = {}
    var blurred = false

    function UploadDropBox() {
      var input = new Element('input', {type:'file', name:'upload', id:'upload_drop_box'})
      input.setStyle('position:fixed; left:0; top:0; bottom:0; right:0; opacity:0; z-index:100;')
      input.onclick = function(event) { event.preventDefault() }
      input.onchange = function(event) {
        if ($('upload_form_progress').visible()) {
          event.preventDefault()
          return
        }
        uploader.showHide.show()
        $('upload').replace(input.writeAttribute('id', 'upload').writeAttribute('style', ''))
        chat.uploader.start()
        document.body.insert(UploadDropBox())
        if (blurred) $('upload_drop_box').show()
      }
      return input.hide()
    }

    drag.expire = function() {
      if (blurred) $('upload_drop_box').show()
      else $('upload_drop_box').hide()
      delete drag.timer
    }

    document.observe('dragover', function() {
      $('upload_drop_box').show()
      if (drag.timer) window.clearTimeout(drag.timer)
      drag.timer = window.setTimeout(drag.expire, 500)
    })

    Event.observe(window, 'blur', function(event){
      blurred = true
      $('upload_drop_box').show()
    })

    Event.observe(window, 'focus', function(event){
      blurred = false
      $('upload_drop_box').hide()
    })
  })
};

if (Prototype.Browser.Gecko) {
  document.observe('dom:loaded', function() {
    var uploader = $('uploader')
    if (!uploader) return

    var dropbox = UploadDropBox()
    $(document.body).insert(dropbox)

    dropbox.observe("drop",      onDrop)
    document.observe("dragover", onDrag)

    var drag = {}

    function onDrag(event) {
      event.preventDefault()
      dropbox.show()
      if (drag.timer) clearTimeout(drag.timer)
      drag.timer = setTimeout(onDragEnd, 500)
    }

    function onDragEnd() {
      dropbox.hide()
      delete drag.timer
    }

    function onDrop(event) {
      if ($('upload_form_progress').visible()) {
        event.preventDefault()
        return
      }
      var file = event.dataTransfer.files[0]
      if (file) {
        event.preventDefault()
        var form = $('uploader').down('form')
        var options = { parameters: form.serialize(true), files: {} }
        options.files['upload'] = file
        uploader.showHide.show()
        chat.uploader.showProgress()
        new UploadRequest(form.action, options)
      }
    }

    function UploadDropBox() {
      var input = new Element('div', {id:'upload_dropbox', name:'upload'})
      input.setStyle('position:fixed; left:0; top:0; bottom:0; right:0; opacity:0; z-index:100;')
      return input.hide()
    }

    function UploadRequest(url, options) {
      var request  = new XMLHttpRequest
      request.open("POST", url, true)
      request.setRequestHeader('Accept', 'text/javascript, text/html, application/xml, text/xml, */*')
      for (var header in options.headers) request.setRequestHeader(header, options.headers[header])

      request.onreadystatechange = function() {
        if (request.readyState === 4) {
          var contentType = request.getResponseHeader('Content-type')
          if (contentType && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)) {
            eval((request.responseText || '').unfilterJSON())
          }
          (options.onComplete || Prototype.emptyFunction).call(request.status)
          chat.uploader.hideProgress()
          uploader.showHide.toggle()
        }
      }

      var boundary = 'UploadRequest.Boundary--------------------------' + (new Date).getTime()
      request.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary)
      request.sendAsBinary(Multipart.encode(boundary, options.parameters, options.files))

      return request
    }
  })
};
var Conference = {
  start_new_call: function(event) {
    var element = event.element();
    element.hide();
    element.adjacent('.spinner').invoke('show');

    new Ajax.Updater('occurring_calls', element.href, {insertion: 'top', method: 'post', evalScripts: true, onSuccess: function() {
      element.show();
      element.adjacent('.spinner').invoke('hide');
    }.bind(this)});
  },

  updateParticipants: function(number) {
    if (!$('conference_timer')) return;

    if (!$('conference_timer').visible()) new ConferenceTimer('conference_timer')
    var element = $('conference_participants')
    switch (number) {
      case 0:
        return element.hide()
      case 1:
        return element.update('(1 person)').show()
      default:
        return element.update('(' + number +' people)').show()
    }
  }
};

document.observe("dom:loaded", function() {
  $$('.remote_new_conference_call').each(function(conference_link) {
    conference_link.observe('click', Conference.start_new_call);
  });
});
var Time = function(timeSinceEpochInMiliseconds, timezone) {
  var time = new Number(timeSinceEpochInMiliseconds || (new Date).getTime())
  time.zone = timezone || Time.zone
  time.date = new Date(time - Time.zone.utc_offset + time.zone.utc_offset)
  return Object.extend(time, Time.prototype)
}

Time.prototype = new(function()
{
  this.utc = function()
  {
    return Time(this, {utc_offset: 0})
  }

  this.hour = function()
  {
    return this.date.getHours()
  }

  this.minute = function()
  {
    return this.date.getMinutes()
  }

  this.second = function()
  {
    return this.date.getSeconds()
  }

  this.toString = function()
  {
    var abs_offset = this.zone.utc_offset.abs()
    var zone_operator = (this.zone.utc_offset > 0) ? '+' : '-'
    var zone_offset_hour   = (abs_offset / (1).hour()).floor().toPaddedString(2)
    var zone_offset_minute = ((abs_offset % (1).hour()) / (1).minute()).floor().toPaddedString(2)
    var zone_offset_string = "UTC" + zone_operator + zone_offset_hour + zone_offset_minute
    return this.date.toString().replace(/GMT-\d\d\d\d \([A-Z]+\)/, zone_offset_string)
  }
})

Time.Numeric = new(function()
{
  this.hour = this.hours = function()
  {
    return this.minutes() * 60
  }

  this.minute = this.minutes = function()
  {
    return this.seconds() * 60
  }

  this.second = this.seconds = function()
  {
    return this.miliseconds() * 1000
  }

  this.milisecond = this.miliseconds = function()
  {
    return this.valueOf()
  }
})

Object.extend(Number.prototype, Time.Numeric)

Time.zone = { utc_offset: -1 * (new Date).getTimezoneOffset() * (1).minute() }

Function.prototype.recur = function(intervalInSeconds) {
  var recurrance = {}
  var beginning = Time()
  var interval = window.setInterval(this, intervalInSeconds * 1000)
  recurrance.duration = function(){
    return (new Date).getTime() - beginning
  }
  recurrance.stop = function() {
    window.clearInterval(interval)
    var duration = this.duration()
    return (this.stop = this.duration = function() { return duration })()
  }
  return recurrance
}

var ConferenceTimer = Class.create({

  initialize: function(element, durationInSeconds) {
    this.element         = $(element).show()
    this.initialDuration = durationInSeconds ? Number(durationInSeconds * 1000) : 0
    this.initialTime     = Time()
    this.recurrance      = this.advance.bind(this).recur(1)
  },

  elapsed: function() {
    return Time() - this.initialTime + this.initialDuration
  },

  advance: function() {
    var elapsed = this.elapsed()
    var minutes = ((elapsed / (1).minute())).floor()
    var seconds = ((elapsed % (1).minute()) / (1).second()).floor()
    this.update(minutes, seconds)
  },

  update: function(minutes, seconds){
    this.element.update(minutes.toPaddedString(2) + ":" + seconds.toPaddedString(2))
  }
});
var Cookie = {
  get: function(name) {
    var cookie = document.cookie.match(new RegExp('(^|;)\\s*' + escape(name) + '=([^;\\s]*)'));
    return (cookie ? unescape(cookie[2]) : null);
  },

  set: function(name, value, daysToExpire) {
    var attrs = '; path=/';
    if (daysToExpire != undefined) {
      var d = new Date();
      d.setTime(d.getTime() + (86400000 * parseFloat(daysToExpire)));
      attrs += '; expires=' + d.toGMTString();
    }
    return (document.cookie = escape(name) + '=' + escape(value || '') + attrs);
  },

  remove: function(name) {
    var cookie = Cookie.get(name) || true;
    Cookie.set(name, '', -1);
    return cookie;
  }
};
var Hover = {
  EXIT_DELAY  : 600,
  HOVER_CLASS : 'hover',

  lastTimer   : null,
  lastCommand : null,
  inhibit     : false,

  clearCurrent: function() {
    if(!this.lastTimer) return
    clearTimeout(this.lastTimer)
    eval(this.lastCommand)
    this.lastTimer = this.lastCommand = null
  },

  endWith: function(command) {
    if(this.inhibit) return
    this.lastCommand = command
    this.lastTimer = setTimeout(command, this.EXIT_DELAY)
  },

  toggle: function(on, container, nubbin) {
    if(this.inhibit) return

    if(on) {
      if($(container)) Element.addClassName(container, this.HOVER_CLASS)
      if($(nubbin)) Element.show(nubbin)
    } else {
      if($(container)) Element.removeClassName(container, this.HOVER_CLASS)
      if($(nubbin)) Element.hide(nubbin)
    }
  }
};
var Locations = {
  check: function(response) {
    var result = response.responseJSON;
    if(result.available || result.subdomain.blank()) {
      $('subdomain_notice').hide();
    } else {
      $('subdomain_notice').innerHTML = '"' + result.subdomain + '" is not available. Please choose another URL.';
      $('subdomain_notice').show();
    }
  }
}
/* ------------------------------------------------------------------------
 * login.js
 * Copyright (c) 2004-2007 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

var Login = {
 loginWithOpenId: function(options) {
   options = options || {};
   options.duration = 0.2;
   $("login_dialog").transition(options, function() {
     $("open_id_login").show();
     $("user_name_login").hide();
   }).after(function() {
     $("openid_identifier").focus();
     this.clearUserNameAndPassword();
   }.bind(this));
 },

 loginWithUserName: function() {
   $("login_dialog").transition({ duration: 0.2 }, function() {
     $("user_name_login").show();
     $("open_id_login").hide();
   }).after(function() {
     $("username").focus();
     this.clearIdentityUrl();
   }.bind(this));
 },

 clearUserNameAndPassword: function() {
   $('username').value = '';
   $('password').value = '';
 },

 clearIdentityUrl: function() {
   $('openid_identifier').value = '';
 },

 clearHiddenFields: function() {
   if (!$("open_id_login").visible()) {
     this.clearIdentityUrl();
   } else {
     this.clearUserNameAndPassword();
   }
 }
};

document.observe("dom:loaded", function() {
 if ($(document.body).hasClassName("login") && window.location.hash == "#open_id_login")
   Login.loginWithOpenId({ animate: false });
});
(function() {
  var element = new Element("div").setStyle({
    position: "absolute",
    width:    "1px",
    height:   "1px",
    border:   "2px solid red",
    zIndex:   "10000"
  }).hide();

  window.loupe = function(top, left) {
    document.body.insert(element);
    if (!arguments.length) {
      element.hide();
    } else {
      element.setStyle({
        top:  top - 2 + "px",
        left: left - 2 + "px"
      }).show();
    }
  }
})();
/* ------------------------------------------------------------------------
 * nubbins.js
 * Copyright (c) 2006-2007 37signals, LLC. All rights reserved.
 * ------------------------------------------------------------------------ */

var Nubbins = {
  exitDelay: 0.5,

  start: function() {
    if (!this.observer) {
      this.observer = this.onMouseMovement.bind(this);
      Event.observe(document, "mouseover", this.observer);
    }
  },

  stop: function() {
    if (this.observer) {
      Event.stopObserving(document, "mouseover", this.observer);
      delete this.observer;
    }
  },

  onMouseMovement: function(event) {
    var element = this.activeElement = Element.extend(Event.element(event));
    var region  = this.getRegionForElement(element);

    if (region) {
      this.activateRegion(region);
    } else if (this.activeRegion) {
      this.startExitTimeout();
    }
  },

  activateRegion: function(region) {
    this.cancelExitTimeout();

    if (this.activeRegion) {
      if (this.activeRegion == region) return;
      this.deactivateRegion();
    }

    this.activeRegion = region;
    this.activeRegion.addClassName("hover");
  },

  deactivateRegion: function() {
    this.activeRegion.removeClassName("hover");
    this.activeRegion = null;
  },

  startExitTimeout: function() {
    this.timeout = this.timeout || window.setTimeout(function() {
      var region = this.getRegionForElement(this.activeElement);
      if (region != this.activeRegion)
        this.deactivateRegion();

    }.bind(this), this.exitDelay * 1000);
  },

  cancelExitTimeout: function() {
    if (this.timeout) {
      window.clearTimeout(this.timeout);
      this.timeout = null;
    }
  },

  getRegionForElement: function(element) {
    if (element.hasAttribute && !element.hasAttribute("nubbin_region")) {
      var target = this.getTargetForElement(element);
      var region = this.getRegionForTarget(target);
      this.cacheRegionFromElementToTarget(region, element, target);
    }

    return $(element.getAttribute("nubbin_region"));
  },

  getTargetForElement: function(element) {
    return this.upwardFrom(element, function(e) {
      if (e.hasClassName) return e.hasClassName("nubbin(?:_target)?");
    });
  },

  getRegionForTarget: function(element) {
    return this.upwardFrom(element, function(e) {
      if (e.hasClassName) return e.hasClassName("nubbin_region");
    });
  },

  cacheRegionFromElementToTarget: function(region, element, target) {
    if (region && target) {
      this.upwardFrom(element, function(e) {
        e.setAttribute("nubbin_region", region.id);
        if (e == target) return true;
      });
    }
  },

  upwardFrom: function(element, visitor) {
    while (element = $(element)) {
      if (visitor(element)) return element;
      element = element.parentNode;
    }
  }
}

document.observe("dom:loaded", function() {
  Nubbins.start();
});
var Participants = {
  guest_template: new Template("<li class='user nubbin_region' id='user_#{id}'> \
    <span class='nubbin_target'> \
      <span class='name'>#{name}</span> \
      <span class='admin'> \
        <a class='admin' href='#' onclick=\"if (confirm('Are you sure you want to kick #{name} out of the room?')) { \
          $(this).up('li').addClassName('busy'); \
          new Ajax.Request('#{kick_path}', {asynchronous:true, evalScripts:true}); }; \
          return false;\">Kick</a> \
      </span> \
    </span> \
  </li>"),

  user_template: new Template("<li class='user nubbin_region' id='user_#{id}'><span class='name'>#{name}</span></li>"),

  render_users: function(users) {
    var participants_body = '';

    users.each(function(user) {
      var body = user.guest ? Participants.guest_template.evaluate(user) : Participants.user_template.evaluate(user);
      participants_body += body;
    }.bind(this));

    $$('.participant-list').invoke('update', participants_body);
  }
};
var ShowHide = Class.create({
  initialize: function(element, callbacks) {
    this.element   = element = $(element);
    this.effect    = element.getAttribute('effect') || 'slide';
    this.duration  = parseFloat(element.getAttribute('duration')) || 0.25;
    this.activeClassName = element.getAttribute('activeclassname') || 'active';
    this.callbacks = callbacks;
    this.active    = Element.visible(element);
    this.element.showHide = this;
  },

  togglers: function() {
    return $(document.body).select('.show_hide_toggler_' + this.element.id);
  },

  toggle: function() {
    if (this.callbacks.beforeToggle) this.callbacks.beforeToggle(this);
    Effect.toggle(this.element, this.effect, {duration: this.duration,
      afterFinish: this.afterToggle.bind(this)});
    this.active = !this.active;
    this.togglers().concat(this.element).each(this.adjustClassName.bind(this));
  },

  show: function() {
    if (this.active) return;
    this.toggle();
  },

  hide: function() {
    if (!this.active) return;
    this.toggle();
  },

  adjustClassName: function(element) {
    Element[this.active ? 'addClassName' : 'removeClassName'](element, this.activeClassName);
  },

  afterToggle: function() {
    if (this.active) {
      this.element.writeAttribute("style", "");
      this.element.down().writeAttribute("style", "");
    }
    (this.callbacks.afterToggle || Prototype.K).call(null, this);
  }
});
var transcript = {
  hover: {
    begin: function(id) {
      Hover.clearCurrent()
      Hover.toggle(true, 'file-' + id, 'nubbin_file_' + id)
    },

    end: function(id, delay) {
      if(delay)
        Hover.endWith('transcript.hover.end(' + id + ')')
      else
        Hover.toggle(false, 'file-' + id, 'nubbin_file_' + id)
    }
  }
};