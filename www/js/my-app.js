// Initialize app
var app = new Framework7();


// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

// Add view
var mainView = app.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});


// Handle Cordova Device Ready Event
var db=null;
$$(document).on('deviceready', function() {
    console.log("Device is ready!");
    getLocation();
    //DataBase
    db = window.openDatabase("travelpalDB.db", "1.0", "Just a Dummy DB", 0);
    createTable();//Create Table is doesn't exist
    generateID();
    //screen.orientation.lock('portrait');
});

// Now we need to run the code that will be executed only for About page.

// Option 2. Using one 'pageInit' event handler for all pages:
$$(document).on('pageInit', function (e) {
    // Get page data from event data
    var page = e.detail.page;
    if (page.name === 'currencyConverter') {
        getLocalCurrency(codeCountry);
        // Following code will be executed for page with data-page attribute equal to "about"
       // app.alert('Here comes About page');
    }
});
// Now we need to run the code that will be executed only for About page.

// Option 2. Using one 'pageInit' event handler for all pages:
$$(document).on('pageInit', function (e) {
    // Get page data from event data
    var page = e.detail.page;
    if (page.name === 'history') {
        createTable();
        pull_Set_All_History();
       // screen.orientation.lock('landscape');
        // Following code will be executed for page with data-page attribute equal to "history"
       // app.alert('Here comes About page');
    }
})



//DATABASE
/**
 * This function create a table HISTORY IF DOESN'T EXISTS
 */
function createTable()
{
    db.transaction(function(tx) {
        
        tx.executeSql('CREATE TABLE IF NOT EXISTS history ( Id INTEGER PRIMARY KEY,'+
        'country TEXT, city TEXT, temp TEXT, condition TEXT, date TEXT)');
        
        //tx.executeSql('CREATE TABLE IF NOT EXISTS weather (Id INTEGER PRIMARY KEY AUTOINCREMENT,'+
        //'IdLocation,temp TEXT, condition TEXT, date TEXT)');
      }, function(error) {
        console.log('Transaction ERROR: ' + error.message);
      }, function() {
        console.log('Populated database OK');
      });
}
/**
 * This function is encharge to  get Datas from interface and insert to Database (SQLite)
 */
function insertData()
{
    //Location
    
    var id=document.getElementById("IdH").innerHTML;
    var country=document.getElementById("country").innerHTML;
    var city=document.getElementById("city").innerHTML;
    //Weather
    var temp=document.getElementById("tempW").innerHTML;
    var condition=document.getElementById("condition").innerHTML;
    var date=document.getElementById("lastUpdated").innerHTML;
    db.transaction(function(tx) {
        tx.executeSql('INSERT INTO history VALUES (?,?,?,?,?,?)', [id,country, city, temp , condition, date]);

      }, function(error) {
        console.log('Transaction ERROR: ' + error.message);
      }, function() {
        console.log('Populated database OK');
      });
      generateID();
}
/**
 * Make a new Id  getting from the last Id from previous data and plus 1
 */
function generateID(){
    
    db.transaction(function(tx) {
        tx.executeSql('SELECT MAX(Id) as Id FROM history', [], function(tx, rs) {
          //console.log('Record count (expected to be 2): ' + rs.rows.item(12).country);
          document.getElementById("IdH").innerHTML = rs.rows[0].Id +1;
        }, function(tx, error) {
          console.log('SELECT error: ' + error.message);
        });
      });
}
/**
 * this function retrieve Information saved from database and set on the interface  into a table made
 */
