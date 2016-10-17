//Connection to socket
var socket = io("http://176.223.125.153:8000");

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
	if( user.name.length !=0  && user.name.substring(0,4) != "user")
	{
		console.log(user);
		user.type="login";
		socket.emit('userDB', user);
	}
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

		var uN;
		if(user.name.substring(0,4) != "user")
			uN = `<a onclick="getUserProfile('${user.name}')" href="#modal3" class="title modal-trigger">${user.name}</a>`;
		else
			uN = `${user.name}`;

		$("#ranking").append(`
			<li class="collection-item avatar">
			      <img style="height:50px; width:50px;" src="${user.thumbnail}"  class="circle">
			      ${uN}
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
		if(user.answer_lat !=0 && user.answer_lng!=0)
		{
			socket.emit("game_user_answer",user);
			console.log("game_user_answer (send): "+ user.name + " " + user.answer_lat+ " - " +user.answer_lng);
			console.log(user);
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

//Add ranking data from DB
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

function has(object, key) {
     return object ? hasOwnProperty.call(object, key) : false;
}

socket.on("userProfileRes", function(data){
	delete_nodes("UserProfileContent");
	var profile_picture, rating;
	//Chose the right picture profile
	if(has(data,'id_facebook'))
		profile_picture = `https://graph.facebook.com/${data.id_facebook}/picture/?width=300&heigth=335`;
	else
		if(has(data,'id_google'))
			profile_picture = `https://plus.google.com/s2/photos/profile/{$data.id_google}?sz=330`;
		else
			profile_picture = 'img/no-avatar.png';

	//Hide logout button if it's not logged in user profile
	if(user.name == data.name)
		document.getElementById("logoutUser").style.display = "flex";
	else
		document.getElementById("logoutUser").style.display = "none";

	//Form the Profile and pace it in HTML
	rating = (data.total_games / data.games_won ) * 10 ; rating=rating.toFixed(2);
	$("#UserProfileContent").append(`
			<div style="margin-top:25px" class="row">
	          <div class="card">
	            <div class="card-image">
	              <img style="max-height:300px; overflow:hidden;" src="${profile_picture}">
	              <span class="card-title">${data.name}</span>
	            </div>
	            <div class="card-content">
	              <p> ${data.description} </p>
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

	//Open the modal with the profile
	$('#modal3').openModal();
});

//Change user settings form
document.forms[0].onsubmit = function () {
	var data = {};
	data.email = user.email;
	data.name = document.getElementById("userSettingsName").value;
	data.description = document.getElementById("userSettingsDescription").value;
	if(document.getElementById("userSettingsPostFacebook").checked)
		data.postFacebook = 1;
	else
		data.postFacebook = 0;

	data.type = "userEdit";
	console.log(data);
	//alert("da");

	socket.emit("userDB", data)
};

//CHAT PART
//===========================================================================
socket.on("message", function(message){
	printMessage(message);
});

//Chat Form
document.forms[1].onsubmit = function () {
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
				//SAVE USER DATA TO OBJECT ( IN ORDER TO BE SEND TO SERVER )
				user.network = r.network;
				user.name = p.name;
				user.thumbnail = p.thumbnail;
				user.email = p.email
				user.network = r.network;
				if(user.network == "windows")
					user.network = "microsoft";

				user.id = p.id;

				//Send socket conaining user info to server
				user.type="login";
				socket.emit('userDB', user);

				//Close login modal
				$('#modal2').closeModal();
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


socket.on("userLoginConfirm", function(data){
	//TO CHANGE HERE

	user.name = data.name;
	user.description = data.description;
	user.id_facebook = data.id_facebook;
	user.id_google = data.id_google
	user.id_microsoft = data.id_microsoft
	user.thumbnail = data.thumbnail;
	user.email = data.email;

	//Put User data in NavBar
	document.getElementById('login-ul').style.display= 'none';
	document.getElementById('user-ul').style.display= 'block';
	document.getElementById('user_name').innerHTML = data.name;
	document.getElementById('userProfileModal').setAttribute('onclick',`getUserProfile('${data.name}')`);

	//Put User data in his settings options
	document.getElementById('userSettingsName').value = data.name;
	document.getElementById('userSettingsName').className += "active";

	//Show User Settings Section
	document.getElementById("userSettingsSection").style.display = "block";
	if(data.id_facebook.length)
		document.getElementById("userSettingsFacebook").checked = true;
	if(data.id_google.length)
		document.getElementById("userSettingsGoogle").checked = true;
	if(data.id_microsoft.length)
		document.getElementById("userSettingsMicrosoft").checked = true;

	document.getElementById("userSettingsDescription").value = data.description;
	if(data.postFacebook == 1)
		document.getElementById("userSettingsPostFacebook").checked = true;
	else
		document.getElementById("userSettingsPostFacebook").checked = false;

	//Show login confirmation message
	if(data.res == "userEditSuccess")
		Materialize.toast('Schimbari salvate ! ', 4000) // 4000 is the duration of the toast
	else
		if(data.res == "userEditNameConflict")
			Materialize.toast('Acest nume de utilizator este deja folosit !', 4000) // 4000 is the duration of the toast
		else
			Materialize.toast('Salut, '+ user.name, 4000) // 4000 is the duration of the toast


	console.log("Server confirmed login, hello "+ user.name);
	console.log(data);
});


//logout function -> after logout it refreshes the page
function logoutForce(){

	var network;
	if(user.network == "microsoft")
		network = "windows";
	else
		network = user.network;

	hello( network ).logout({force:true},function(e){
		console.log("logout-force",e);
		location.reload();
	});
}


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
