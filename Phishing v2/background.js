const delta = 0.4; // коэффициент точности для нечеткого поиска
fuse_list = [];
const fuse_options = {
  includeScore: true,
  minMatchCharLength: 2
};

var storage = chrome.storage.local; // Доступ к локальному хранилищу
var fishing = [];					// Массив фишинговых сайтов
var good_site = [];					// Массив сайтов финансовых организаций

chrome.runtime.onInstalled.addListener(details => {
	if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
		console.log("Установлен");

		// Создаем экземпляр класса XMLHttpRequest
		const request = new XMLHttpRequest();

		// Указываем путь до файла на сервере, который будет обрабатывать наш запрос 
		const url = "http://arctic-buoy-school2072.ru/fishing/get_storage.php";
		 
		// Так же как и в GET составляем строку с данными, но уже без пути к файлу 
		const params = "";
		 
		/* Указываем что соединение	у нас будет POST, говорим что путь к файлу в переменной url, и что запрос у нас
		асинхронный, по умолчанию так и есть не стоит его указывать, еще есть 4-й параметр пароль авторизации, но этот
			параметр тоже необязателен.*/ 
		request.open("POST", url, true);
		 
		//В заголовке говорим что тип передаваемых данных закодирован. 
		request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		request.responseType = 'json';
		request.addEventListener("readystatechange", () => {

			if(request.readyState === 4 && request.status === 200) {    
				// Данные от сервера получили
				console.log(request.response);				
				storage.set({'fishing': JSON.stringify(request.response.fishing)}, function() {
					// Notify that we saved.
					console.log('Settings  fishing saved');
				});
				storage.set({'good_site': JSON.stringify(request.response.good_site)}, function() {
					// Notify that we saved.
					console.log('Settings good_site saved');
				});
		}
		});
		//	Вот здесь мы и передаем строку с данными, которую формировали выше. И собственно выполняем запрос. 
		request.send(params);
	}
});
chrome.tabs.onUpdated.addListener(
  function(tabId, changeInfo, tab) {
    if (changeInfo.url) {
		console.log(changeInfo);
		const url = new URL(changeInfo.url);
		if((changeInfo.url.indexOf("chrome:") == -1) && (changeInfo.url.indexOf("chrome-extension:") == -1) && (changeInfo.url.indexOf("newtab") == -1))  {
			storage.set({'currentURL': changeInfo.url}, function() { // созраняем текущий url для страницы параметров
						console.log("Записал "+changeInfo.url);
			});
			storage.get('fishing', function(items) {
				if (items.fishing) {
				  fishing = JSON.parse(items.fishing);
				}
				else console.log("Нет fishing");
			});
			storage.get('good_site', function(items) {
				if (items.good_site) {
					good_site = JSON.parse(items.good_site);
					console.log(good_site);				
					if(fuse_list.length == 0) {
						fuse_list = good_site;
					}
				}	
				else console.log("Нет good_site");
			});	
	//	Проверка на фишинг - здесь
	//	1-й этап: проверяем наличие Url в списке фишинговых сайтов
			for(i=0; i < fishing.length; i++) {
				if(fishing[i].site == changeInfo.url) { // страница находится в списке фишинговых сайтов - показываем уведомление
					storage.set({'fishinMSG': "<p style='color: red;'>Страница в списке фишинговых сайтов!</p>"}, function() { }); // созраняем сообщение для popup окна 
					Alert_message("Страница в списке фишинговых сайтов!");
					console.log("Страница в списке фишинговых сайтов!!!");
					break;
				}
			}
	// 2-й этап: проверяем "похожесть" URL со списком хороших сайтов с использованием библиотеки нечеткого поиска Fuse.js
			fuse_list = good_site;
			const fuse = new Fuse(fuse_list, fuse_options);		
			const result = fuse.search(String(url.hostname));
			console.log("result ");
			console.log(result);
			subdomains = url.hostname.split('.');
			top_domain = subdomains[subdomains.length-2] + '.' + subdomains[subdomains.length-1];
			console.log(top_domain);
			if(result.length != 0) {
				if(top_domain != result[0].item && result[0].score <= delta) { // проверяем не является ли URL настоящим сайтом и не "похож" ли он на настоящий сайт
					storage.set({'fishinMSG': "<p style='color: red;'>Фишинг сайта "+result[0].item+" с вероятностью "+Math.floor((1-result[0].score)*100)+"%!</p>"}, function() { });// созраняем сообщение для popup окна 
					Alert_message("Фишинг сайта "+result[0].item+"!"); // передаем сообщение в popup окно
					console.log("Фишинг сайта "+result[0].item+"!");
				}
			}
		}
    }
  }
);
function Alert_message(msg) {
	chrome.tabs.query({active:true,currentWindow:true},function(tabs){
		//Get the popup for the current tab
		chrome.browserAction.getPopup({tabId:tabs[0].id},function(popupFile){
			if(popupFile){
				openPopup(tabs[0],popupFile);
			} else {
				//There is no popup defined, so we do what is supposed to be done for
				//  the browserAction button.
				doActionButton(tabs[0]);
			}
		});
	});
}
// Открытие popup окна при сообщении об опасном сайте
var popupWindowId = false;
var lastFocusedWin;
var lastActiveTab;
function openPopup(tab,popupFile){
    chrome.windows.getLastFocused(function(win){
        lastFocusedWin=win;
        if(popupWindowId === false){
            //This prevents user from pressing the button quickly multiple times in a row.
            popupWindowId = true;
            lastActiveTab = tab;
            chrome.windows.create({ 
                url: popupFile, 
                type: 'popup',
            },function(win){
                popupWindowId = win.id;
                waitForWindowId(popupWindowId,50,20,actOnPopupViewFound,do2ndWaitForWinId);
            });
            return;
        }else if(typeof popupWindowId === 'number'){
            closePopup();
        }
    });
}

