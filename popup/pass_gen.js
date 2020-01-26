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

const algorithmName = 'SHA3-256';
const passwordLength = 4;
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

async function generatePassword(srcString, iteration) {
	console.log(iteration);
	console.log(srcString);
	if (iteration > 1024) {
		return "";
	}
	for (let key in symbolClassMap) {
		symbolClassMap[key].used = false;
	}
	let hexedArray = await algorithms[algorithmName](srcString);
	let resultString = "";
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
		console.log(resultString);
		return generatePassword(srcString + hexedArray.reduce((accum, val) => accum + ("00" + val.toString(16)).slice(-2) ,""), iteration+1)
	}
}

async function updateResult(){
	let srcString = document.getElementById('password').value
		+ document.getElementById('site-string').value
		+ document.getElementById('login-string').value;
	let resultString = await generatePassword(srcString, 0);
	let result = document.getElementById('result');
	result.value = resultString;
}

function selectResult () {
    let result = document.getElementById('result');
    result.select();
    document.execCommand("copy");
}

dataChanged = function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
		updateResult().then(() => {
            selectResult ()
        });
    }
};

document.getElementById('password').addEventListener("keyup", dataChanged);
document.getElementById('site-string').addEventListener("keyup", dataChanged);
document.getElementById('login-string').addEventListener("keyup", dataChanged);

function showSettings() {
    let settingsElement = document.getElementById("settings");
    settingsElement.hidden = false;
    let toggleSettingsElement = document.getElementById("toggle-settings");
    toggleSettingsElement.innerHTML = "Hide";
}

function hideSettings() {
    let settingsElement = document.getElementById("settings");
    settingsElement.hidden = true;
    let toggleSettingsElement = document.getElementById("toggle-settings");
    toggleSettingsElement.innerHTML = "Show settings";
}

function logTabs(tabs) {
    let tab = tabs[0]; // Safe to assume there will only be one result
    let hostname = tab.url.split('/')[2];
    let hostnameParts = hostname.split('.');
    document.getElementById('site-string').value = hostnameParts[hostnameParts.length - 2] + "." + hostnameParts[hostnameParts.length - 1];
}
function onError(err){
    document.getElementById('site-string').value = err;
}

if (chrome) {
  chrome.tabs.query(
    {active: true, lastFocusedWindow: true},
    (arrayOfTabs) => {
        logTabs(arrayOfTabs);
    }
  );
} else {
  browser.tabs.query({currentWindow: true, active: true}).then(logTabs, onError);
}

var browserAPI = chrome || browser;
document.getElementById('password').select();

function initAbstractCheck(id, prefName, setPref, setCheck, isCheck, eventType) {
    let elem = document.getElementById(id);
    if (chrome) {
        chrome.storage.local.get(prefName, v => {
            if (v.hasOwnProperty(prefName)) {
                let enabled = v[prefName];
                setPref(enabled);
                setCheck(elem, enabled);
            }
        });
    } else {
        browser.storage.local.get(prefName).then(v => {
            if (v.hasOwnProperty(prefName)) {
                let enabled = v[prefName];
                setPref(enabled);
                setCheck(elem, enabled);
            }
        });
    }
    elem.addEventListener(eventType, function () {
        let enabled = isCheck(this);
        if (chrome) {
            chrome.storage.local.set(Object.fromEntries([[prefName, enabled]]));
        } else {
            browser.storage.local.set(Object.fromEntries([[prefName, enabled]]));
        }
        setPref(enabled);
    });
}

function initCheck(id, prefName, setPref) {
    initAbstractCheck(id, prefName, setPref, (elem, enabled) => elem.checked = enabled, elem => elem.checked, 'change')
}
function initSymbolCheck(id, symbolName) {
    initCheck(id, symbolName, (v) => {symbolClassMap[symbolName].selected = v;});
}
initSymbolCheck('check-lowercase', 'lowercase');
initSymbolCheck('check-uppercase', 'uppercase');
initSymbolCheck('check-digit', 'digit');
initSymbolCheck('check-special-symbol', 'special-symbol');

function initHideButton(id, prefName) {
    let setPref = function (enabled) {
        let elem = document.getElementById(id);
        elem.classList.remove(enabled ? "eye-hide" : "eye-show");
        elem.classList.add(enabled ? "eye-show" : "eye-hide");
        let targetInput = document.getElementById(elem.getAttribute("for"));
        targetInput.type = enabled ? "text" : "password";
        elem.innerHTML = enabled ? "Hide" : "Show";
    };
    let isChecked = e => e.classList.contains("eye-hide");
    initAbstractCheck(id, prefName, setPref, () => {}, isChecked, 'click')
}

initHideButton("toggle-site", "hide-site");
initHideButton("toggle-login", "hide-login");
initHideButton("toggle-result", "hide-result");

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("ok")) {
        calculate();
    } else if(e.target.classList.contains("open-settings")) {
        showSettings();
        e.target.classList.remove("open-settings");
        e.target.classList.add("close-settings");
    } else if(e.target.classList.contains("close-settings")) {
        hideSettings();
        e.target.classList.remove("close-settings");
        e.target.classList.add("open-settings");
    }
});

function initSlider(sliderId, valueId, eventType) {
    let sliderElement = document.getElementById(sliderId);
    sliderElement.addEventListener(eventType, function () {
        let valueElement = document.getElementById(valueId);
        valueElement.innerHTML = sliderElement.value;
    });
}

function initSliderLabel(valueId, sliderId, eventType) {
	let valueElement = document.getElementById(valueId);
    valueElement.addEventListener(eventType, function () {
		let sliderElement = document.getElementById(sliderId);
        sliderElement.value = valueElement.value;
    });
}

initSlider("slider-range", "slider-number", "change");
initSlider("slider-range", "slider-number", "input");

initSliderLabel("slider-number", "slider-range", "input");