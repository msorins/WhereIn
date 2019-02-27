# WhereIn

## Video demo
[![](http://img.youtube.com/vi/alESpxT9EkI/0.jpg)](http://www.youtube.com/watch?v=alESpxT9EkI "WhereIn | Demo")

## Screens
![Demo Image ](https://github.com/msorins/WhereIn/blob/master/0.png?raw=true "Demo Image")

![Demo Image ](https://github.com/msorins/WhereIn/blob/master/1.png?raw=true "Demo Image")

![Demo Image ](https://github.com/msorins/WhereIn/blob/master/2.png?raw=true "Demo Image")

![Demo Image ](https://github.com/msorins/WhereIn/blob/master/3.png?raw=true "Demo Image")


# Idea
A real-time web based game that asks its players to recognise a place and then pinpoint it on the map, the closet pinpoint wins the game.

StreetView API is used to provide a 360° view of a random place (from a predetermined city), then users can click and so pinpoint on an instance of Google Maps.

The application features a real-time chat, ranking system and also an overall ranking system.

The theme of the website can be changed with a click of a button.

Authentication is done via Google, Facebook or Microsoft.

# How does it work

All the communication between BackEnd and FrontEnd is achieved using Socket.IO.

The game detects if two users are connected from the same browser or IP address and allows only one of them to enter the game.

The Node backend keeps the state of the game and at the beginning of each round sends to each connected player the chosen gps coordinates, also at the end it receives all the answers and computes the ranking & distribute points.

# Technologies used

* Socket.IO

### Front:
* MaterializeCSS
* JS
* Google Maps API

### BackEnd:
* NodeJs
* MySQL


> The Project was realised in the last year of high school (2016)