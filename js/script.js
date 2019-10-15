(function () {
	var initPageSpeed = 35,
	initFontSize = 60,
	scrollDelay,
	textColor = '#ffffff',
	backgroundColor = '#141414',
	socket,
	remote,
	timer = $('.clock').timer({
		stopVal: 10000,
		onChange: function(time) {
			if (socket && remote) {
				socket.emit('clientCommand', 'updateTime', time);
			}
		}
	});

	/**
	 * Config Wrapper to add Local Storage support while maintaining
	 * support for previous cooking settings. All existing cookies will
	 * be ported over to local storage.
	 */
	var config = {
		get: function(key) {
			if (typeof localStorage !== 'undefined' && localStorage[key]) {
				return localStorage[key];
			} else if ($.cookie(key)) {
				var val = $.cookie(key);

				if (typeof localStorage !== 'undefined') {
					localStorage.setItem(key, val);
				}

				return val;
			}
		},
		set: function(key, val) {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(key, val);
			} else {
				$.cookie(key, val);
			}
		}
	};

	window.onload = function() {
		// Check if we've been here before and made changes
		if (config.get('teleprompter_font_size')) {
			initFontSize = config.get('teleprompter_font_size');
		}
		if (config.get('teleprompter_speed')) {
			initPageSpeed = config.get('teleprompter_speed');
		}
		if (config.get('teleprompter_text')) {
			$('#teleprompter').html(config.get('teleprompter_text'));
		}
		if (config.get('teleprompter_text_color')) {
			textColor = config.get('teleprompter_text_color');
			$('#text-color').val(textColor);
			$('#text-color-picker').css('background-color', textColor);
			$('#teleprompter').css('color', textColor);
		}
		if (config.get('teleprompter_background_color')) {
			backgroundColor = config.get('teleprompter_background_color');
			$('#background-color').val(backgroundColor);
			$('#background-color-picker').css('background-color', textColor);
			$('#teleprompter').css('background-color', backgroundColor);
		} else {
			clean_teleprompter();
		}

		// Listen for Key Presses
		$('#teleprompter').keyup(update_teleprompter);
		$('body').keydown(navigate);

		// Setup GUI
		$('article').stop().animate({
			scrollTop: 0
		}, 100, 'linear', function() {
			$('article').clearQueue();
		});
		$('.marker, .overlay').fadeOut(0);
		$('article .teleprompter').css({
			'padding-bottom': Math.ceil($(window).height() - $('header').height()) + 'px'
		});

		// Create Font Size Slider
		$('.font_size').slider({
			min: 12,
			max: 100,
			value: initFontSize,
			orientation: "horizontal",
			range: "min",
			animate: true,
			slide: function() {
				fontSize(true);
			},
			change: function() {
				fontSize(true);
			}
		});

		// Create Speed Slider
		$('.speed').slider({
			min: 0,
			max: 50,
			value: initPageSpeed,
			orientation: "horizontal",
			range: "min",
			animate: true,
			slide: function() {
				speed(true);
			},
			change: function() {
				speed(true);
			}
		});

		$('#text-color').change(function() {
			var color = $(this).val();
			$('#teleprompter').css('color', color);
			config.set('teleprompter_text_color', color);
		});
		$('#background-color').change(function() {
			var color = $(this).val();
			$('#teleprompter').css('background-color', color);
			config.set('teleprompter_background_color', color);
		});

		// Run initial configuration on sliders
		fontSize(false);
		speed(false);

		// Listen for Play Button Click
		$('.button.play').click(function() {
			if ($(this).hasClass('icon-play')) {
				start_teleprompter();
			} else {
				stop_teleprompter();
			}
		});

		// Listen for FlipX Button Click
		$('.button.flipx').click(function() {

			timer.resetTimer();

			if (socket && remote) {
				socket.emit('clientCommand', 'updateTime', '00:00:00');
			}

			if ($('.teleprompter').hasClass('flipy')) {
				$('.teleprompter').removeClass('flipy').toggleClass('flipxy');
			} else {
				$('.teleprompter').toggleClass('flipx');
			}
		});

		// Listen for FlipY Button Click
		$('.button.flipy').click(function() {

			timer.resetTimer();

			if (socket && remote) {
				socket.emit('clientCommand', 'updateTime', '00:00:00');
			}

			if ($('.teleprompter').hasClass('flipx')) {
				$('.teleprompter').removeClass('flipx').toggleClass('flipxy');
			} else {
				$('.teleprompter').toggleClass('flipy');
			}

			if ($('.teleprompter').hasClass('flipy')) {
				$('article').stop().animate({
					scrollTop: $(".teleprompter").height() + 100
				}, 250, 'swing', function() {
					$('article').clearQueue();
				});
			} else {
				$('article').stop().animate({
					scrollTop: 0
				}, 250, 'swing', function() {
					$('article').clearQueue();
				});
			}
		});

		// Listen for Reset Button Click
		$('.button.reset').click(function() {
			stop_teleprompter();
			timer.resetTimer();

			if (socket && remote) {
				socket.emit('clientCommand', 'updateTime', '00:00:00');
			}

			$('article').stop().animate({
				scrollTop: 0
			}, 100, 'linear', function() {
				$('article').clearQueue();
			});
		});

		// Listen for Reset Button Click
		$('.button.remote').click(function() {
			if (!socket && !remote) {
				remote_connect();
			} else {
				$('.remote-modal').css('display', 'flex');
			}
		});

		$('.close-modal').click(function() {
			$('.remote-modal').hide();
		});

		var currentRemote = config.get('remote-id');

		if (currentRemote && currentRemote.length === 6) {
			remote_connect(currentRemote);
		}
	};

	function remote_connect(currentRemote) {
		socket = io.connect('https://promptr.tv', { path: '/remote/socket.io' });
		remote = (currentRemote) ? currentRemote : random_string();

		socket.on('connect', function() {
			socket.emit('connectToRemote', 'REMOTE_' + remote);
			new QRCode(document.getElementById("qr-code"), 'https://promptr.tv/remote?id=' + remote);
			$('.remote-id').text(remote);

			if (!currentRemote) {
				$('.remote-modal').css('display', 'flex');
			}
		});

		socket.on('disconnect', function() {
			$('.button.remote').removeClass('active');
			config.set('remote-id', null);
		});

		socket.on('connectedToRemote', function () {
			config.set('remote-id', remote);
			$('.button.remote').addClass('active');
		});

		socket.on('remoteControl', function (command) {
			switch (command) {
				case 'reset':
					$('.button.reset').trigger('click');
					break;

				case 'power':
					remote_disconnect();
					break;

				case 'up':
					stop_teleprompter();
					pageScroll('up');
					break;

				case 'slower':
					var elm = $('.speed');
					var speed = elm.slider('value');

					speed -= 1;

					if (speed < 0) {
						speed = 0;
					}

					elm.slider('value', speed);
					break;

				case 'play':
					$('.button.play').trigger('click');
					break;

				case 'faster':
					var elm = $('.speed');
					var speed = elm.slider('value');

					speed += 1;

					if (speed > 50) {
						speed = 50;
					}

					elm.slider('value', speed);
					break;

				case 'down':
					stop_teleprompter();
					pageScroll('down');
					break;

				case 'hideModal':
					$('.remote-modal').hide();
					break;
			}
		});
	}

	function remote_disconnect() {
		if (socket && remote) {
			socket.disconnect();
			remote = null;
		}
	}

	function random_string() {
		var chars = "3456789ABCDEFGHJKLMNPQRSTUVWXY";
		var string_length = 6;
		var randomstring = '';

		for (var i=0; i<string_length; i++) {
			var rnum = Math.floor(Math.random() * chars.length);
			randomstring += chars.substring(rnum,rnum+1);
		}

		return randomstring;
	}

	// Manage Font Size Change
	function fontSize(save) {
		initFontSize = $('.font_size').slider("value");

		$('article .teleprompter').css({
			'font-size': initFontSize + 'px',
			'line-height': Math.ceil(initFontSize * 1.5) + 'px',
			'padding-bottom': Math.ceil($(window).height() - $('header').height()) + 'px'
		});

		$('article .teleprompter p').css({
			'padding-bottom': Math.ceil(initFontSize * 0.25) + 'px',
			'margin-bottom': Math.ceil(initFontSize * 0.25) + 'px'
		});

		$('label.font_size_label span').text('(' + initFontSize + ')');

		if (save) {
			config.set('teleprompter_font_size', initFontSize);
		}
	}

	// Manage Speed Change
	function speed(save) {
		initPageSpeed = $('.speed').slider('value');
		$('label.speed_label span').text('(' + $('.speed').slider('value') + ')');
		if (save) {
			config.set('teleprompter_speed', $('.speed').slider('value'));
		}
	}

	// Manage Scrolling Teleprompter
	function pageScroll(direction) {
		var offset = 1;
		var animate = 0;

		if (initPageSpeed == 0) {
			$('article').stop().clearQueue();
			clearTimeout(scrollDelay);
			scrollDelay = setTimeout(pageScroll, 500);
			return;
		}

		if (!direction) {
			direction = 'down'
			clearTimeout(scrollDelay);
			scrollDelay = setTimeout(pageScroll, Math.floor(50 - initPageSpeed));
		} else {
			offset = window.screen.availHeight / 2;
			animate = 500;
		}

		if ($('.teleprompter').hasClass('flipy')) {
			$('article').stop().animate({
				scrollTop: (direction === 'down') ? '-=' + offset + 'px' : '+=' + offset + 'px'
			}, animate, 'linear', function() {
				$('article').clearQueue();
			});

			// We're at the bottom of the document, stop
			if ($("article").scrollTop() === 0) {
				stop_teleprompter();
				setTimeout(function() {
					$('article').stop().animate({
						scrollTop: $(".teleprompter").height() + 100
					}, 500, 'swing', function() {
						$('article').clearQueue();
					});
				}, 500);
			}
		} else {
			$('article').stop().animate({
				scrollTop: (direction === 'down') ? '+=' + offset + 'px' : '-=' + offset + 'px'
			}, animate, 'linear', function() {
				$('article').clearQueue();
			});

			// We're at the bottom of the document, stop
			if ($("article").scrollTop() >= (($("article")[0].scrollHeight - $(window).height()) - 100)) {
				stop_teleprompter();
				setTimeout(function() {
					$('article').stop().animate({
						scrollTop: 0
					}, 500, 'swing', function() {
						$('article').clearQueue();
					});
				}, 500);
			}
		}
	}

	// Listen for Key Presses on Body
	function navigate(evt) {
		var space = 32,
			escape = 27,
			left = 37,
			up = 38,
			right = 39,
			down = 40,
			speed = $('.speed').slider('value'),
			font_size = $('.font_size').slider('value');

		// Exit if we're inside an input field
		if (typeof evt.target.id == 'undefined' || evt.target.id == 'teleprompter') {
			return;
		} else if (typeof evt.target.id == 'undefined' || evt.target.id != 'gui') {
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}

		// Reset GUI
		if (evt.keyCode == escape) {
			$('.button.reset').trigger('click');
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
		// Start Stop Scrolling
		else if (evt.keyCode == space) {
			$('.button.play').trigger('click');
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
		// Decrease Speed with Left Arrow
		else if (evt.keyCode == left) {
			$('.speed').slider('value', speed - 1);
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
		// Decrease Font Size with Down Arrow
		else if (evt.keyCode == down) {
			$('.font_size').slider('value', font_size - 1);
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
		// Increase Font Size with Up Arrow
		else if (evt.keyCode == up) {
			$('.font_size').slider('value', font_size + 1);
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
		// Increase Speed with Right Arrow
		else if (evt.keyCode == right) {
			$('.speed').slider('value', speed + 1);
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
	}

	// Start Teleprompter
	function start_teleprompter() {
		if (socket && remote) {
			socket.emit('clientCommand', 'play');
		}

		$('#teleprompter').attr('contenteditable', false);
		$('body').addClass('playing');
		$('.button.play').removeClass('icon-play').addClass('icon-pause');
		$('header h1, header nav').fadeTo('slow', 0.15);
		$('.marker, .overlay').fadeIn('slow');

		timer.startTimer();

		pageScroll();
	}

	// Stop Teleprompter
	function stop_teleprompter() {
		if (socket && remote) {
			socket.emit('clientCommand', 'stop');
		}

		clearTimeout(scrollDelay);
		$('#teleprompter').attr('contenteditable', true);
		$('header h1, header nav').fadeTo('slow', 1);
		$('.button.play').removeClass('icon-pause').addClass('icon-play');
		$('.marker, .overlay').fadeOut('slow');
		$('body').removeClass('playing');

		timer.stopTimer();
	}

	// Update Teleprompter
	function update_teleprompter() {
		config.set('teleprompter_text', $('#teleprompter').html());
	}

	// Clean Teleprompter
	function clean_teleprompter() {
		var text = $('#teleprompter').html();
		text = text.replace(/<br>+/g, '@@').replace(/@@@@/g, '</p><p>');
		text = text.replace(/@@/g, '<br>');
		text = text.replace(/([a-z])\. ([A-Z])/g, '$1.&nbsp;&nbsp; $2');
		text = text.replace(/<p><\/p>/g, '');

		if (text.substr(0, 3) !== '<p>') {
			text = '<p>' + text + '</p>';
		}

		$('#teleprompter').html(text);
	}
})();
