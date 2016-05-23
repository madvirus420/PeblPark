/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var Vibe = require('ui/vibe');

// Show splash screen while waiting for data
var server = "http://madvirus420.pythonanywhere.com/";
// Text element to inform user
var text = new UI.Text({
  position: new Vector2(35, 20),
  size: new Vector2(70, 60),
  text:'Your location \nBSE, Mumbai',
  font:'Gothic 14',
  color:'white',
  textOverflow:'wrap',
  textAlign:'center',
  
});

new UI.Image({
  position: new Vector2(105,100),
  size: new Vector2(40, 40),
  image: 'images/parking_search_converted.png'
});

var leftTurn = new UI.Image({
  image : "images/left_arrow_converted2.png",
  position: new Vector2(105,100),
  size: new Vector2(40, 40)
});
var rightTurn = new UI.Image({image : "images/right_arrow_converted2.png",
  position: new Vector2(105,100),
  size: new Vector2(40, 40)});
var straight = new UI.Image({image : "images/upward_arrow_converted2.png",
  position: new Vector2(105,100),
  size: new Vector2(40, 40)});




// Create a dynamic window
var wind = new UI.Window();
var size = wind.size();
// Add a rect element
var rect = new UI.Rect({ 
                      position: new Vector2(18,10),
                      size: new Vector2(129 -18, 48), 
                      backgroundColor: 'blue' 
                      });
var backgroundRect = new UI.Rect( {size: new Vector2(size.x, size.y), backgroundColor: 'white'});



wind.add(backgroundRect);
wind.add(rect);
wind.add(text);





var searchingText = new UI.Text({
  position: new Vector2(6, 80),
  size: new Vector2(121-6, 175),
  text:'Searching for \nNearest parking',
  font:'Gothic 14',
  color:'blue',
  textOverflow:'wrap',
  textAlign:'center',
  
});

wind.add(searchingText);


var image = new UI.Image({
  position: new Vector2(105,100),
  size: new Vector2(40, 40),
  image: 'images/parking_search_converted.png'
});

wind.add(image);
wind.show();



/*****************GPS TRACKING **********************/

var firstTime = true;
var options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

function success(pos) {
  var crd = pos.coords;

  console.log('Your current position is:');
  console.log('Latitude : ' + crd.latitude);
  console.log('Longitude: ' + crd.longitude);
  console.log('More or less ' + crd.accuracy + ' meters.');
}

function error(err) {
  if(err.code == err.PERMISSION_DENIED) {
    console.log('Location access was denied by the user.');  
  } else {
    console.log('location error (' + err.code + '): ' + err.message);
  }
}

navigator.geolocation.getCurrentPosition(success, error, options);


/*****************GET LIST OF PARKING LOTS****************/


var parseParkingLots=function(data){
  var items = [];
  for(var i=0 ; i< data.length ; i++){
    var name = data[i].name;
    var price = data[i].price;
    var distance = price + i * 21;
    console.log("distance: " + distance);
    items.push({
      title:name,
      price: price,
      subtitle:distance,
      //font: 'Gothic 14',
      backgroundColor: 'white',
      borderColor: 'white',
      borderWidth: 4
    });
  }
  
  return items;
};

var getParkingLotList = function(lat,lng){


var URL = server;
URL = URL + "?lat=" + lat + "&lng=" +lng;
console.log("Requestin parking lot lists from : " + URL);

ajax(
  {
    url: URL,
    type: 'json'
  },
  function(data) {
    // Success!
   console.log('Successfully fetched parking lot list!');
   var parkingLots = data;
   var parkingMenus = parseParkingLots(parkingLots);
   var resultsMenu = new UI.Menu({
   sections: [{
        title: 'Nearest Parkings',
        items: parkingMenus
      }],
    backgroundColor: "blue",
    textColor: "white",
    
   });

   resultsMenu.show();
   resultsMenu.on('select', function(e) {
    //later
   console.log("Selected in list:  " + e.itemIndex);
   console.log("Selected in data: " + data[e.itemIndex].name +data[e.itemIndex].lat + " " +  data[e.itemIndex].lng);
   getNavigationDirections(lat, lng, data[e.itemIndex].lat,data[e.itemIndex].lng);
   resultsMenu.hide();
  wind.remove(searchingText);
   wind.remove(image);
   wind.remove(text);
   text.text("Navigation");
   wind.add(text);
   

   
     
  });
    
  },
  function(error) {
    // Failure!
    console.log('Failed to fetch parking lot list: ' + error);
  }
);


};



/************************END GET LIST OF PARKING LOTS**************/

var watchId;


function success(pos) {
  console.log('Location changed!');
  var lat = pos.coords.latitude;
  var lng = pos.coords.longitude;
  console.log('lat= ' + lat + ' lon= ' + lng);
  //TO-DO : get current neighbourhood name
  
  //get parking parkingLots list
  if(firstTime){
    
    setTimeout(function(){getParkingLotList(pos.coords.latitude, pos.coords.longitude);}, 2000);
    firstTime = false;
    var api = "location?lat=" + lat + "&lng=" + lng;
    var URL = server + api;

    ajax(
      {
	url: URL,
	type: 'json'
      },
      function(data) {
	text.text(data);
      },function(error){
	console.log("Failed to get location : " + error);
        console.log("url: " + URL);
      }
    );

  }
}

