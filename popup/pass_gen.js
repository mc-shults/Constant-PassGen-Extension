function parseHexString(str) { 
    var result = [];
    while (str.length >= 2) { 
        result.push(parseInt(str.substring(0, 2), 16));

        str = str.substring(2, str.length);
    }

    return result;
}

var letter_count = 'z'.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
function getChar(value)
{
	var index = value % (letter_count + 10)
	if(index < letter_count){
		return String.fromCharCode('a'.charCodeAt(0) + index);
	} 
	else {
		return String.fromCharCode('0'.charCodeAt(0) + index - letter_count);
	}
}

function calculate(){
	var srcString = document.getElementById('password').value + document.getElementById('srcString').value;
	
	var hexedArray = parseHexString(sha3_256(srcString));
	var resultString = "";
	for(var i = 0; i < 8; i++){
		resultString += getChar(hexedArray[i]);
	}
	var result = document.getElementById('result');
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
	var hostname = tab.url.split('/')[2];
    var hostnameParts = hostname.split('.')
	document.getElementById('srcString').value = hostnameParts[hostnameParts.length - 2] + "." + hostnameParts[hostnameParts.length - 1];
}

function onError(err){
    document.getElementById('srcString').value = err;
}

browser.tabs.query({currentWindow: true, active: true}).then(logTabs, onError);
document.getElementById('password').select();