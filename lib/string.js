var charsets = {
    none : {
        name : 'none',
        containsChar : function(c) {
            return false;
        }
    },
    us_ascii : {
        name : 'US-ASCII',
        containsChar : function(c) {
            return c.charCodeAt(0) < 128;
        }
    },
    iso_8859_1 : {
        name : 'ISO-8859-1',
        containsChar : function(c) {
            return c.charCodeAt(0) < 256;
        }
    },
    utf_8 : {
        name : 'UTF-8',
        containsChar : function(c) {
            return true;
        }
    }
}

var encodings = {
    base64 : {
        printable : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
        supportsNone : false,
        encode : function(input, charset) {
            input = encodings.none.encode(input, charset);

            if (typeof btoa == 'function') {
                var s = btoa(input);
                var output = new Array(Math.ceil(s.length / 76));
                for (var p = 0, k = 0; p < s.length; p += 76) {
                    output[k++] = s.substr(p, 76);
                }
                return output.join('\n');
            }
            var iterations = Math.ceil(input.length * 4 / 3);
            var output = new Array(iterations + Math.ceil(iterations / 76) + 1);
            input += '\0';
            var j = 8, b = input.charCodeAt(0), p = 0, k = 0;
            for (var i = 0; i < iterations; i++) {
                if (j < 6) {
                    b = (input.charCodeAt(p) << 8) + input.charCodeAt(p + 1);
                    p++;
                    j += 2;
                } else {
                    j -= 6;
                }
                output[k++] = this.printable.substr((b >> j) & 0x3F, 1);
                if (i % 76 == 75) {
                    output[k++] = '\n';
                }
            }
            output[k++] = '=='.substr((1 + input.length) % 3);
            return output.join('');
        },
        decode : function(input, charset) {
            var equalCount = input.length - input.search(/={0,2}$/);
            input = input.replace(/(\s|={1,2}$)/g, '');
            var iterations = Math.floor(input.length * 3 / 4);
            var output = new Array(iterations);
            input += '\0';
            var j = 2, d = '', p = 0, k = 0;
            for (var i = 0; i < iterations; i++) {
                var b = (this.printable.indexOf(input.charAt(p)) << j) + 
                        (this.printable.indexOf(input.charAt(p + 1)) >> (6 - j));
                output[k++] = String.fromCharCode(b & 0xFF);
                j = j % 6 + 2;
                p += (j == 2 ? 2 : 1);
            }
            // TODO: Detect invalid chars.
            // Look for trailing non-zero bits.
            if ((this.printable.indexOf(input.charAt(p)) << j) & 0xFF) {
              return 'invalid input';
            }
            var expectedEqualCount = (3 - (iterations % 3)) % 3;
            if (equalCount != expectedEqualCount) {
                return 'invalid input (' + expectedEqualCount + ' trailing "=" expected)';
            }
            return encodings.none.decode(output.join(''), charset);
        }
    },
    xml : {
        supportsNone : true,
        encode : function(input, charset) {
            var output = '';
            for (var i = 0; i < input.length; i++) {
                var j = '<>"&\''.indexOf(input.charAt(i));
                if (j != -1) {
                    output += '&' + ['lt', 'gt', 'quot', 'amp', '#39'][j] + ';';
                } else if (!charset.containsChar(input.charAt(i))) {
                    output += '&#' + input.charCodeAt(i) + ';';
                } else {
                    output += input.charAt(i);
                }
            }
            return output;
        },
        decode : function(input, charset) {
            return $('<pre>' + input.replace(/</g, '&lt;') + '</pre>').text();
        }
    },
    url : {
        supportsNone : true,
        encode : function(input, charset) {
            return charset.name == 'UTF-8' ? encodeURIComponent(input) : escape(input).replace(/\+/g, '%2B');
        },
        decode : function(input, charset) {
            input = input.replace(/\+/g, ' ');
            return charset.name == 'UTF-8' ? decodeURIComponent(input) : unescape(input);
        }
    },
    js : {
        supportsNone : true,
        encode : function(input, charset) {
            var output = '';
            for (var i = 0; i < input.length; i++) {
                var j = '\b\t\n\v\f\r"\'\\'.indexOf(input.charAt(i));
                if (j != -1) {
                    output += '\\' + 'btnvfr"\'\\'.substr(j, 1);
                } else if (input.substr(i, 2) == '</') {
                    output += '<\\/';
                    i++;
                } else if (!charset.containsChar(input.charAt(i))) {
                    if (input.charCodeAt(i) > 255) {
                        output += '\\u' + ('000' + input.charCodeAt(i).toString(16)).slice(-4);
                    } else {
                        output += '\\x' + ('0' + input.charCodeAt(i).toString(16)).slice(-2);
                    }
                } else {
                    output += input.charAt(i);
                }
            }
            return output;
        },
        decode : function(input, charset) {
            try {
                return !/([^\\]'|\r|\n)/.test(input)? eval("'" + input + "'") : false;
            } catch(e) {
                return false;
            }
        }
    },
    none : {
        supportsNone : false,
        encode : function(input, charset) {
            var output = [];
            if (charset.name == 'UTF-8') {
                var bytes = string2utf8bytearray(input);
                for (var i = 0; i < bytes.length; i++) {
                    output.push(String.fromCharCode(bytes[i]));
                }   
                return output.join('');
            } else {
                return input.replace(/[^\x00-\xFF]/, '?');
            }
        },
        decode : function(input, charset) {
            if (charset.name != 'UTF-8') {
                return input;
            }
            var output = [];
            for (var i = 0; i < input.length; i++) {
                var c = input.charCodeAt(i);
                if (c <= 0x7F) {
                    output.push(input.substr(i, 1));
                } else if (0xC0 <= c && c <= 0xDF) {
                    var c2 = input.charCodeAt(++i);
                    if (0x80 <= c2 && c2 <= 0xBF) {
                        var o = ((c & 0x1F) << 6) + (c2 & 0x3F);
                        output.push(String.fromCharCode(o));
                    } else {
                        return 'invalid input';
                    }
                } else if (0xE0 <= c && c <= 0xEF) {
                    var c2 = input.charCodeAt(++i);
                    var c3 = input.charCodeAt(++i);
                    if (0x80 <= c2 && c2 <= 0xBF &&
                        0x80 <= c3 && c3 <= 0xBF) {
                        var o = ((c & 0xF) << 12) + ((c2 & 0x3F) << 6) + (c3 & 0x3F);
                        output.push(String.fromCharCode(o));
                    } else {
                        return 'invalid input';
                    }
                    
                } else if (0xE0 <= c && c <= 0xEF) {
                    var c2 = input.charCodeAt(++i);
                    var c3 = input.charCodeAt(++i);
                    var c4 = input.charCodeAt(++i);
                    if (0x80 <= c2 && c2 <= 0xBF &&
                        0x80 <= c3 && c3 <= 0xBF &&
                        0x80 <= c4 && c4 <= 0xBF) {
                        var o = ((c & 7) << 18) + ((c2 & 0x3F) << 12) + ((c2 & 0x3F) << 6) + (c4 & 0x3F);
                        output.push(String.fromCharCode(o));
                    } else {
                        return 'invalid input';
                    }
                    
                } else {
                    return 'invalid input';
                }
            }
            return output.join('');
        }
    }
}

function string2utf8bytearray(s) {
    // We need to allocate at least one byte per character.
    var output = new Array(s.length);
    for (var i = 0, j = 0; i < s.length; i++) {
        var c = s.charCodeAt(i);
        if (c < 0x7F) {
            output[j++] = c;
        } else if (c < 0x7FF) {
            output[j++] = 0xC0 + (c >> 6);
            output[j++] = 0x80 + (c & 0x3F);
        } else if (c < 0xFFFF) {
            output[j++] = 0xE0 + (c >> 12);
            output[j++] = 0x80 + ((c >> 6) & 0x3F);
            output[j++] = 0x80 + (c & 0x3F);
        } else if (c < 0x10FFFF) {
            output[j++] = 0xF0 + (c >> 18);
            output[j++] = 0x80 + ((c >> 6) & 0x3F);
            output[j++] = 0x80 + ((c >> 12) & 0x3F);;
            output[j++] = 0x80 + (c & 0x3F);
        }
    }
    return output;
}

