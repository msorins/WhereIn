//Connection to socket
var socket = io("http://188.213.21.45:8000");

//Info about the game
var game = {};

//Info about the user
var user = {};
user.name = ""
user.thumbnail = "img/user.png"
user.answer_lat=0; user.answer_lng=0;


socket.on("forceLogout-e1", function(){
	  $('#modal4').openModal();
	  socket.disconnect();
})


socket.on("disconnect", function(){
	printMessage("Deconectat de la server !");
});

//Request Game Info from Server on connect
socket.on("connect", function(){
	socket.emit("game_req");
	socket.emit("game_connected_users_req");
	socket.emit("gameReqRanking");
});

//Receive Game Info from Server 
socket.on("game_stats", function(d_game){
	console.log("game_stats ( received ) - time:" + d_game.time); 
	if(("gps" in game !== true) || (game.gps.lat !== d_game.gps.lat && game.gps.lng !== d_game.gps.lat))
	{
		game = d_game;
		panorama = new google.maps.StreetViewPanorama(
		document.getElementById('street-view'),
		{
			position: game.gps,
			pov: {heading: 165, pitch: 0},
			zoom: 1,
			streetViewControl: false,
			zoomControl: false,
			disableDefaultUI: true
		});
	}
	game=d_game;
	
});

//Receive last Game Ranking ( at the end )
socket.on("game_ranking", function(d_game){
	var star;
	delete_nodes("ranking");
	var i=0;
	d_game.forEach(function(user){
		i++;
		console.log(`Game result : user ${user.name} , distance ${user.dst}`);
		if(i<=3)
		    star = ' <a href="#!" class="secondary-content"><i class="material-icons">grade</i></a>';
		else
			star = '';

		$("#ranking").append(`
			<li class="collection-item avatar">
			      <img style="height:50px; width:50px;" src="${user.thumbnail}"  class="circle">
			      <a onclick="getUserProfile('${user.name}')" href="#modal3" class="title modal-trigger">${user.name}</a>
			      <p>Locul ${i} <br>
			         Distanta : ${user.dst.toFixed(2)} km 
			      </p>
			      ${star}
			    </li>

			`);
	});
});
 

socket.on("game_connected_users_res", function(d_game){
	if(!user.name)
		user.name="user"+d_game;
});


//CountDown
setInterval(function(){
	game.time-=1;

	//Send Answers when game finishes
	if(game.time==0)
	{
		if(user.answer_lat !==0 && user.answer_lng!==0)
		{
			socket.emit("game_user_answer",user); 
			console.log("game_user_answer (send): "+ user.name + " " + user.answer_lat+ " - " +user.answer_lng);
			//Delete markers for next game
			deleteOverlays(); user.answer_lat=0; user.answer_lng=0;
		}
		else
			console.log("No location chosen");
	}
	if(game.time > 0)
		document.getElementById("crt_countdown").innerHTML= game.time + " secunde ramase";
	if(game.time == 0)
		document.getElementById("crt_countdown").innerHTML= `<div style="margin-left:15px; margin-top:13px; position:absolute;" class="preloader-wrapper small active"> 
    <div class="spinner-layer spinner-green-only">
      <div class="circle-clipper left">
        <div class="circle"></div>
      </div><div class="gap-patch">
        <div class="circle"></div>
      </div><div class="circle-clipper right">
        <div class="circle"></div>
      </div>
    </div>
  </div>`;
},1000);

//Delete childs of element
function delete_nodes(id){
	var myNode = document.getElementById(id);
	while (myNode.firstChild) {
	    myNode.removeChild(myNode.firstChild);
	}
} 

//Add last game ranking data to HTML
socket.on("gameResRanking", function(data){
	delete_nodes("dbRanking");

	var star;
	for(var i=0; i < data.length; i++){
		if(i<=3)
		    star = ' <a href="#!" class="secondary-content"><i class="material-icons">grade</i></a>';
		else
			star = '';

		var rating = (data[i].total_games / data[i].games_won ) * 10 ; rating=rating.toFixed(2);
		$("#dbRanking").append(`
			<li class="collection-item avatar">
			      <img style="height:50px; width:50px;" src="${data[i].thumbnail}"  class="circle">
			      <a onclick="getUserProfile('${data[i].name}')" href="#modal3" class="title modal-trigger">${data[i].name}</a>
			      <p>Jocuri castigate: ${data[i].games_won} <br>
			         Rating : ${rating}
			      </p>
			     	 ${star}
			    </li>

			`);
	}
});


function getUserProfile(user_name)
{
	socket.emit("userProfileReq", user_name);
	console.log(user_name);
}