function pull_Set_All_History()
{
    var location=null;
    var weather=null;
    db.transaction(function(tx) {
        tx.executeSql('SELECT * FROM history', [], function(tx, rs) {
        var tbl= '<table> <tr> '+
        '<th> ID </th> '+
        '<th> Country </th> '+
        '<th> City </th> '+
        '<th> Temperature </th> '+
        '<th> Condition </th> '+
        '<th> Date </th> '+
        '</tr>';
          for(var i=0; i< rs.rows.length; i++)
          {
              tbl += '<tr> '+
              '<td> '+ rs.rows[i].Id +' </td>'+
              '<td> '+ rs.rows[i].country +' </td>'+
              '<td> '+ rs.rows[i].city +' </td>'+
              '<td> '+ rs.rows[i].temp +' </td>'+
              '<td> '+ rs.rows[i].condition +' </td>'+
              '<td> '+ rs.rows[i].date +' </td>'+
              '</tr>';
          }
          tbl += '</table>';
          document.getElementById("containerTable").innerHTML=tbl;
          console.log(rs);
        }, function(tx, error) {
          console.log('SELECT error: ' + error.message);
        });
    });
    
}





/**
 * First step to set up information 
 * This block o codes get coords
 */
function getLocation(){
    navigator.geolocation.getCurrentPosition(geoCallBack, onError);
}
function geoCallBack(position){
    console.log("Location---------16.5117633,-68.1445421-------");
    var latitude=position.coords.latitude;
    var longitude=position.coords.longitude;
   getInfoPosition(latitude,longitude);
}
function onError(msg)
{console.log(msg);}


/**
 * variables
 */
var codeCountry; //thi variable keep a "ISO_3166-1_alpha-3" from API

/**
 * This function receive  two parameter of coords to looking for the Country and city from API external
 * @param {*} lat 
 * @param {*} long 
 */
function getInfoPosition(lat, long)
{
    var country;
    var city;
    var http=new XMLHttpRequest();
    var keyApi ='42f97bdd816442e58e19fb660050ba0b';
    const url='https://api.opencagedata.com/geocode/v1/json';
    var request_url = url
    + '?'
    + 'key=' +encodeURIComponent(keyApi)
    + '&q=' + encodeURIComponent(lat) + ',' + encodeURIComponent(long)
    + '&pretty=1'
    + '&no_annotations=1';
    http.open("GET", request_url,true);
    http.send();
    http.onload = function() {
        if(http.status == 200)
        {
            var data = JSON.parse(http.responseText);
            
            city = data.results[0].components.city;
            country = data.results[0].components.country;
            alert("Welcome to "+ country, " ", city);
            //peace of code to get the currency
            codeCountry= data.results[0].components["ISO_3166-1_alpha-3"];

            document.getElementById("country").innerHTML= country;
            document.getElementById("city").innerHTML=city;

            console.log("get info from position---------------" + city+ country);
            console.log(data);
            getLocalWeather(city);
        }
        else if (http.status==500){
            console.log("unable to geocode! Response code"+ http.status);
            var data=JSON.parse(http.responseText);
            console.log(data.status.message);
        }
        else{console.log("server Error");}
    }
    http.onerror=function()
    {console.log("unable to connect to server");}
    
}
/**
 * this function receive a parameter city   to looking for  the current weather 
 * @param {*} cityName 
 */
function getLocalWeather(cityName)
{
    
    var http=new XMLHttpRequest();
    const url='https://api.apixu.com/v1/current.json?key=aadf284707a24c6593485028190405&q='+cityName;
   
    http.open("GET",url,true);  
    http.send();
    http.onload = function(){
        if(http.status == 200)
        {
            var data = JSON.parse(http.responseText);
            //icon weather imgCodition
            document.getElementById("imgCodition").innerHTML='<img src="https://'+ data.current.condition.icon+'">' //+ "<p class='grid'>"+ data.current.condition.text +"</p>";
            document.getElementById("condition").innerHTML='<p> '+data.current.condition.text+'</p>';
            document.getElementById("tempW").innerHTML='<h1><small> Temp.</small>  '+ data.current.temp_c +'°</h1>';
            document.getElementById("lastUpdated").innerHTML='<p> '+ data.current.last_updated +'</p>';
            //Deatil Weather  detailWeather
            
            console.log("get Local Weather--------------");
            console.log(data);
           
        }
        else if (http.status==500){
            console.log("unable to geocode! Response code"+ http.status);
            var data=JSON.parse(http.responseText);
            console.log(data.status.message);
        }
        else{console.log("server Error");}
    }
}
/**
 * these variables are symbol of currency
 */
