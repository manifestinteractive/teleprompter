/**
 * TelePrompter v1.2.0 - Browser-based TelePrompter with Remote Control
 * (c) 2021 Peter Schmalfeldt
 * License: https://github.com/manifestinteractive/teleprompter/blob/master/LICENSE
 */
 var TelePrompterRemote = (function() {
  /**
   * ==================================================
   * TelePrompter App Settings
   * ==================================================
   */

  /* DOM Elements used by App */
  var $elm = {};

  var socket, remote;

  /* Store Connection */
  var connected = false;

  /* Support Press & Hold for Remote Buttons */
  var timerID;
  var timeout;
  var pressHoldEvent = new CustomEvent('pressHold');
  var isPressing = false;
  var debounce = 5;
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

  /**
   * ==================================================
   * TelePrompter Init Function
   * ==================================================
   */

  function init() {
    var currentRemote = localStorage.getItem('teleprompter_remote_id');
    var urlParamID = getRemoteId();

    if (urlParamID) {
      remote = 'REMOTE_' + urlParamID.toUpperCase();
      clientConnect(remote);
    } else if (currentRemote && currentRemote.length === 13) {
      remote = currentRemote;
      clientConnect(remote);
    }

    $elm.control = document.getElementById('remote-control');
    $elm.dim = document.getElementById('button-dim');
    $elm.down = document.getElementById('button-down');
    $elm.faster = document.getElementById('button-faster');
    $elm.flipX = document.getElementById('button-flip-x');
    $elm.flipY = document.getElementById('button-flip-y');
    $elm.input = document.getElementsByClassName('remote-id')[0];
    $elm.play = document.getElementById('button-play');
    $elm.power = document.getElementById('button-power');
    $elm.reset = document.getElementById('button-reset');
    $elm.setup = document.getElementById('remote-setup');
    $elm.slider = document.getElementById('slider');
    $elm.sliderSelect = document.getElementById('slider-select');
    $elm.slower = document.getElementById('button-slower');
    $elm.up = document.getElementById('button-up');

    document.addEventListener('focusout', function(e) {
      if (!socket && !remote) {
        handleInput();
      }
    });

    /* Dim Button */
    $elm.dim.addEventListener('click', function(e) {
      e.preventDefault();

      config.dimControls = !config.dimControls;
      updateUI('dim');

      if (socket && remote) {
        socket.emit('sendRemoteControl', 'updateConfig', config);
      }
    });

    /* Scroll Down Button */
    $elm.down.addEventListener('mousedown', pressingDown, false);
    $elm.down.addEventListener('touchstart', pressingDown, false);
    $elm.down.addEventListener('mouseup', notPressingDown, false);
    $elm.down.addEventListener('mouseleave', notPressingDown, false);
    $elm.down.addEventListener('touchend', notPressingDown, false);
    $elm.down.addEventListener('pressHold', handleDownPress, false);
    $elm.down.addEventListener('click', handleDownPress, false);

    /* Faster Button */
    $elm.faster.addEventListener('mousedown', pressingDown, false);
    $elm.faster.addEventListener('touchstart', pressingDown, false);
    $elm.faster.addEventListener('mouseup', notPressingDown, false);
    $elm.faster.addEventListener('mouseleave', notPressingDown, false);
    $elm.faster.addEventListener('touchend', notPressingDown, false);
    $elm.faster.addEventListener('pressHold', handleFasterPress, false);
    $elm.faster.addEventListener('click', handleFasterPress, false);

    /* Flip X Button */
    $elm.flipX.addEventListener('click', function(e) {
      e.preventDefault();

      config.flipX = !config.flipX;
      updateUI('flip-x');

      if (socket && remote) {
        socket.emit('sendRemoteControl', 'updateConfig', config);
      }
    });

    /* Flip Y Button */
    $elm.flipY.addEventListener('click', function(e) {
      e.preventDefault();

      config.flipY = !config.flipY;
      updateUI('flip-y');

      if (socket && remote) {
        socket.emit('sendRemoteControl', 'updateConfig', config);
      }
    });

    /* Remote ID Input */
    $elm.input.addEventListener('keyup', function(e) {
      $elm.input.classList.remove('error');
      $elm.input.classList.remove('success');

      if (e.keyCode == 13) {
        handleInput();
      }
    });

    /* Play Button */
    $elm.play.addEventListener('click', function(e) {
      e.preventDefault();
      if (socket && remote) {
        socket.emit('sendRemoteControl', 'play');
      }
    });

    /* Power Button */
    $elm.power.addEventListener('click', function(e) {
      e.preventDefault();
      if (socket && remote && confirm('Are you sure you want to quit the Remote?')) {
        socket.emit('sendRemoteControl', 'power');
        clientDisconnect();
      }
    });

    /* Reset Button */
    $elm.reset.addEventListener('click', function(e) {
      e.preventDefault();
      if (socket && remote) {
        socket.emit('sendRemoteControl', 'reset');
      }
    });

    /* Slider Change While Dragging */
    $elm.slider.addEventListener('input', function(e) {
      clearTimeout(timeout);

      var control = $elm.sliderSelect.value;
      var val = parseInt(e.target.value);

      if (control === 'font') {
        config.fontSize = val;
      } else if (control === 'scroll') {
        config.pageScrollPercent = val;
      } else if (control === 'speed') {
        config.pageSpeed = val;
      }

      if (socket && remote) {
        timeout = setTimeout(function(){
          socket.emit('sendRemoteControl', 'updateConfig', config);
        }, 100)
      }
    });

    /* Slider Select Change */
    $elm.sliderSelect.addEventListener('change', function(e) {
      var val = e.target.value;

      if (val === 'font') {
        $elm.slider.setAttribute('min', 12);
        $elm.slider.setAttribute('max', 100);
        $elm.slider.value = config.fontSize;
      } else if (val === 'scroll') {
        $elm.slider.setAttribute('min', 0);
        $elm.slider.setAttribute('max', 100);
        $elm.slider.value = config.pageScrollPercent;
      } else if (val === 'speed') {
        $elm.slider.setAttribute('min', 0);
        $elm.slider.setAttribute('max', 50);
        $elm.slider.value = config.pageSpeed;
      }

      $elm.sliderSelect.blur();
    });

    /* Slower Button */
    $elm.slower.addEventListener('mousedown', pressingDown, false);
    $elm.slower.addEventListener('touchstart', pressingDown, false);
    $elm.slower.addEventListener('mouseup', notPressingDown, false);
    $elm.slower.addEventListener('mouseleave', notPressingDown, false);
    $elm.slower.addEventListener('touchend', notPressingDown, false);
    $elm.slower.addEventListener('pressHold', handleSlowerPress, false);
    $elm.slower.addEventListener('click', handleSlowerPress, false);

    /* Scroll Up Button */
    $elm.up.addEventListener('mousedown', pressingDown, false);
    $elm.up.addEventListener('touchstart', pressingDown, false);
    $elm.up.addEventListener('mouseup', notPressingDown, false);
    $elm.up.addEventListener('mouseleave', notPressingDown, false);
    $elm.up.addEventListener('touchend', notPressingDown, false);
    $elm.up.addEventListener('pressHold', handleUpPress, false);
    $elm.up.addEventListener('click', handleUpPress, false);
  }

  /**
   * ==================================================
   * Core Functions
   * ==================================================
   */

  /**
   * Connect Client to Remote using Remote ID
   * @param {String} remote Remote ID
   */
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

      $elm.setup.style.display = 'none';
      $elm.control.style.display = 'flex';

      localStorage.setItem('teleprompter_remote_id', remote);
      document.getElementById('remote-id').innerHTML = remote.replace('REMOTE_', 'REMOTE:&nbsp; ');

      $elm.input.value = '';
      $elm.input.classList.remove('error');
      $elm.input.classList.remove('success');

      socket.emit('sendRemoteControl', 'hideModal');
      socket.emit('sendRemoteControl', 'getConfig');

      connected = true;
    });

    /* Listen for Commands from Client */
    socket.on('clientCommand', function(command, value) {
      switch (command) {
        case 'play':
          $elm.play.classList.remove('icon-play');
          $elm.play.classList.add('icon-pause');
          break;

        case 'stop':
          $elm.play.classList.remove('icon-pause');
          $elm.play.classList.add('icon-play');
          break;

        case 'updateTime':
          document.getElementById('current-time').innerHTML = value;
          break;

        case 'updateConfig':
          config = value;
          clearTimeout(timeout);
          timeout = setTimeout(function(){
            updateUI();
          }, 100);
          break;
      }
    });
  }

  /**
   * Disconnect Client from Remote
   */
  function clientDisconnect() {
    if (socket) {
      socket.disconnect();
    }

    socket = null;
    remote = null;

    localStorage.removeItem('teleprompter_remote_id');

    $elm.setup.style.display = 'flex';
    $elm.control.style.display = 'none';

    connected = false;
  }

  /**
   *  Pull Remote ID from URL if present
   * @returns {String} Remote ID
   */
  function getRemoteId() {
    if (window.location.href.indexOf('id') > -1) {
      return getUrlVars()['id'];
    }

    return null;
  }

  /**
   * Get URL Parameters
   * @returns Object
   */
  function getUrlVars() {
    var paramCount = 0;
    var vars = {};

    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
      paramCount++;
      vars[key] = value;
    });

    return (paramCount > 0) ? vars : null;
  }

  /**
   * Handle Down Press
   * @param {Object} e Event
   */
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

  /**
   * Handle Faster Press
   * @param {Object} e Event
   */
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

  /**
   * Handle Remote ID Input
   */
  function handleInput() {
    if ($elm.input.value && $elm.input.value.length === 6) {
      $elm.input.blur();
      $elm.input.classList.add('success');
      remote = 'REMOTE_' + $elm.input.value.toUpperCase();
      clientConnect(remote);
    } else {
      $elm.input.classList.add('error');
    }
  }

  /**
   * Handle Slower Press
   * @param {Object} e Event
   */
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

  /**
   * Handle Up Press
   * @param {Object} e Event
   */
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

  /**
   * Check if Mouse Down or Touch Down is no longer Active
   * @param {Object} e Event
   */
  function notPressingDown(e) {
    isPressing = false;
    cancelAnimationFrame(timerID);
  }

  /**
   * Check if Mouse Down or Touch Down Active
   * @param {Object} e Event
   */
  function pressingDown(e) {
    count = 0;
    isPressing = true;
    var target = e.target;
    requestAnimationFrame(function() {
      timer(target);
    });
    e.preventDefault();
  }

  /**
   * Handle Long Presses
   * @param {Object} target DOM Element
   */
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

  /**
   * Update UI
   * @param {String} controller What is being controlled
   */
  function updateUI(controller) {
    clearTimeout(timeout);

    // Update Dim Control
    if (!controller || controller === 'dim') {
      if (config.dimControls) {
        $elm.dim.classList.remove('icon-eye-open');
        $elm.dim.classList.add('icon-eye-close');
      } else {
        $elm.dim.classList.remove('icon-eye-close');
        $elm.dim.classList.add('icon-eye-open');
      }
    }

    // Update Flip X Indicator
    if (!controller || controller === 'flip-x') {
      if (config.flipX) {
        $elm.flipX.classList.add('active');
      } else {
        $elm.flipX.classList.remove('active');
      }
    }

    // Update Flip Y Indicator
    if (!controller || controller === 'flip-y') {
      if (config.flipY) {
        $elm.flipY.classList.add('active');
      } else {
        $elm.flipY.classList.remove('active');
      }
    }


    // Update Slider Values
    if (!controller || controller === 'slider') {
      var control = $elm.sliderSelect.value;

      if (control === 'font') {
        $elm.slider.value = config.fontSize;
      } else if (control === 'scroll') {
        $elm.slider.value = config.pageScrollPercent;
      } else if (control === 'speed') {
        $elm.slider.value = config.pageSpeed;
      }
    }
  }

  /* Expose Init to Public TelePrompterRemote Object */
  return {
    init: init
  }
})();