function closePopup(){
    if(typeof popupWindowId === 'number'){
        chrome.windows.remove(popupWindowId,function(){
            popupWindowId = false;
        });
    }
}

chrome.windows.onRemoved.addListener(function(winId){
    if(popupWindowId === winId){
        popupWindowId = false;
    }
});

chrome.windows.onFocusChanged.addListener(function(winId){
    //If the focus is no longer the popup, then close the popup.
    if(typeof popupWindowId === 'number'){
        if(popupWindowId !== winId){
            closePopup();
        }
    } else if(popupWindowId){
    }
});

function actOnPopupViewFound(view){
    //Make tabs.query act as if the panel is a popup.
    if(typeof view.chrome === 'object'){
        view.chrome.tabs.query = fakeTabsQuery;
    }
    if(typeof view.browser === 'object'){
        view.browser.tabs.query = fakeTabsQuery;
    }
    view.document.addEventListener('DOMContentLoaded',function(ev){
        let boundRec = view.document.body.getBoundingClientRect();
        updatePopupWindow({
            width:boundRec.width + 10,
            height:boundRec.height + 10
        });
    });
    updatePopupWindow({});
}

function updatePopupWindow(opt){
    let width,height;
    if(opt){
        width =typeof opt.width  === 'number'?opt.width :300;
        height=typeof opt.height === 'number'?opt.height:300;
    }
    let left = lastFocusedWin.left + lastFocusedWin.width - (width +40);
    let top = lastFocusedWin.top + 85; //Just a value that works in the default case.
    let updateInfo = {
        width:width,
        height:height,
        top:top,
        left:left
    };
    chrome.windows.update(popupWindowId,updateInfo);
}

function waitForWindowId(id,delay,maxTries,foundCallback,notFoundCallback) {
    if(maxTries--<=0){
        if(typeof notFoundCallback === 'function'){
            notFoundCallback(id,foundCallback);
        }
        return;
    }
    let views = chrome.extension.getViews({windowId:id});
    if(views.length > 0){
        if(typeof foundCallback === 'function'){
            foundCallback(views[0]);
        }
    } else {
        setTimeout(waitForWindowId,delay,id,delay,maxTries,foundCallback,notFoundCallback);
    }
}

function do2ndWaitForWinId(winId,foundCallback){
    waitForWindowId(winId,500,40,foundCallback,windowViewNotFound);
}

function windowViewNotFound(winId,foundCallback){
}

function fakeTabsQuery(options,callback){
    let origCallback = callback;
    function stripPopupWinFromResponse(tabs){
        return tabs.filter(tab=>{
            return tab.windowId !== popupWindowId;
        });
    }
    function stripPopupWinFromResponseIfMultiple(tabs){
        if(tabs.length>1){
            return stripPopupWinFromResponse(tabs);
        }else{
            return tabs;
        }
    }
    function callbackWithStrippedTabs(tabs){
        origCallback(stripPopupWinFromResponseIfMultiple(tabs));
    }
    if(options.currentWindow || options.lastFocusedWindow){
        delete options.currentWindow;
        delete options.lastFocusedWindow;
        options.windowId = lastActiveTab.windowId;
    }
    if(typeof callback === 'function') {
        callback = callbackWithStrippedTabs;
        chrome.tabs.query.apply(this,arguments);
        return;
    }else{
        return browser.tabs.query.apply(this,arguments)
                                 .then(stripPopupWinFromResponseIfMultiple);
    }
}