var symbolDolla="$. USD";
var symbolLocal;
/**
 * -this function receive a codeCountry parameter just to looking for a single local currency  as symbol, code
 * @param {*} cName 
 */
function getLocalCurrency(cName)
{
    var localCurrency;
    var http=new XMLHttpRequest();
    const url='https://restcountries.eu/rest/v2/alpha/'+cName;
    http.open("GET",url,true);  
    http.send();
    http.onload = function(){
        if(http.status == 200)
        {
            var data = JSON.parse(http.responseText);
            localCurrency=data.currencies[0].code;
            symbolLocal=data.currencies[0].symbol;
            console.log("get currency local--------------"+ localCurrency);
            console.log(data);
            getCurrencyUSA(localCurrency);
           
        }
        else if (http.status==500){
            console.log("unable to geocode! Response code"+ http.status);
            var data=JSON.parse(http.responseText);
            console.log(data.status.message);
        }
        else{console.log("server Error");}
    }
     //getLocalWeather("London");
}


/**
 * This function, receive local currency to looking for a rate from USD. To change to local curreny 
 * @param {*} localC 
 */
function getCurrencyUSA(localC)
{
    var exchanceC;
    var http=new XMLHttpRequest();
    const url='http://apilayer.net/api/live?access_key=6d3651564f4794e0aeb46979636b86ac';
    http.open("GET",url,true);  
    http.send();
    http.onload = function(){
        if(http.status == 200)
        {
            var data = JSON.parse(http.responseText);
            console.log(localC +"------------------------------*****");
            exchanceC=data.quotes['USD'+localC];

            //Set up form
            document.getElementById("currencyUno").innerHTML= symbolLocal+". "+localC;
            document.getElementById("currencyDos").innerHTML=symbolDolla;
            document.getElementById("localS").innerHTML= symbolLocal;
            setPlaceHolder(symbolLocal+ " "+localC, symbolDolla);

            //rate exchance
            document.getElementById("rate").innerHTML=exchanceC;

            console.log("get Currency USA-------------- "+ localC);
            console.log(data);
        }
        else if (http.status==500){
            console.log("unable to geocode! Response code"+ http.status);
            var data=JSON.parse(http.responseText);
            console.log(data.status.message);
        }
        else{console.log("server Error");}
    }
}

/**
 * this function switch of position of currency to make a calulation later
 */
function exchangeCurrency()
{   
    var localCurrency;//
    localCurrency = document.getElementById("currencyUno").innerHTML;
    document.getElementById("currencyUno").innerHTML = document.getElementById("currencyDos").innerHTML;
    document.getElementById("currencyDos").innerHTML = localCurrency;
    var money1=document.getElementById("currencyUno").innerHTML;
    //cleaning textBox
    document.getElementById("amount").value="";
    document.getElementById("result").value="";
    setPlaceHolder(money1, localCurrency);
}
/**
 * this function convert from a currency to other using a rate
 */
function convertCurrency()
{
    var money1 = document.getElementById("amount").value;
    var resultado=0;
    var rate=document.getElementById("rate").innerHTML;
    var currency=document.getElementById("currencyUno").innerHTML;
    if(money1 != null){
        console.log(currency);
        console.log(rate);

        if(currency == symbolDolla)
        { resultado = money1 * rate;
            alert("es igual uno con dollar");
        }
        else{
            resultado = money1 / rate;
            alert("no es igual" +currency);
        }
        document.getElementById("result").value= parseFloat( resultado).toFixed(2);
        console.log(resultado);
    }else{console.log("Something goes wrong");}
}

/**
 * writes into a placeholder from textbox input
 * @param {*} money1 
 * @param {*} money2 
 */
function setPlaceHolder(money1, money2 )
{
    var input1= document.getElementById("amount");
    var input2= document.getElementById("result");
    input1.placeholder = money1;
    input2.placeholder = money2;
}






