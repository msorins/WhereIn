//Load Modules !!!
var express = require("express");
var http = require("http");
var cookieParser = require('cookie-parser')
var mysql      = require('mysql');

//Create an app express
var app = express();
var server = http.createServer(app).listen(8000);
var io = require("socket.io")(server);


require('console-stamp')(console, '[HH:MM:ss.l]');
//App Variables
var game= {};
game.time=21;
game.status="Waiting !"

game.gpsList = []; //  List of all avaiable gps coordonates
game.connected_users =0; //Number of connected users
game.users = [];  // All Info about users who participate in the contest
game.usersIp = []; // All the Ips of those connected
game.gps ={}; //  Current game coordonates
game.statistics = []; // User Statistics ( emptyed everytime statistics are uploaded )
game.dbRanking = [];


//SQL Variables
var APP_DEBUG = true;

var connect_sql = {
  host     : 'localhost',
  user     : 'admin_sorynsoo',
  password : 'inventor15',
  database : 'admin_wherein'
};

//Server the static files
app.use(express.static("./public"));

//Use cookie parser
app.use(cookieParser());

//Get cookies
app.get('/get_cookies',function(req,res){
	res.send(req.cookies);
});

//Set theme cookie
app.get('/set_theme_cookie/:id', function(req, res) {
  var id = req.params.id;
  res.cookie('theme_id' , String( id ));
  res.send('user ' + id);
});

//Get coordonates from DB
var connection = mysql.createConnection(connect_sql);

//Connect to MYSQL
//connection.connect();

//Make the Query to retrieve gps coordonates
console.log("MYSQL Query process started");
connection.query('SELECT * FROM  `wherein` ', function(err, rows, fields) {
  if (err) throw err;

  connection.query('SELECT * FROM  `users` ORDER BY  `users`.`total_games` DESC LIMIT 0 , 30', function(err, rows, fields) {
	  if (err) throw err;

	  connection.end();
	  for(var i=0; i<rows.length; i++)
	  	game.dbRanking.push(rows[i]);

	  console.log("Game dbRanking fetched ");
	});



  for(var i=0; i<rows.length; i++)
  	game.gpsList.push(rows[i]);

  console.log("MYSQL Query process finished");
  //START THE GAME
  console.log("Starting game");
  
  var rnd = Math.floor(Math.random() * (game.gpsList.length-1)) + 1  ;
  game.gps.lat=	game.gpsList[rnd].lat;
  game.gps.lng=	game.gpsList[rnd].lng;
  games();
  update_user_statistics();
});


//Server request & response part
io.on("connection", function(socket){

	//Restrict ( by IP ) multiple user connection.Use an array to store every IP addres
	if(APP_DEBUG === false)
	{
		var address = socket.handshake.address;
		if(game.usersIp.indexOf(address) !=-1)
			socket.emit("forceLogout-e1"); 

		game.usersIp.push(address);
	}

	//Modify the value of connected users ( on connect )
	game.connected_users +=1;
	console.log(`Connected users : ${game.connected_users}`);


	//Modify the value of connected users & the array of stored IP addresses ( on disconnect )
	socket.on('disconnect', function(){
		if(APP_DEBUG === false)
		{
			var address = socket.handshake.address;
			var index = game.usersIp.indexOf(address);
			if(index>-1)
				game.usersIp.splice(index,1);
		}
		game.connected_users -=1;
		console.log(`Connected users : ${game.connected_users}`);
	});

	//Emit welcome chat messages
	socket.emit("message", "Conectat la server !");

	//On Chat Event broadcast the message to all listeners
	socket.on("chat", function(message){
		socket.broadcast.emit("message",message);
		console.log(message);
	});

	//Respond to a request to see the game_stats ( gps location, time ... )
	socket.on('game_req',function(){
		socket.emit("game_stats", game);     
	});

	//Receive and put all answers of user in an array ( when game finishes) 
	socket.on('game_user_answer', function(user){ 
		game.users.push(user);
	});

	//Response to the request to see the number of users connected
	socket.on('game_connected_users_req', function(){
		socket.emit('game_connected_users_res', game.connected_users);
	});

	//Response to the request to see curent game
	socket.on('gameReqRanking', function(){
		socket.emit('gameResRanking', game.dbRanking);
	});

	//DO DB operations with user data ( add accounts....)
	socket.on('userDB', function(user){

		//Check if User is Registred
		connection = mysql.createConnection(connect_sql);

		var query = "SELECT * FROM  `users` WHERE  `email` LIKE  '"+user.email+"'";
		connection.query(query, function(err, rows, fields) {
	  		if (err) throw err;
	  		if(rows.length === 0) // IF It is not registered add all info about him
	  		{
	  				query = "INSERT INTO  `admin_wherein`.`users` (`id` ,`id_"+user.network+"` ,`name` ,`email` ,`thumbnail`)VALUES (NULL ,  '"+user.id+"',  '"+user.name+"',  '"+user.email+"',  '"+user.thumbnail+"')";
	  				connection.query(query, function(err,rows,fields){
	  					if(err) throw err;
	  				});
	  		}
	  		else
	  			if(rows.length === 1 && rows[0]["id_"+user.network] != user.id) // IF a change is required ( compare db network id with current one )
		  		{
		  			query = "UPDATE  `admin_wherein`.`users` SET  `id_"+user.network+"` =  '"+user.id+"'  WHERE  `users`.`id` = "+rows[0].id;
		  			connection.query(query, function(err,rows,field){
		  				if(err) throw err;
		  			});
		  		}
		  	connection.end();
	    });
	    
	});

}); 
  
