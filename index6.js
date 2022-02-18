var searchResult = {}; // render***Tableで見に行く。
//初期化処理を追加する　
gapi.load("client");
window.onload = function () {
    window.addEventListener("submit", logSubmit);
    loadClient();
}
const initParameters = {
    // apiKey: "AIzaSyDtT70Outy1V4K6MsM-LDRlqtviQFklMaA",
    apiKey: "AIzaSyAs7cCKR3Reh7zKzS-j-nwg_Q8b9K1SBFk",
    clientId: "150219509228-hlu6vu2bd5p1e3doakk9mu95i33soc7m.apps.googleusercontent.com",
    // cx: "765fc261f1bee4b14",
    cx: "b497084bae4e12abc"
}
//ダブルクォーテーションで囲まれていないと、エラーSyntaxError: Unexpected token o in JSON at position 1
//html部のコーディング
// function generate_table() {
//     // get the reference for the body
//     var body = document.getElementsByTagName("body")[0];
//     // creates a <table> element and a <tbody> element
//     var tbl = document.createElement("table");
//     var tblBody = document.createElement("tbody");
//     var tblBody = document.createElement("tbody");
//     // creating all cells
//     for (var i = 0; i < 2; i++) {
//         // creates a table row
//         var row = document.createElement("tr");
//         for (var j = 0; j < 2; j++) {
//             // Create a <td> element and a text node, make the text
//             // node the contents of the <td>, and put the <td> at
//             // the end of the table row
//             var cell = document.createElement("td");
//             var tdTitle = document.createElement('td');
//             var cellText = document.createTextNode("セルは " + i + " 行 " + j + " 列 です");
//             cell.appendChild(cellText);
//             row.appendChild(cell);
//         }
//         // add the row to the end of the table body
//         tblBody.appendChild(row);
//     }
//     // put the <tbody> in the <table>
//     tbl.appendChild(tblBody);
//     // appends <table> into <body>
//     body.appendChild(tbl);
//     // sets the border attribute of tbl to 2;
//     tbl.setAttribute("border", "2");
// }
function renderAbstractTable() {
    // 一覧表の表示処理
    // var items = apiJson.result.items;
    var body = document.getElementsByTagName("body")[0];
    // creates a <table> element and a <tbody> element
    var tbl = document.createElement("table");
    var tblBody = document.createElement("tbody");
    // creating all cells
    for (const [key, value] of Object.entries(searchResult)) {
        console.log(key, value);
        // creates a table row
        var row = document.createElement("tr");
        for (var j = 0; j < 1; j++) {
            var cell = document.createElement("td");
            var tdTitle = document.createElement('td');
            var tdTotalresults = document.createElement('td');
            // var cellText = document.createTextNode("セルは " + i + " 行 " + j + " 列 です");
            tdTitle.innerHTML = value.siteTitle
            tdTotalresults.innerHTML = value.items.length;
            row.appendChild(tdTitle);
            row.appendChild(tdTotalresults);
        }
        tblBody.appendChild(row);
    }
    tbl.appendChild(tblBody);
    body.appendChild(tbl);
}
function renderDetailTable() {
    // 詳細表の表示処理
    var body = document.getElementsByTagName("body")[0];
    // creates a <table> element and a <tbody> element
    var tbl = document.createElement("table");
    var tblBody = document.createElement("tbody");
    // creating all cells
    for (const [key, value] of Object.entries(searchResult)) {
        console.log(key, value);
        // creates a table row
        var row = document.createElement("tr");
        for (var j = 0; j < 1; j++) {
            // var cell = document.createElement("td");
            var DetailTitle = document.createElement('td');
            var DetailUrl = document.createElement('td');
            DetailTitle.innerHTML = value.siteTitle
            //value.itemsの個数分だけURLを表示する
            for (k = 0; k < value.items.length; k++) {
                DetailUrl.innerHTML = value.items[k].formattedUrl;

            }
            row.appendChild(DetailTitle);
            row.appendChild(DetailUrl);
        }
        tblBody.appendChild(row);
    }
    tbl.appendChild(tblBody);
    body.appendChild(tbl);
}

/**
 * 検索ボタン押下時に呼び出される。
 * GoogleCustomSearchAPIを叩き、処理結果を画面に描画。
 * */
