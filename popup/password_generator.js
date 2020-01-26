//#region SymbolClasses

let specSymbols = ['!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',',
    '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '`', '{', '|',
    '}', '~'];

let symbolClassMap = {
    'lowercase': {
        size: 'z'.charCodeAt(0) - 'a'.charCodeAt(0) + 1,
        selected: true,
        used: false,
        getSymbol(index) {
            return String.fromCharCode('a'.charCodeAt(0) + index);
        }
    },
    'uppercase': {
        size : 'Z'.charCodeAt(0) - 'A'.charCodeAt(0) + 1,
        selected: false,
        used: false,
        getSymbol(index) {
            return String.fromCharCode('A'.charCodeAt(0) + index);
        }
    },
    'digit': {
        size : '9'.charCodeAt(0) - '0'.charCodeAt(0) + 1,
        selected: true,
        used: false,
        getSymbol(index) {
            return String.fromCharCode('0'.charCodeAt(0) + index);
        }
    },
    'special-symbol': {
        size : specSymbols.length,
        selected: false,
        used: false,
        getSymbol(index) {
            return specSymbols[index];
        }
    }
};

//#endregion SymbolClasses

//#region Algorithms

function parseHexString(str) {
    let result = [];
    while (str.length >= 2) {
        result.push(parseInt(str.substring(0, 2), 16));
        str = str.substring(2, str.length);
    }
    return result;
}

async function digest(str, algorithm) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    return Array.from(new Uint8Array(hashBuffer));
}

let algorithms = {
    "SHA3-256" : async function (str) {
        return parseHexString(sha3_256(str));
    },
    "SHA-256" : async function (str) {
        return await digest(str, 'SHA-256');
    },
    "SHA-512" : async function (str) {
        return await digest(str, 'SHA-512');
    },
    "SHA-1" : async function (str) {
        return await digest(str, 'SHA-1');
    },
    "MD5" : async function (str) {
        return parseHexString(md5(str));
    },
};

//#endregion Algorithms

let algorithmName = 'SHA3-256';
let passwordLength = 8;
function getChar(value) {
    let currentIndex = value;
    if (currentIndex < 0){
        return "?";
    }
    for (let i = 0; i < 255; i++) {
        for (let symbolClassPair of Object.entries(symbolClassMap)){
            let symbolClass = symbolClassPair[1];
            if (!symbolClass.selected) {
                continue;
            }
            if (currentIndex < symbolClass.size) {
                symbolClassMap[symbolClassPair[0]].used = true;
                return symbolClass.getSymbol(currentIndex)
            } else {
                currentIndex -= symbolClass.size
            }
        }
    }
}

function getSelectedSymbolClassCount() {
    return Object.values(symbolClassMap).filter(x => x.selected).length;
}

async function generatePassword(srcString, iteration) {
    if (iteration > 1024) {
        return "";
    }
    for (let key in symbolClassMap) {
        symbolClassMap[key].used = false;
    }
    let hexedArray = await algorithms[algorithmName](srcString);
    let resultString = "";
    if (passwordLength === 0 || getSelectedSymbolClassCount() === 0) {
        return "";
    }
    for(let i = 0; i < passwordLength; i++){
        resultString += getChar(hexedArray[i]);
    }
    let allUsed = true;
    for (let key in symbolClassMap) {
        allUsed &= !symbolClassMap[key].selected || symbolClassMap[key].used;
    }
    if (allUsed) {
        return resultString;
    } else {
        return generatePassword(srcString + hexedArray.reduce((accum, val) => accum + ("00" + val.toString(16)).slice(-2) ,""), iteration+1)
    }
}