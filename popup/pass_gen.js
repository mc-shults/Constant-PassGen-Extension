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
        updateResult();
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

function syncInput(sliderId, valueId, eventType) {
    let sliderElement = document.getElementById(sliderId);
    sliderElement.addEventListener(eventType, function () {
        let valueElement = document.getElementById(valueId);
        valueElement.value = sliderElement.value;
    });
}

syncInput("slider-range", "slider-number", "change");
syncInput("slider-range", "slider-number", "input");
syncInput("slider-number", "slider-range", "input");