async function logSubmit(event) {
    event.preventDefault();
    var searchString = document.getElementById('textBox1').value;
    var searchButton = document.getElementById('searchButton');
    searchButton.innerHTML = "検索中";
    searchButton.disabled = true;
    initTable();
    await getApiData(searchString);
    renderAbstractTable();
    renderDetailTable();
    searchButton.innerHTML = "Check!!";
    searchButton.disabled = false;
}
//検索件数が固定でない
//reloadすると429解除される件
async function getApiData(searchString) {
    var isError = false;
    var continueNext = false;
    var httpStatus = null;
    var searchResultNumber = 0;
    const wait = (waitSec) => {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, waitSec * 1000);
        });
    }
    for (let site of siteList) {
        var siteUrl = Object.values(site)[0];
        searchResult[siteUrl] = { siteTitle: Object.keys(site)[0], items: [] };
        searchString += " site:" + Object.values(site)[0];
        console.log(`初回データ取得開始 [url]=${siteUrl}`);
        await gapi.client.search.cse.list({
            cx: initParameters.cx,
            q: searchString,
            start: 1
        }).then(response => {
            if (response.result.items) {
                for (var item of response.result.items) {
                    searchResult[siteUrl].items.push(item);
                    console.log(item.title);
                }
            }
            searchResultNumber = response.result.searchInformation.totalResults;
            continueNext = searchResultNumber > 10;
            httpStatus = response.Status;
            console.log(`初回データ取得完了 [url]=${siteUrl}, [件数]=${searchResultNumber}`, response); //, [searchResult]=${JSON.stringify(searchResult)}`)
        }).catch(err => {
            console.error(`初回データ取得失敗 [url]=${siteUrl}`, err);
            isError = true;
        });
        await wait(1);
        if (continueNext) {
            for (let i = 1; i < Math.ceil(searchResultNumber / 10); i++) {
                await gapi.client.search.cse.list({
                    cx: initParameters.cx,
                    q: searchString,
                    start: 1 + i * 10
                }).then(response => {
                    console.log(`データ取得完了 [url]=${siteUrl}, [件数]=${1 + i * 10}/${searchResultNumber}`);// , [searchResult]=${JSON.stringify(searchResult)}`)
                    if (response.result.items) {
                        for (var item of response.result.items) {
                            console.log(item.title);
                            searchResult[siteUrl].items.push(item);
                        }
                    }
                    httpStatus = response.Status;
                }).catch(err => {
                    console.error(`データ取得失敗 [url]=${siteUrl}`, err);
                    isError = true;
                });
                if (isError || i == 9) {
                    break;
                }
                await wait(2);
            }
        }
        if (isError) {
            console.error("API取得エラー");
            searchResult = {};
            searchResult[siteUrl] = { siteTitle: Object.keys(site)[0], items: [] };
            var response = apiJson;
            for (var item of response.result.items) {
                searchResult[siteUrl].items.push(item);
            }
            break;
        }
    }
}
function initTable() {
    //更新処理を記載
    //行を消す
    var table = document.getElementById('data-table');
    var rowLen = table.rows.length;
    for (var i = rowLen - 1; i > 0; i--) {
        table.deleteRow(i);
    }
}
//gapi.client.load
//  site restrictedのリンク；https://www.googleapis.com/customsearch/v1/siterestrict?key=AIzaSyDtT70Outy1V4K6MsM-LDRlqtviQFklMaA&cx=b497084bae4e12abc:omuauf_lfve&q=lectures
// https://content.googleapis.com/discovery/v1/apis/customsearch/v1/rest
function loadClient() {
    gapi.client.setApiKey(initParameters.apiKey);
    return gapi.client.load(
        "customsearch", "v1"
    ).then(
        function (res) {
            console.log("GAPIクライアント初期化完了")
        },
        function (err) {
            console.log(err, "GAPIクライアント初期化失敗" + err.error.message)
        }
    )
}
const siteList = [
    { "＠Press": "https://www.atpress.ne.jp/" },
    { "PR TIMES": "https://prtimes.jp/" },
    { "時事ドットコムニュース": "https://www.jiji.com/" },
    { "電子決済マガジン": "https://epayments.jp/" },
    // { "FJFM": "linkなし" },
    // { "AMP News": "https://ampmedia.jp/category/news/" },
    // { "TechRepublic Japan": "https://www.techrepublic.com/" },
    // { "ITMediaビジネスオンライン": "https://www.itmedia.co.jp/" },
    // { "ASCII": "https://ascii.jp/" },
    // { "dmenuニュース": "http://topics.smt.docomo.ne.jp/" },
    // { "YahooニュースJapan": "https://news.yahoo.co.jp/" },
    // { "au one ニュース": "https://portal.auone.jp/" },
    // { "ナウティスニュース": "https://nowtice.net/news/" },
    // { "IT NEWS": "https://itnews.org/" },
    // { "BIGLOBEニュース": "https://www.biglobe.ne.jp/" },
    // { "Every Life": "http://everylifenews.com/" },
    // { "財経新聞": "http://www.zaikei.co.jp/" },
    // { "産経新聞": "https://www.sankei.com/" },
    // { "とれまがニュース": "https://news.toremaga.com/" },
    // { "iZa": "https://www.iza.ne.jp/" },
    // { "CNET Japan": "https://japan.cnet.com/" },
    // { "gooニュース": "https://news.goo.ne.jp/" },
    // { "business network.jp": "https://businessnetwork.jp/" },
    // { "News 24h": "http://www.news24.jp/" },
    // { "exciteニュース": "https://www.excite.co.jp/news/" },
    // { "Yahoo!JAPANニュース": "https://news.yahoo.co.jp/" },
    // { "週刊アスキー": "https://weekly.ascii.jp/" },
    // { "Impress Watch": "https://www.watch.impress.co.jp/" },
    // { "SAASINSIDER": "https://www.saasinsider.com/" },
    // { "dメニュー ニュース": "http://topics.smt.docomo.ne.jp/" },
    // { "LINEニュース": "http://news.line.me/" },
    // { "エンタメプラス": "https://entameplus.jp/" },
    // { "気になる車・バイクニュース": "https://goo.to/" },
    // { "NEWS Collect": "https://newscollect.jp/" },
    // { "Rakuten infoseek": "https://www.infoseek.co.jp/" },
    // { "IT Leaders": "https://it.impress.co.jp/" },
    // { "ITちゃんねる": "http://ititcha.dreamlog.jp/" },
    // { "Mapionニュース": "https://www.mapion.co.jp/news/" },
    // { "Yahoo JAPAN ニュース": "https://news.yahoo.co.jp/" },
    // { "Payment Navi": "https://paymentnavi.com/" },
    // { "IOT News": "https://iotnews.jp/" },
    // { "日経xTECH": "https://xtech.nikkei.com/" },
    // { "Itmedia NEWS": "https://www.itmedia.co.jp/news/" },
    // { "攻める総務byITmediaビジネス": "https://www.itmedia.co.jp/business/subtop/soumu/" },
    // { "ItmediaビジネスONLINE": "https://www.itmedia.co.jp/business/" },
    // { "Press Cube": "https://www.presscube.jp/" },
    // { "Rakuten Infoseek News": "https://www.infoseek.co.jp/" },
    // { "WORKPORTplus": "http://www.workport.co.jp/plus/" },
    // { "MdN DESIGN INTERACTIVE": "https://www.mdn.co.jp/" },
    // { "SankeiBiz": "https://www.sankeibiz.jp/" },
    // { "livedoor NEWS": "https://news.livedoor.com/" },
    // { "Mixiニュース": "https://news.mixi.jp/" },
    // { "Team Leaders（ASCII）": "https://ascii.jp/teamleaders/" },
    // { "DX MAGAZINE": "https://dxmagazine.jp/" },
    // { "週刊BCN": "https://www.weeklybcn.com/" },
    // { "TECH＋": "https://news.mynavi.jp/techplus/technology/" },
    // { "住宅新報Web": "http://www.jutaku-s.com/" },
    // { "business network": "https://businessnetwork.jp/" },
    // { "クラウドWatch": "https://cloud.watch.impress.co.jp/" },
    // { "IoTNEWS": "https://iotnews.jp/" },
    // { "ニコニコニュース": "https://news.nicovideo.jp/" },
    // { "日本経済新聞": "https://www.nikkei.com/" },
    // { "BCN Media Portal": "http://portal.bcnranking.jp/" },
    // { "zakzak": "https://www.zakzak.co.jp/" },
    // { "今日のニュース": "https://news.goo.ne.jp/topstories/today/" },
    // { "SalesZine": "https://saleszine.jp/" },
    // { "マイナビニュース": "https://news.mynavi.jp/" },
    // { "ろいアンテナ": "https://comedydouga.com/2ch16/" },
]; 