socket.on("userProfileRes", function(data){
	delete_nodes("UserProfileContent");
	var profile_picture, rating;
	console.log("Typeof: " + typeof data.id_facebook);
	if(typeof data.id_facebook !== 'undefined')
		profile_picture = `https://graph.facebook.com/${data.id_facebook}/picture/?width=300&heigth=335`;
	else 
		if(typeof data.id_facebook !== 'undefined')
			profile_picture = `https://plus.google.com/s2/photos/profile/{$data.id_google}?sz=330`;
		else
			profile_picture = 'img/no-avatar.png';

	rating = (data.total_games / data.games_won ) * 10 ; rating=rating.toFixed(2);
	$("#UserProfileContent").append(`
			<div style="margin-top:25px" class="row">
	          <div class="card">
	            <div class="card-image">
	              <img style="max-height:300px; overflow:hidden;" src="${profile_picture}">
	              <span class="card-title">${data.name}</span>
	            </div>
	            <div class="card-content">
	              <p>Jocuri castigate: ${data.games_won}<br>
	              	 Rating : ${rating}
	              </p>
	            </div>
	            <div class="card-action flex-social">
	              <a href="https://www.facebook.com/${data.id_facebook}"><img style="height:30px; width:30px;" src="img/profileFacebook.png"></a>
	              <a href="https://plus.google.com/${data.id_google}"><img style="height:30px; width:30px;" src="img/profileGoogle.png"></a>
	            </div>
	          </div>
	      </div>
	`);
	$('#modal3').openModal();
});

//CHAT PART
//===========================================================================
socket.on("message", function(message){
	printMessage(message);
});


document.forms[0].onsubmit = function () {
    var input = document.getElementById("message");
    var msg = {};
    msg.user = user;	msg.msg = input.value;
    socket.emit("chat", msg);
    printMessage(msg);
    input.value = '';
};


function printMessage(message){
	var p;

	if(message == 'Conectat la server !')
		p = `<p style="margin-left:15px;">`;
	else
	    p = `<p style="margin-left:15px; margin-top:-15px;">`;

	if(typeof message.user !== 'undefined')
		if(message.user.name.substring(0,4) != 'user')
			p  += `<a onclick="getUserProfile('${message.user.name}')" href="#modal3" class="title modal-trigger"> ${message.user.name}</a>: ${message.msg}`;
		else
			p  += `${message.user.name}: ${message.msg}`;
	else
		p += message;

	p +="</p>";

	$("div.chatbox").append(`
		${p}
	`);


	document.getElementById('chatboxID').scrollTop = 9999999;
}

//AUTH PART 
//==========================================================================
var logged_in = false;
	// Listen to signin requests
	hello.on('auth.login', function(r) {
		// Get Profile
		hello( r.network ).api( '/me' ).then( function(p) {
			if(!logged_in)
			{
				document.getElementById('login-ul').style.display= 'none';
				document.getElementById('user-ul').style.display= 'block';
				document.getElementById('user_name').innerHTML = p.name;
				document.getElementById('userProfileModal').setAttribute('onclick',`getUserProfile('Sorin Soo')`);

				logged_in=true;
				var label = document.getElementById(r.network);
				label.innerHTML = "<img src='"+ p.thumbnail + "' width=24/>Connected to "+ r.network+" as " + p.name + " email :" + p.email;

				//SAVE USER DATA TO OBJECT ( IN ORDER TO BE SEND TO SERVER )
				user.network = r.network;
				user.name = p.name;
				console.log(user.name + " logged in !");
				user.thumbnail = p.thumbnail;
				user.email = p.email
				user.network = r.network;
				if(user.network == "windows")
				{
					user.network = "microsoft";
					alert("da");
				}
				user.id = p.id;
				
				//Send socket conaining user info to server
				socket.emit('userDB', user);

				//Close login modal
				$('#modal2').closeModal();
				
				//Show login confirmation message
				Materialize.toast('Salut, '+ user.name, 4000) // 4000 is the duration of the toast

				// On chrome apps we're not able to get remote images
				// This is a workaround
				if (typeof(chrome) === 'object') {
					img_xhr(label.getElementsByTagName('img')[0], p.thumbnail);
				}
			}
			
		});
	});


	// Intiate App credentials
	hello.init({
		google : "613542635165-mlnt55f3vrmqfsvjo1ga180buf7h2jn5.apps.googleusercontent.com",
		facebook : "465023330348371",
		windows : "0000000048188B3B",
		twitter : "583087974",
		instagram : "6e294c6e780e489f9e8f316d1e22218d",
		tumblr : "nTMdgn9SvouUZ3H4fdf8nEXeHch1Fdk4nOJo3NAHwWm1uSxW9U"

	},{
		scope : 'email',
		redirect_uri: '/'
	});


	var b = Array.prototype.slice.call(document.getElementsByClassName('profile'));
	b.forEach(function(btn){
		btn.onclick = function(){
			logged_in = false ;
			hello(this.id).login();
		};
	});

	// Utility for loading the thumbnail in chromeapp
	function img_xhr(img, url) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.responseType = 'blob';
		xhr.onload = function(e) {
			img.src = window.URL.createObjectURL(this.response);
		};
		xhr.send();
	}