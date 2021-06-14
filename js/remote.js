(function() {
  var socket, remote;

  /* Store Connection */
  var connected = false;

  /* Support Press & Hold for Remote Buttons */
  var timerID;
  var pressHoldEvent = new CustomEvent('pressHold');
  var isPressing = false;
  var debounce = 3;
  var count = 0;

  /* Default App Settings */
  var defaultConfig = {
	  backgroundColor: '#141414',
    dimControls: true,
    flipX: false,
    flipY: false,
    fontSize: 60,
    pageSpeed: 35,
    pageScrollPercent: 0,
    textColor: '#ffffff'
  };

  /* Custom App Settings */
  var config = Object.assign({}, defaultConfig);

  /* Local Storage Wrapper */
  var storage = {
    get: function(key) {
      if (typeof localStorage !== 'undefined' && localStorage[key]) {
        return localStorage[key];
      }
    },
    set: function(key, val) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, val);
      }
    }
  };

  window.onload = function() {
    var $control = document.getElementById('remote-control');
    var $dim = document.getElementById('button-dim');
    var $down = document.getElementById('button-down');
    var $faster = document.getElementById('button-faster');
    var $flipX = document.getElementById('button-flip-x');
    var $flipY = document.getElementById('button-flip-y');
    var $input = document.getElementsByClassName('remote-id')[0];
    var $play = document.getElementById('button-play');
    var $power = document.getElementById('button-power');
    var $reset = document.getElementById('button-reset');
    var $setup = document.getElementById('remote-setup');
    var $slider = document.getElementById('slider');
    var $sliderSelect = document.getElementById('slider-select');
    var $slower = document.getElementById('button-slower');
    var $up = document.getElementById('button-up');

    var currentRemote = storage.get('remote-id');
    var urlParamID = getRemoteId();

    if (urlParamID) {
      remote = 'REMOTE_' + urlParamID.toUpperCase();
      clientConnect(remote);
    } else if (currentRemote && currentRemote.length === 13) {
      remote = currentRemote;
      clientConnect(remote);
    }

    document.addEventListener('focusout', function(e) {
      if (!socket && !remote) {
        handleInput();
      }
    });

    /* Dim Button */
    $dim.addEventListener('click', function(e) {
      e.preventDefault();

      config.dimControls = !config.dimControls;
      updateUI('dim');

      if (socket && remote) {
        socket.emit('sendRemoteControl', 'updateConfig', config);
      }
    });

    /* Scroll Down Button */
    $down.addEventListener('mousedown', pressingDown, false);
    $down.addEventListener('touchstart', pressingDown, false);
    $down.addEventListener('mouseup', notPressingDown, false);
    $down.addEventListener('mouseleave', notPressingDown, false);
    $down.addEventListener('touchend', notPressingDown, false);
    $down.addEventListener('pressHold', handleDownPress, false);
    $down.addEventListener('click', handleDownPress, false);

    /* Faster Button */
    $faster.addEventListener('mousedown', pressingDown, false);
    $faster.addEventListener('touchstart', pressingDown, false);
    $faster.addEventListener('mouseup', notPressingDown, false);
    $faster.addEventListener('mouseleave', notPressingDown, false);
    $faster.addEventListener('touchend', notPressingDown, false);
    $faster.addEventListener('pressHold', handleFasterPress, false);
    $faster.addEventListener('click', handleFasterPress, false);

    /* Flip X Button */
    $flipX.addEventListener('click', function(e) {
      e.preventDefault();

      config.flipX = !config.flipX;
      updateUI('flip-x');

      if (socket && remote) {
        socket.emit('sendRemoteControl', 'updateConfig', config);
      }
    });

    /* Flip Y Button */
    $flipY.addEventListener('click', function(e) {
      e.preventDefault();

      config.flipY = !config.flipY;
      updateUI('flip-y');

      if (socket && remote) {
        socket.emit('sendRemoteControl', 'updateConfig', config);
      }
    });

    /* Remote ID Input */
    $input.addEventListener('keyup', function(e) {
      $input.classList.remove('error');
      $input.classList.remove('success');

      if (e.keyCode == 13) {
        handleInput();
      }
    });

    /* Play Button */
    $play.addEventListener('click', function(e) {
      e.preventDefault();
      if (socket && remote) {
        socket.emit('sendRemoteControl', 'play');
      }
    });

    /* Power Button */
    $power.addEventListener('click', function(e) {
      e.preventDefault();
      if (socket && remote && confirm('Are you sure you want to quit the Remote?')) {
        socket.emit('sendRemoteControl', 'power');
        clientDisconnect();
      }
    });

    /* Reset Button */
    $reset.addEventListener('click', function(e) {
      e.preventDefault();
      if (socket && remote) {
        socket.emit('sendRemoteControl', 'reset');
      }
    });

    /* Slider Change While Dragging */
    $slider.addEventListener('input', function(e) {
      var control = $sliderSelect.value;
      var val = parseInt(e.target.value);

      if (control === 'font') {
        config.fontSize = val;
      } else if (control === 'scroll') {
        config.pageScrollPercent = val;
      } else if (control === 'speed') {
        config.pageSpeed = val;
      }

      console.log(config)

      if (socket && remote) {
        socket.emit('sendRemoteControl', 'updateConfig', config);
      }
    });

    /* Slider Select Change */
    $sliderSelect.addEventListener('change', function(e) {
      var val = e.target.value;

      if (val === 'font') {
        $slider.setAttribute('min', 12);
        $slider.setAttribute('max', 100);
        $slider.value = config.fontSize;
      } else if (val === 'scroll') {
        $slider.setAttribute('min', 0);
        $slider.setAttribute('max', 100);
        $slider.value = config.pageScrollPercent;
      } else if (val === 'speed') {
        $slider.setAttribute('min', 0);
        $slider.setAttribute('max', 50);
        $slider.value = config.pageSpeed;
      }

      $sliderSelect.blur();
    });

    /* Slower Button */
    $slower.addEventListener('mousedown', pressingDown, false);
    $slower.addEventListener('touchstart', pressingDown, false);
    $slower.addEventListener('mouseup', notPressingDown, false);
    $slower.addEventListener('mouseleave', notPressingDown, false);
    $slower.addEventListener('touchend', notPressingDown, false);
    $slower.addEventListener('pressHold', handleSlowerPress, false);
    $slower.addEventListener('click', handleSlowerPress, false);

    /* Scroll Up Button */
    $up.addEventListener('mousedown', pressingDown, false);
    $up.addEventListener('touchstart', pressingDown, false);
    $up.addEventListener('mouseup', notPressingDown, false);
    $up.addEventListener('mouseleave', notPressingDown, false);
    $up.addEventListener('touchend', notPressingDown, false);
    $up.addEventListener('pressHold', handleUpPress, false);
    $up.addEventListener('click', handleUpPress, false);

    function getUrlVars() {
      var vars = {};
      window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key,
        value) {
        vars[key] = value;
      });
      return vars;
    }

    function getRemoteId() {
      if (window.location.href.indexOf('id') > -1) {
        return getUrlVars()['id'];
      }

      return null;
    }

    function handleInput() {
      if ($input.value && $input.value.length === 6) {
        $input.blur();
        $input.classList.add('success');
        remote = 'REMOTE_' + $input.value.toUpperCase();
        clientConnect(remote);
      } else {
        $input.classList.add('error');
      }
    }

    function pressingDown(e) {
      count = 0;
      isPressing = true;
      var target = e.target;
      requestAnimationFrame(function() {
        timer(target);
      });
      e.preventDefault();
    }

    function notPressingDown(e) {
      isPressing = false;
      cancelAnimationFrame(timerID);
    }

    function timer(target) {
      if (isPressing) {
        count++;
        // Debounce how quickly this runs
        if (count === debounce) {
          count = 0;
          timerID = requestAnimationFrame(function() {
            target.dispatchEvent(pressHoldEvent);
            timer(target);
          });
        } else {
          // Don't Dispatch Event, but Keep Running
          timerID = requestAnimationFrame(function() {
            timer(target);
          });
        }
      }
    }

    function handleDownPress(e) {
      e.preventDefault();

      config.pageScrollPercent += 1;

      if (config.pageScrollPercent > 100) {
        config.pageScrollPercent = 100;
      }

      updateUI('slider');

      if (socket && remote) {
        socket.emit('sendRemoteControl', 'updateConfig', config);
      }
    }

    function handleUpPress(e) {
      e.preventDefault();

      config.pageScrollPercent -= 1;

      if (config.pageScrollPercent < 0) {
        config.pageScrollPercent = 0;
      }

      updateUI('slider');

      if (socket && remote) {
        socket.emit('sendRemoteControl', 'updateConfig', config);
      }
    }

    function handleFasterPress(e) {
      e.preventDefault();

      config.pageSpeed += 1;

      if (config.pageSpeed > 50) {
        config.pageSpeed = 50;
      }

      updateUI('slider');

      if (socket && remote) {
        socket.emit('sendRemoteControl', 'updateConfig', config);
      }
    }

    function handleSlowerPress(e) {
      e.preventDefault();

      config.pageSpeed -= 1;

      if (config.pageSpeed < 0) {
        config.pageSpeed = 0;
      }

      updateUI('slider');

      if (socket && remote) {
        socket.emit('sendRemoteControl', 'updateConfig', config);
      }
    }

    function clientConnect(remote) {
      socket = (window.location.hostname === 'promptr.tv')
        ? io.connect('https://promptr.tv', { path: '/remote/socket.io' })
        : io.connect('http://' + window.location.hostname + ':3000', { path: '/socket.io' });


      socket.on('connect', function() {
        socket.emit('connectToRemote', remote);
      });

      /* On Remote Connect, do initial setup and config */
      socket.on('connectedToRemote', function(id) {
        if (connected) {
          return;
        }

        $setup.style.display = 'none';
        $control.style.display = 'flex';

        storage.set('remote-id', remote);
        document.getElementById('remote-id').innerHTML = remote.replace('REMOTE_', 'REMOTE:&nbsp; ');

        $input.value = '';
        $input.classList.remove('error');
        $input.classList.remove('success');

        socket.emit('sendRemoteControl', 'hideModal');
        socket.emit('sendRemoteControl', 'getConfig');

        connected = true;
      });

      /* Listen for Commands from Client */
      socket.on('clientCommand', function(command, value) {
        switch (command) {
          case 'play':
            $play.classList.remove('icon-play');
            $play.classList.add('icon-pause');
            break;

          case 'stop':
            $play.classList.remove('icon-pause');
            $play.classList.add('icon-play');
            break;

          case 'updateTime':
            document.getElementById('current-time').innerHTML = value;
            break;

          case 'updateConfig':
            console.log(value);
            config = value;
            updateUI();
            break;
        }
      });
    }

    function clientDisconnect() {
      if (socket) {
        socket.disconnect();
      }

      socket = null;
      remote = null;

      storage.set('remote-id', null);

      $setup.style.display = 'flex';
      $control.style.display = 'none';

      connected = false;
    }

    function updateUI(controller) {
      // Update Dim Control
      if (!controller || controller === 'dim') {
        if (config.dimControls) {
          $dim.classList.remove('icon-eye-open');
          $dim.classList.add('icon-eye-close');
        } else {
          $dim.classList.remove('icon-eye-close');
          $dim.classList.add('icon-eye-open');
        }
      }

      // Update Flip X Indicator
      if (!controller || controller === 'flip-x') {
        if (config.flipX) {
          $flipX.classList.add('active');
        } else {
          $flipX.classList.remove('active');
        }
      }

      // Update Flip Y Indicator
      if (!controller || controller === 'flip-y') {
        if (config.flipY) {
          $flipY.classList.add('active');
        } else {
          $flipY.classList.remove('active');
        }
      }


      // Update Slider Values
      if (!controller || controller === 'slider') {
        var control = $sliderSelect.value;

        if (control === 'font') {
          $slider.value = config.fontSize;
        } else if (control === 'scroll') {
          $slider.value = config.pageScrollPercent;
        } else if (control === 'speed') {
          $slider.value = config.pageSpeed;
        }
      }
    }
  };
})();