//The Function where the game lives . Every round takes 20 seconds
function games(){
	var interval = setInterval(function(){
	game.time -= 1;

	//Start or Restart the game 
	if(game.time == 20 )
	{
		game.status ="In progress";
		console.log("Game started");
	}

	//Start Ranking Process when a round finishes
	if(game.time == 0)
	{
		game.status="Ranking answers";
		console.log("Ranking process started");

		setTimeout(function() { 
			//Evaluate the answers after 3 seconds
			if(game.users.length) // If there are users
			{
				game.users = evaluate(game.users);

				//Send game ranking ( after evaluation )
				io.emit('game_ranking',game.users);
			}
			else
				console.log("Not enough users");

			//Restart Game
			console.log("Ranking process finished");
			//New Location
			var rnd = Math.floor(Math.random() * (game.gpsList.length-1)) + 1  ;
			game.gps.lat=game.gpsList[rnd].lat;
			game.gps.lng=game.gpsList[rnd].lng;
			//Restart time and users who participate
			game.time=21  ;
			game.users = [];
			game.usersIp = [];
			io.emit('game_stats',game);
		}, 3000);

	}
	if(game.time % 5 ==0 || game.time<=0)
		console.log("Game time: " + game.time +"s") ;
	}, 1000);        
}


function evaluate(answers){
	console.log("220: Number of participants: " + answers .length);
	//Compute all distances
	answers.forEach(function(usr){
		usr.dst = usr.dst = dist(game.gps.lat, game.gps.lng, usr.answer_lat, usr.answer_lng);
	});

	//Sort all results
	answers = answers.sort(function(a, b)
	{
		if(a.dst>b.dst)
			return 1;
		return 0;
	});

	//Print all Results
	answers.forEach(function(usr){
		console.log(`236: User ${usr.name} - ${usr.email } chose => ${usr.answer_lat} - ${usr.answer_lng} . Distance : ${usr.dst}`);  
	});

	var find ;
	//Edit the statistics for current game winner
	if(typeof answers[0].email != "undefined")
	{
		find = false;
		for(var i=0 ; i<game.statistics.length; i++)
			if(game.statistics[i].email === answers[0].email){ // Daca utilizatorul este deja in statistici
				game.statistics[i].won++;
				game.statistics[i].participated++;
				find=true;
				console.log(`248: GameStatistics - valorile pentru ( castigator )${game.statistics[i].email} actualizate in array-ul cu statistici`);
			}


		if(!find) // If User exists in the statistics array
		{
			var obj = {};
			obj.email = answers[0].email;
			obj.won = 1;
			obj.participated = 1 ;
			game.statistics.push(obj);
			console.log(`259: GameStatistics - (castigator ) ${answers[0].email} adaugat in array-ul cu statistici`);
		}
	}

	//Edit the statistics for current game participants
	for(var i=1; i < answers.length; i++){
		if(typeof answers[i].email != "undefined")
		{
			find = false;
			for(var j=0 ; j<game.statistics.length; j++)
				if(game.statistics[j].email === answers[i].email)
				{
					game.statistics[j].participated++;
					find=true;
					console.log(`273: GameStatistics - valorile pentru actualizate ( participant )${game.statistics[j].email}  in array-ul cu statistici`);
				}

			if(!find)
			{
				var obj = {};
				obj.email = answers[i].email;
				obj.won = 0;
				obj.participated = 1;
				game.statistics.push(obj);
				console.log(`284: GameStatistics - (participant ) ${answers[i].email} adaugat in array-ul cu statistici`);
			}

		}
	}
	
	console.log(`Game result : Winner: ${answers[0].name} , distance ${answers[0].dst}`);
	return answers;
}

function update_user_statistics()
{
	var interval = setInterval(function(){
		console.log("298: Update User statistics in progress ! ");
		connection = mysql.createConnection(connect_sql);
		console.log(game.statistics);
		for(var i=0; i<game.statistics.length; i++){
			
			var query = "UPDATE  `admin_wherein`.`users` SET  games_won = games_won + "+ game.statistics[i].won +", total_games = total_games + " + game.statistics[i].participated + " WHERE  `users`.`email` = '"+ game.statistics[i].email +"';";
			console.log(`304: User with email ${game.statistics[i].email} participated ${game.statistics[i].participated} times - won ${game.statistics[i].won} times`);
			connection.query(query, function(err, rows, fields) {
				if(err) throw err;
				console.log("done");
			});
		
		}

		game.statistics = [];
		connection.end();
	},120000);
}

//Calculare Distanta intre 2 pc
function dist(lat1, lon1, lat2, lon2) {
    //Radius of the earth in:  1.609344 miles,  6371 km  | var R = (6371 / 1.609344);
    var R = 3958.7558657440545; // Radius of earth in Miles 
    var dLat = toRad(lat2-lat1);
    var dLon = toRad(lon2-lon1); 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d;
}

function toRad(Value) {
    /** Converts numeric degrees to radians */
    return Value * Math.PI / 180;
}   
 
