
if(Pusher.apiKey) {

	Pusher.logToConsole = true;

	var pusher = new Pusher(Pusher.apiKey, {
		cluster: 'us3',
		forceTLS: true,
		authEndpoint: '/auth.php'
	});
	var channel;

	$(function(){

		$('.button.link').removeClass('hidden');

		$('.button.link').click(function(){
			$('.button.link').addClass('active');

			channel_id = prompt('Enter a name to link multiple teleprompters');

			if(channel_id) {
				channel = pusher.subscribe('private-'+channel_id);

				//////////////////////////////////////
				// CONTROLLER ⬇

				// Send the initialization request to any server listening
				channel.bind('pusher:subscription_succeeded', function() {
				  channel.trigger('client-initreq', {type: 'initialize'});
				});

				// Wait for a server to send initialization data if any are listening
				channel.bind('client-init', function(data) {
					// Load in the remote content
					$('#teleprompter').html(data.teleprompter_text);
					$.cookie('teleprompter_text', data.teleprompter_text);

					if(data.font_size) {
						// Set this client's font size and speed values
						fontSizeChangedLocally = true;
						$('.font_size').slider('value', data.font_size);
						fontSizeChangedLocally = false;
					}
					if(data.speed) {
						speedChangedLocally = true;
						$('.speed').slider('value', data.speed);
						speedChangedLocally = false;
					}

					// Show the control button
					$('.button.control').removeClass('hidden');
				});

				// CONTROLLER ⬆
				//////////////////////////////////////
				// SERVER/DISPLAY ⬇

				// If a request is received to initialize another client, send this server's current state
				channel.bind('client-initreq', function(data){
					channel.trigger('client-init', {
						teleprompter_text: $('#teleprompter').html(),
						font_size: $('.font_size').slider('value'),
						speed: $('.speed').slider('value')
					});

					// Show the control button, even though you wouldn't use it from the display device,
					// but this way it doesn't matter in which order you initialize the devices
					$('.button.control').removeClass('hidden');
				});

				// Handle remote commands
				channel.bind('client-control', function(data){
					if(data.action == 'play') {
						start_teleprompter();
					}
					if(data.action == 'pause') {
						stop_teleprompter();
					}
					if(data.action == 'scrollup') {
						scrollUp();
					}
					if(data.action == 'scrolldown') {
						scrollDown();
					}
					if(data.action == 'font_size') {
						fontSizeChangedLocally = true;
						$('.font_size').slider('value', data.font_size);
						fontSizeChangedLocally = false;
					}
					if(data.action == 'speed') {
						speedChangedLocally = true;
						$('.speed').slider('value', data.speed);
						speedChangedLocally = false;
					}
				});

				// SERVER/DISPLAY ⬆
				//////////////////////////////////////

				// If the text is changed on either device, send it to the other
				$('#teleprompter').keyup(function(){

					channel.trigger('client-init', {
						teleprompter_text: $('#teleprompter').html()
					});

				});

			}

		});


		$('#control .close-controls').click(function(){
			$('#control').addClass('hidden');
		});

		$('#control .control-play').click(function(){
			var action;

			if($(this).hasClass('icon-play')) {
				$('#control .control-play').removeClass('icon-play').addClass('icon-pause');
				action = 'play';
			} else {
				$('#control .control-play').removeClass('icon-pause').addClass('icon-play');
				action = 'pause';
			}

			channel.trigger('client-control', {
				action: action
			});
		});

		$('#control .scroll-up').click(function(){
			channel.trigger('client-control', {
				action: 'scrollup'
			});
		});

		$('#control .scroll-down').click(function(){
			channel.trigger('client-control', {
				action: 'scrolldown'
			});
		});

		$('#control .font-size-control a').click(function(){
			// The "change" event triggers sending the remote command
			if($(this).hasClass('increase')) {
				$('.font_size').slider('value', $('.font_size').slider('value') + 5);
			} else {
				$('.font_size').slider('value', $('.font_size').slider('value') - 5);
			}
		});

		$('#control .speed-control a').click(function(){
			// The "change" event triggers sending the remote command
			if($(this).hasClass('increase')) {
				$('.speed').slider('value', $('.speed').slider('value') + 2);
			} else {
				$('.speed').slider('value', $('.speed').slider('value') - 2);
			}
		});

		$('.button.control').click(function(){
			$('#control').removeClass('hidden');
		});
	});
}


var fontSizeChangedLocally = false;

function controlFontSize() {
	if(channel && !fontSizeChangedLocally) {
		channel.trigger('client-control', {
			action: 'font_size',
			font_size: $('.font_size').slider('value')
		});
	}
}

var speedChangedLocally = false;

function controlSpeed() {
	if(channel && !speedChangedLocally) {
		channel.trigger('client-control', {
			action: 'speed',
			speed: $('.speed').slider('value')
		});
	}
}
