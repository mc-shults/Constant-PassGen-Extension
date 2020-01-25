function parseHexString(str) { 
    let result = [];
    while (str.length >= 2) { 
        result.push(parseInt(str.substring(0, 2), 16));

        str = str.substring(2, str.length);
    }

    return result;
}

//#region SymbolClasses

let lowercaseClass = {
	size : 'z'.charCodeAt(0) - 'a'.charCodeAt(0) + 1,
	getSymbol(index) {
		return String.fromCharCode('a'.charCodeAt(0) + index);
	}
};

let uppercaseClass = {
	size : 'Z'.charCodeAt(0) - 'A'.charCodeAt(0) + 1,
	getSymbol(index) {
		return String.fromCharCode('A'.charCodeAt(0) + index);
	}
};

let digitClass = {
	size : '9'.charCodeAt(0) - '0'.charCodeAt(0) + 1,
	getSymbol(index) {
		return String.fromCharCode('0'.charCodeAt(0) + index);
	}
};

let specSymbols = ['!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',',
	'-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '`', '{', '|',
	'}', '~'];
let specialSymbolClass = {
	size : specSymbols.length,
	getSymbol(index) {
		return specSymbols[index];
	}
};

//#endregion SymbolClasses

let symbolClasses = [lowercaseClass, digitClass];
function getChar(value) {
	console.log(value + '\n');
	let currentIndex = value;
	if (currentIndex < 0){
		return "?";
	}
	while (true) {
		for (let symbolClass of symbolClasses){
			if (currentIndex < symbolClass.size) {
				console.log('-----\n');
				return symbolClass.getSymbol(currentIndex)
			} else {
				currentIndex -= symbolClass.size
			}
			console.log(currentIndex + ' ananas \n')
		}
	}
}

function calculate(){
	let srcString = document.getElementById('password').value + document.getElementById('srcString').value;

	let hexedArray = parseHexString(sha3_256(srcString));
	let resultString = "";
	for(let i = 0; i < 8; i++){
		resultString += getChar(hexedArray[i]);
	}
	let result = document.getElementById('result');
	result.value = resultString;
	result.select();
	document.execCommand("copy");
	if(document.getElementById('hideResult').checked){
		result.value = "copied";
	}
}

document.getElementById('password').addEventListener("keyup", function(event) {
  event.preventDefault();
  if (event.keyCode === 13) {
    calculate();
  }
});

document.getElementById('srcString').addEventListener("keyup", function(event) {
  event.preventDefault();
  if (event.keyCode === 13) {
    calculate();
  }
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("ok")) {
	calculate();
  }
});

function logTabs(tabs) {
    let tab = tabs[0]; // Safe to assume there will only be one result
	let hostname = tab.url.split('/')[2];
	let hostnameParts = hostname.split('.');
	document.getElementById('srcString').value = hostnameParts[hostnameParts.length - 2] + "." + hostnameParts[hostnameParts.length - 1];
}

function onError(err){
    document.getElementById('srcString').value = err;
}

browser.tabs.query({currentWindow: true, active: true}).then(logTabs, onError);
document.getElementById('password').select();