const copyToClipboard = str => {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    const selected =
        document.getSelection().rangeCount > 0
            ? document.getSelection().getRangeAt(0)
            : false;
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    if (selected) {
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(selected);
    }
};

let russian = navigator.language.includes('ru');

async function updateResult(){
	let srcString = document.getElementById('password').value
		+ document.getElementById('site-string').value
		+ document.getElementById('login-string').value;
	let resultString = generatePassword(srcString, 0);
	let result = document.getElementById('result');
	result.value = resultString;
	if (copyResultToClipboard) {
        copyToClipboard(resultString);
    }
}

function localize() {
    document.querySelectorAll("span").forEach(function (node) {
        if (!node.hasAttribute('lang'))
            return;
        let langAttribute = node.getAttribute('lang');
        if ((langAttribute === 'ru') !== russian)
            node.style.display = 'none';
     });
}

localize();

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

function toggleSettings() {
    let settingsElement = document.getElementById("settings");
    settingsElement.hidden ^= true;
    let toggleSettingsElement = document.getElementById("toggle-settings");
    let result = "";
    if (settingsElement.hidden) {
        result = russian ? "Показать настройки" : "Show settings";
    } else {
        result = russian ? "Скрыть настройки" : "Hide settings";
    }
    toggleSettingsElement.innerText = result;
}

function logTabs(tabs) {
    let tab = tabs[0]; // Safe to assume there will only be one result
    let hostname = tab.url.split('/')[2];
    let hostnameParts = hostname.split('.');
    let site = hostnameParts[hostnameParts.length - 2];
    if (site) {
        site += "." + hostnameParts[hostnameParts.length - 1];
    } else {
        site = hostnameParts[hostnameParts.length - 1];
    }
    document.getElementById('site-string').value = site;
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

document.getElementById('password').select();

function loadPreference(prefName, callback) {
    let callbackWrap = v => {
        callback(v[prefName]);
    };
    if (typeof browser !== "undefined") {
        browser.storage.local.get(prefName).then(callbackWrap);
    } else {
        chrome.storage.local.get(prefName, callbackWrap);
    }
}

function storePreference(obj) {
    let browserApi = chrome || browser;
    browserApi.storage.local.set(Object.fromEntries(obj));
}

function initAbstractCheck(id, prefName, setPref, setCheck, isCheck, eventType) {
    let elem = document.getElementById(id);
    loadPreference(prefName, enabled => {
        if (enabled != null) {
            setPref(enabled);
            setCheck(elem, enabled);
        }
    });
    elem.addEventListener(eventType, function () {
        let enabled = isCheck(this);
        storePreference([[prefName, enabled]]);
        setPref(enabled);
    });
}

function initCheck(id, prefName, setPref) {
    initAbstractCheck(id, prefName, setPref, (elem, enabled) => elem.checked = enabled, elem => elem.checked, 'change')
}

function initSymbolCheck(id, symbolName) {
    initCheck(id, symbolName, (v) => {
        symbolClassMap[symbolName].selected = v;
        if (typeof symbolCountChanged !== "undefined") {
            symbolCountChanged(getSelectedSymbolClassCount());
        }
    });
}
initSymbolCheck('check-lowercase', 'lowercase');
initSymbolCheck('check-uppercase', 'uppercase');
initSymbolCheck('check-digit', 'digit');
initSymbolCheck('check-special-symbol', 'special-symbol');

function getEyeIcon(show)
{
    let browserApi = chrome || browser;
    let imgUrl = browserApi.extension.getURL("icons/" +  (show ? "show-password-icon.png" : "hide-password-icon.png"));
	let elem = document.createElement("img");
	elem.classList.add("eye-icon");
	elem.setAttribute("src", imgUrl);
    return elem;
}

function initHideButton(id, prefName, defaultState) {
    let setPref = function (enabled) {
        let elem = document.getElementById(id);
        elem.classList.remove(enabled ? "eye-hide" : "eye-show");
        elem.classList.add(enabled ? "eye-show" : "eye-hide");
        let targetInput = document.getElementById(elem.getAttribute("for"));
        targetInput.type = enabled ? "password" : "text";
        while (elem.firstChild) {
           elem.removeChild(elem.firstChild);
        }
        elem.appendChild(getEyeIcon(enabled));
    };
    setPref(defaultState);
    let isChecked = e => e.classList.contains("eye-hide");
    initAbstractCheck(id, prefName, setPref, () => {}, isChecked, 'click')
}

initHideButton("toggle-main-password", "hide-main-password", true);
initHideButton("toggle-site", "hide-site", false);
initHideButton("toggle-login", "hide-login", false);
initHideButton("toggle-result", "hide-result", false);

document.getElementById("toggle-settings").addEventListener("click", (e) => {
    let elem = document.getElementById("toggle-settings");
    if(elem.classList.contains("open-settings")) {
        toggleSettings();
        e.target.classList.remove("open-settings");
        e.target.classList.add("close-settings");
    } else if(elem.classList.contains("close-settings")) {
        toggleSettings();
        e.target.classList.remove("close-settings");
        e.target.classList.add("open-settings");
    }
});

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("ok")) {
        updateResult();
    }
});

function syncInput(srcId, destId, eventType, additionalCallback) {
    let srcElement = document.getElementById(srcId);
    srcElement.addEventListener(eventType, function () {
        let destElement = document.getElementById(destId);
        if (srcElement.validity.valid) {
            destElement.value = srcElement.value;
            additionalCallback(srcElement.value);
        }
    });
}

let passwordLengthChanged = v => {
    storePreference([["password-length", v]]);
    passwordLength = v;
};
syncInput("password-length-slider", "password-length-number", "change", passwordLengthChanged);
syncInput("password-length-slider", "password-length-number", "input", passwordLengthChanged);
syncInput("password-length-number", "password-length-slider", "input", passwordLengthChanged);

loadPreference("password-length", l => {
    if (l !== undefined) {
        document.getElementById("password-length-slider").value = l;
        document.getElementById("password-length-number").value = l;
        passwordLength = l;
    }
});

function setMin(min) {
    let slider = document.getElementById("password-length-slider");
    let number = document.getElementById("password-length-number");
    slider.min = min;
    number.min = min;
    if (passwordLength < min) {
        passwordLengthChanged(min);
        slider.value = min;
        number.value = min;
    }
}

setMin(getSelectedSymbolClassCount());

function symbolCountChanged(count) {
    setMin(count);
}

loadPreference("algorithm-name", v => {
    if (v !== undefined) algorithmName = v;
    for (let option of document.getElementById("hash-algorithm").options) {
        option.selected = option.value === algorithmName;
    }
    document.getElementById("hash-algorithm").addEventListener("change", v => {
        algorithmName = v.target.selectedOptions[0].value;
        storePreference([["algorithm-name", algorithmName]]);
    });
});

let savePassword = false;

loadPreference("main-password", p => {if (p) document.getElementById("password").value = p; } )

initCheck("check-save-password", "save-password", (v) => {
    savePassword = v;
    let mainPassword = savePassword ? document.getElementById("password").value : "";
    storePreference([["main-password", mainPassword]]);
});
document.getElementById("password").addEventListener("keyup", _ => {
    loadPreference("save-password", save => {
        if (save) {
            storePreference([["main-password", document.getElementById("password").value]]);
        }
    });
});

let copyResultToClipboard = false;

initCheck("check-copy-to-clipboard", "copy-to-clipboard", (v) => copyResultToClipboard = v);

