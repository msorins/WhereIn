        var map;
        var markersArray = [];

        function initMap()
        {
            var latlng = new google.maps.LatLng(45.65268827193931, 25.61187744140625);
            var myOptions = {
                zoom: 12,
                center: latlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

            // add a click event handler to the map object
            google.maps.event.addListener(map, "click", function(event)
            {
                // place a marker
                placeMarker(event.latLng);

                // display the lat/lng in your form's lat/lng fields
                user.answer_lat = event.latLng.lat();
                user.answer_lng = event.latLng.lng();
                user.answerTime = 20 - game.time;
            });

            google.maps.event.addListener(map, "mousedown", function(event){

                 // place a marker
                placeMarker(event.latLng);

                // display the lat/lng in your form's lat/lng fields
                user.answer_lat = event.latLng.lat();
                user.answer_lng = event.latLng.lng();
                user.answerTime = 20 - game.time;

            });
        }
        function placeMarker(location) {
            // first remove all markers if there are any
            deleteOverlays();

            var marker = new google.maps.Marker({
                position: location, 
                map: map
            });

            // add marker in markers array
            markersArray.push(marker);

            //map.setCenter(location);
        }

        // Deletes all markers in the array by removing references to them
        function deleteOverlays() {
            if (markersArray) {
                for (i in markersArray) {
                    markersArray[i].setMap(null);
                }
            markersArray.length = 0;
            }
        }