function error(err) {
  console.log('location error (' + err.code + '): ' + err.message);
}



var options = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 5000
};

// Get location updates
watchId = navigator.geolocation.watchPosition(success, error, options);


/*****************END OF GPS TRACKING*********************/



/************************GET NAVIGATION DETAILS*******************/

function getNavigationDirections(lat_src, lng_src, lat_dest, long_dest){

  //lat=18.924154&lng=72.8216994&lat_dest=18.9157801&lng_dest=72.82048;
  //lat=18.9296059&lng=72.8331494&lat_dest=18.9320466&lng_dest=72.831452
  var api = "navigate?";
  var URL = server + api + "lat=" + lat_src + "&lng=" + lng_src + 
	    "&lat_dest=" + lat_dest + "&lng_dest=" + long_dest;
	    
  console.log("Attempting to fetch locations from server = " + URL);
  ajax(
    {
      url: URL,
      type: 'json'
    },
    function(data) {
      console.log("Received nav directions");
      console.log(data[0].maneuver);
      //navigate(lat_src, lng_src, data[0].lat, data[0].lng, data);
      simulate(data);
      
      
    },function(error){
      console.log("Error getting navigation directions");
    });
}

/************************END OF NAVIGATION DETAILS*******************/
/************************SIMULATION*********************************/
function simulate(data){
  console.log(JSON.stringify(data));
  
  var n = data.length;
  var i = 0, j = 0, k = 0;
  
  for(i=0;i<n;i++){
    var turn = data[i].maneuver;
  /*	 
     for(j=0; j<1000000; j++){
      for(k=0;k<10000; k++){}
    }
    
    if(turn == "left"){
      changeImage("left");
      console.log("Left called");
    }else if(turn == "right"){
      changeImage("right");
      console.log("Right called");
    }
    searchingText.text(data[i].maneuver);
    for(j=0; j<1000000; j++){
      for(k=0;k<10000; k++){}
    }
      
    changeImage("straight");
    */
    
    setTimeout(function(){changeImage("left");}, 1000);
    setTimeout(function(){changeImage("right");}, 3000);
    setTimeout(function(){changeImage("straight");}, 5000);
    setTimeout(function(){reachedDestination();}, 8500);
  }
}
/************************END OF SIMULATION DETAILS******************/
/************************NAVIGATE TURNS ALGO************************/
function isClose(lat, lng, lat1, lng1){
    var d= Math.sqrt(Math.pow(lat-lat1, 2) + Math.pow(lng-lng1, 2));
    if(d <= 0.00002)
        return true;
}
function navigate(lat, lng, lat1, lng1, data){
  
    if(isClose(lat, lng, lat1, lng1)){
        while(isClose(lat, lng, lat1, lng1)){
            //display turn symbol
	  var turn = data[0].maneuver;
	  
	  if(turn == "left"){
	    changeImage("left");
	  }else if(turn == "right"){
	    changeImage("right");
	  }
	  
        }
        //display straight symbol
        searchingText.text(data[0].maneuver);
	changeImage("straight");
        //increment turn
        data = data.slice(1);
	
    }
    navigate(lat1, lng1, data[0].lat, data[0].lng, data);
}
//setInterval(function(){ navigate(lat, lng, lat1, lng1, data) }, 500);
/************************END OF NAVIGATE TURNS ALGO***************/

function changeImage(direction){
  wind.remove(image);
  wind.remove(leftTurn);
  wind.remove(rightTurn);
  wind.remove(straight);
  wind.remove(searchingText);
  console.log("inside change image");
  console.log("direction:" + direction);
  if(direction === "left"){
    
    image.image('images/left_arrow_converted.png');
    searchingText.text("Turn left");
    wind.add(leftTurn);
    
  }else if(direction === "right"){
    
    image.image('images/right_arrow_converted.png');
    searchingText.text("Turn right");
    wind.add(rightTurn);
    
  }else if(direction ===  "straight"){
    
    image.image('images/upward_arrow_converted.png');
    searchingText.text("Head straight");
    wind.add(straight);
  }
  //wind.add(image);
  Vibe.vibrate('short');
  wind.add(searchingText);
}

function reachedDestination(){
  var destinationImage = new UI.Image({
    image : "images/bmp_logo",
    position: new Vector2(105,100),
    size: new Vector2(40, 40)
  });
  wind.remove(image);
  wind.remove(leftTurn);
  wind.remove(rightTurn);
  wind.remove(straight);
  wind.remove(searchingText);
  searchingText.text('You have reached the destination');
  wind.add(destinationImage);
  wind.add(searchingText);
  
  setTimeout(function(){wind.remove(destinationImage); showParkingPass();},2000);

}

function showParkingPass(){
  wind.remove(image);
  wind.remove(leftTurn);
  wind.remove(rightTurn);
  wind.remove(straight);
  wind.remove(searchingText);
  var barCode = new UI.Image({
    image : "images/bmp_bar_code",
    position: new Vector2(0,0),
    size: new Vector2(144, 168)
  });
  wind.add(barCode);
}

wind.on('click', 'select', function() {
  console.log('Select clicked!');
  //wind.remove(image);
  //image.image('images/upward_arrow_converted.png');
  //wind.add(image);
});