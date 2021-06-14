(function() {
  var isPlaying = false,
    remote,
    scrollDelay,
    socket,
    modalOpen = false,
    timeout = null,
    timer = $('.clock').timer({
      stopVal: 10000,
      onChange: function(time) {
        if (socket && remote) {
          socket.emit('clientCommand', 'updateTime', time);
        }
      }
    });

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

  /* Cache DOM Elements */
  var $article,
    $backgroundColor,
    $body,
    $buttonDimControls,
    $buttonFlipX,
    $buttonFlipY,
    $buttonPlay,
    $buttonRemote,
    $buttonReset,
    $closeModal,
    $fontSize,
    $header,
    $headerContent,
    $markerOverlay,
    $remoteID,
    $remoteModal,
    $remoteURL,
    $speed,
    $teleprompter,
    $textColor,
    $window;

  /**
   * Storage Wrapper to add Local Storage support while maintaining
   * support for previous cooking settings. All existing cookies will
   * be ported over to local storage.
   */
  var storage = {
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

      updateURL();
    }
  };

  /**
   * Clean Teleprompter
   */
  function cleanTeleprompter() {
    var text = $teleprompter.html();
    text = text.replace(/<br>+/g, '@@').replace(/@@@@/g, '</p><p>');
    text = text.replace(/@@/g, '<br>');
    text = text.replace(/([a-z])\. ([A-Z])/g, '$1.&nbsp;&nbsp; $2');
    text = text.replace(/<p><\/p>/g, '');

    if (text && text.substr(0, 3) !== '<p>') {
      text = '<p>' + text + '</p>';
    }

    $teleprompter.html(text);
    $('p:empty', $teleprompter).remove();
  }

  /**
   * Handle Background Color
   */
  function handleBackgroundColor() {
    config.backgroundColor = $backgroundColor.val();

    $teleprompter.css('background-color', config.backgroundColor);
    $article.css('background-color', config.backgroundColor);
    $body.css('background-color', config.backgroundColor);
    storage.set('teleprompter_background_color', config.backgroundColor);

    if (socket && remote) {
      socket.emit('clientCommand', 'updateConfig', config);
    }
  }

  /**
   * Handle Closing Modal
   */
  function handleCloseModal() {
    $remoteModal.hide();
    $buttonRemote.focus();

    modalOpen = false;
  }

  /**
   * Handle Dimming Layovers
   */
  function handleDim(evt, skipUpdate) {
    if (config.dimControls) {
      config.dimControls = false;
      $buttonDimControls.removeClass('icon-eye-close').addClass('icon-eye-open');
      $headerContent.fadeTo('slow', 1);
      $markerOverlay.fadeOut('slow');
    } else {
      config.dimControls = true;
      $buttonDimControls.removeClass('icon-eye-open').addClass('icon-eye-close');

      if (isPlaying) {
        $headerContent.fadeTo('slow', 0.15);
        $markerOverlay.fadeIn('slow');
      }
    }

    storage.set('teleprompter_dim_controls', config.dimControls);

    if (socket && remote && !skipUpdate) {
      socket.emit('clientCommand', 'updateConfig', config);
    }
  }

  /**
   * Handle Flipping Text Horizontally
   */
  function handleFlipX(evt, skipUpdate) {
    timer.resetTimer();

    if (socket && remote) {
      socket.emit('clientCommand', 'updateTime', '00:00:00');
    }

    // Remove Flip Classes
    $teleprompter.removeClass('flip-x').removeClass('flip-xy');

    if (config.flipX) {
      config.flipX = false;

      $buttonFlipX.removeClass('active');
    } else {
      config.flipX = true;

      $buttonFlipX.addClass('active');

      if (config.flipY) {
        $teleprompter.addClass('flip-xy');
      } else {
        $teleprompter.addClass('flip-x');
      }
    }

    storage.set('teleprompter_flip_x', config.flipX);

    if (socket && remote && !skipUpdate) {
      socket.emit('clientCommand', 'updateConfig', config);
    }
  }

  /**
   * Handle Flipping Text Vertically
   */
  function handleFlipY(evt, skipUpdate) {
    timer.resetTimer();

    if (socket && remote) {
      socket.emit('clientCommand', 'updateTime', '00:00:00');
    }

    // Remove Flip Classes
    $teleprompter.removeClass('flip-y').removeClass('flip-xy');

    if (config.flipY) {
      config.flipY = false;

      $buttonFlipY.removeClass('active');
    } else {
      config.flipY = true;

      $buttonFlipY.addClass('active');

      if (config.flipX) {
        $teleprompter.addClass('flip-xy');
      } else {
        $teleprompter.addClass('flip-y');
      }
    }

    storage.set('teleprompter_flip_y', config.flipY);

    if (config.flipY) {
      $article.stop().animate({
        scrollTop: $teleprompter.height() + 100
      }, 250, 'swing', function() {
        $article.clearQueue();
      });
    } else {
      $article.stop().animate({
        scrollTop: 0
      }, 250, 'swing', function() {
        $article.clearQueue();
      });
    }

    if (socket && remote && !skipUpdate) {
      socket.emit('clientCommand', 'updateConfig', config);
    }
  }

  /**
   * Handle Updating Text Color
   */
  function handleTextColor() {
    config.textColor = $textColor.val();

    $teleprompter.css('color', config.textColor);
    storage.set('teleprompter_text_color', config.textColor);

    if (socket && remote) {
      socket.emit('clientCommand', 'updateConfig', config);
    }
  }

  /**
   * Handle Play Button Press
   */
  function handlePlay() {
    if (!isPlaying) {
      startTeleprompter();
    } else {
      stopTeleprompter();
    }
  }

  /**
   * Handle Remote Button Press
   */
  function handleRemote() {
    if (!socket && !remote) {
      var currentRemote = storage.get('remote-id');
      remoteConnect(currentRemote);
    } else {
      $remoteModal.css('display', 'flex');
    }

    $buttonRemote.blur();
    modalOpen = true;
  }

  /**
   * Handle Reset Button Press
   */
  function handleReset() {
    stopTeleprompter();
    timer.resetTimer();

    config.pageScrollPercent = 0;

    $article.stop().animate({
      scrollTop: 0
    }, 100, 'linear', function() {
      $article.clearQueue();
    });

    if (socket && remote) {
      socket.emit('clientCommand', 'updateTime', '00:00:00');
      socket.emit('clientCommand', 'updateConfig', config);
    }
  }

  /**
   * Listen for Keyboard Navigation
   */
  function navigate(evt) {
    var space = 32,
      escape = 27,
      left = 37,
      up = 38,
      right = 39,
      down = 40,
      page_up = 33,
      page_down = 34,
      b_key = 66,
      f5_key = 116,
      period_key = 190,
      tab = 9,
      speed = $speed.slider('value'),
      font_size = $fontSize.slider('value');

    // TODO: Check for other presentation remotes and see what keyboard commands they issue to Map to Teleprompter

    // Allow text edit if we're inside an input field or tab key press
    if (evt.target.id === 'teleprompter' || evt.keyCode === tab) {
      return;
    }

    // Check if Escape Key and Modal Open
    if (evt.keyCode == escape && modalOpen) {
      $remoteModal.hide();
      $buttonRemote.focus();
      modalOpen = false;
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }

    // Skip if UI element or Modal Open
    if (modalOpen || evt.target.nodeName === 'INPUT' || evt.target.nodeName === 'BUTTON' || evt.target.nodeName === 'A') {
      return;
    }

    // Reset GUI
    if (evt.keyCode == escape) {
      $buttonReset.trigger('click');
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
    // Start Stop Scrolling
    else if (evt.keyCode == space || [b_key, f5_key, period_key].includes(evt.keyCode)) {
      $buttonPlay.trigger('click');
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
    // Decrease Speed
    else if (evt.keyCode == left || evt.keyCode == page_up) {
      $speed.slider('value', speed - 1);
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
    // Decrease Font Size
    else if (evt.keyCode == down) {
      $fontSize.slider('value', font_size - 1);
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
    // Increase Font Size
    else if (evt.keyCode == up) {
      $fontSize.slider('value', font_size + 1);
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
    // Increase Speed
    else if (evt.keyCode == right || evt.keyCode == page_down) {
      $speed.slider('value', speed + 1);
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
  }

  /**
   * Manage Scrolling Teleprompter
   */
  function pageScroll() {
    var offset = 1;
    var animate = 0;

    if (config.pageSpeed == 0) {
      $('article').stop().clearQueue();
      clearTimeout(scrollDelay);
      scrollDelay = setTimeout(pageScroll, 500);
      return;
    }

    clearTimeout(scrollDelay);
    scrollDelay = setTimeout(pageScroll, Math.floor(50 - config.pageSpeed));

    if ($teleprompter.hasClass('flip-y')) {
      $article.stop().animate({
        scrollTop: '-=' + offset + 'px'
      }, animate, 'linear', function() {
        $article.clearQueue();
      });

      // We're at the bottom of the document, stop
      if ($article.scrollTop() === 0) {
        stopTeleprompter();
        setTimeout(function() {
          $article.stop().animate({
            scrollTop: $teleprompter.height() + 100
          }, 500, 'swing', function() {
            $article.clearQueue();
          });
        }, 500);
      }
    } else {
      $article.stop().animate({
        scrollTop: '+=' + offset + 'px'
      }, animate, 'linear', function() {
        $article.clearQueue();
      });

      // We're at the bottom of the document, stop
      if ($article.scrollTop() >= (($article[0].scrollHeight - $window.height()) - 100)) {
        stopTeleprompter();
        setTimeout(function() {
          $article.stop().animate({
            scrollTop: 0
          }, 500, 'swing', function() {
            $article.clearQueue();
          });
        }, 500);
      }
    }

    // Update pageScrollPercent
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      var $win = $article[0];
      var scrollHeight = $win.scrollHeight;
      var scrollTop = $win.scrollTop;
      var clientHeight = $win.clientHeight;

      config.pageScrollPercent = Math.round(((scrollTop / (scrollHeight - clientHeight)) + Number.EPSILON) * 100);

      if (socket && remote) {
        socket.emit('clientCommand', 'updateConfig', config);
      }
    }, animate);
  }

  /**
   * Create Random String for Remote
   * @returns string
   */
  function randomString() {
    var chars = '3456789ABCDEFGHJKLMNPQRSTUVWXY';
    var length = 6;
    var string = '';

    for (var i = 0; i < length; i++) {
      var num = Math.floor(Math.random() * chars.length);
      string += chars.substring(num, num + 1);
    }

    return string;
  }

  /**
   * Connect to Remote
   * @param {String} currentRemote Current Remote ID
   */
  function remoteConnect(currentRemote) {
    if (typeof io === 'undefined') {
      $buttonRemote.removeClass('active');
      storage.set('remote-id', null);
      return;
    }

    socket = (window.location.hostname === 'promptr.tv') ?
      io.connect('https://promptr.tv', {
        path: '/remote/socket.io'
      }) :
      io.connect('http://' + window.location.hostname + ':3000', {
        path: '/socket.io'
      });

    remote = (currentRemote) ? currentRemote : randomString();

    socket.on('connect', function() {
      var $code = document.getElementById('qr-code');
      $code.innerHTML = '';
      socket.emit('connectToRemote', 'REMOTE_' + remote);

      $remoteURL.text((window.location.hostname === 'promptr.tv') ? 'https://promptr.tv/remote' : 'http://' + window.location.hostname + ':3000');

      var url = (window.location.hostname === 'promptr.tv') ?
        'https://promptr.tv/remote?id=' + remote :
        'http://' + window.location.hostname + ':3000/?id=' + remote;

      new QRCode($code, url);
      $remoteID.text(remote);

      if (!currentRemote) {
        $remoteModal.css('display', 'flex');
      }
    });

    socket.on('disconnect', function() {
      $buttonRemote.removeClass('active');
      //storage.set('remote-id', null);
    });

    socket.on('connectedToRemote', function() {
      storage.set('remote-id', remote);
      $buttonRemote.addClass('active');
      socket.emit('clientCommand', 'updateConfig', config);
    });

    socket.on('remoteControl', function(command, value) {
      console.log('remoteControl', command, value);

      switch (command) {
        case 'reset':
          handleReset();
          break;

        case 'power':
          remoteDisconnect();
          break;

        case 'play':
          $buttonPlay.trigger('click');
          break;

        case 'hideModal':
          $remoteModal.hide();
          break;

        case 'getConfig':
          if (socket && remote) {
            socket.emit('clientCommand', 'updateConfig', config);
          }
          break;

        case 'updateConfig':
          remoteUpdate(config, value);
          break;
      }
    });
  }

  /**
   * Disconnect from Remote
   */
  function remoteDisconnect() {
    if (socket && remote) {
      socket.disconnect();
      remote = null;
    }
  }

  /**
   * Handle Updates from Remote
   * @param {object} oldConfig
   */
  function remoteUpdate(oldConfig, newConfig) {
    if (oldConfig.dimControls !== newConfig.dimControls) {
      handleDim(null, true);
    }

    if (oldConfig.flipX !== newConfig.flipX) {
      handleFlipX(null, true);
    }

    if (oldConfig.flipY !== newConfig.flipY) {
      handleFlipY(null, true);
    }

    if (oldConfig.fontSize !== newConfig.fontSize) {
      $fontSize.slider('value', newConfig.fontSize);
      updateFontSize(true, true);
    }

    if (oldConfig.pageSpeed !== newConfig.pageSpeed) {
      $speed.slider('value', newConfig.pageSpeed);
      updateSpeed(true, true);
    }

    if (oldConfig.pageScrollPercent !== newConfig.pageScrollPercent) {
      config.pageScrollPercent = newConfig.pageScrollPercent;

      stopTeleprompter();

      var $win = $article[0];
      var scrollHeight = $win.scrollHeight;
      var clientHeight = $win.clientHeight;

      var maxScrollStop = (scrollHeight - clientHeight);
      var percent = parseInt(config.pageScrollPercent) / 100;
      var newScrollTop = maxScrollStop * percent

      $article.stop().animate({
        scrollTop: newScrollTop + 'px'
      }, 0, 'linear', function() {
        $article.clearQueue();
      });
    }
  }

  /**
   * Start Teleprompter
   */
  function startTeleprompter() {
    // Check if Already Playing
    if (isPlaying) {
      return;
    }

    if (socket && remote) {
      socket.emit('clientCommand', 'play');
    }

    $teleprompter.attr('contenteditable', false);
    $body.addClass('playing');
    $buttonPlay.removeClass('icon-play').addClass('icon-pause');

    if (config.dimControls) {
      $headerContent.fadeTo('slow', 0.15);
      $markerOverlay.fadeIn('slow');
    }

    timer.startTimer();

    pageScroll();

    isPlaying = true;
  }

  /**
   * Stop Teleprompter
   */
  function stopTeleprompter() {
    // Check if Already Stopped
    if (!isPlaying) {
      return;
    }

    if (socket && remote) {
      socket.emit('clientCommand', 'stop');
    }

    clearTimeout(scrollDelay);
    $teleprompter.attr('contenteditable', true);

    if (config.dimControls) {
      $headerContent.fadeTo('slow', 1);
      $markerOverlay.fadeOut('slow');
    }

    $buttonPlay.removeClass('icon-pause').addClass('icon-play');
    $body.removeClass('playing');

    timer.stopTimer();

    isPlaying = false;
  }

  /**
   * Manage Font Size Change
   */
  function updateFontSize(save, skipUpdate) {
    config.fontSize = $fontSize.slider('value');

    $teleprompter.css({
      'font-size': config.fontSize + 'px',
      'line-height': Math.ceil(config.fontSize * 1.5) + 'px',
      'padding-bottom': Math.ceil($window.height() - $header.height()) + 'px'
    });

    $('p', $teleprompter).css({
      'padding-bottom': Math.ceil(config.fontSize * 0.25) + 'px',
      'margin-bottom': Math.ceil(config.fontSize * 0.25) + 'px'
    });

    $('label.font_size_label span').text('(' + config.fontSize + ')');

    if (save) {
      storage.set('teleprompter_font_size', config.fontSize);
    }

    if (socket && remote && !skipUpdate) {
      socket.emit('clientCommand', 'updateConfig', config);
    }
  }

  /**
   * Manage Speed Change
   */
  function updateSpeed(save, skipUpdate) {
    config.pageSpeed = $('.speed').slider('value');
    $('label.speed_label span').text('(' + $speed.slider('value') + ')');

    if (save) {
      storage.set('teleprompter_speed', $speed.slider('value'));
    }

    if (socket && remote && !skipUpdate) {
      socket.emit('clientCommand', 'updateConfig', config);
    }
  }

  /**
   * Update Teleprompter
   */
  function updateTeleprompter(evt) {
    if (evt.keyCode == 27) {
      $teleprompter.blur();
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }

    storage.set('teleprompter_text', $teleprompter.html());
    $('p:empty', $teleprompter).remove();
  }

  /**
   * Push Config Params into URL for Sharable Configuration
   */
  function updateURL() {
    var custom = Object.assign({}, config);
    var keys = Object.keys(custom);

    keys.forEach(function(key) {
      // Remove Default Settings from URL
      if (custom[key] === defaultConfig[key]) {
        delete custom[key];
      }
    });

    if (Object.keys(custom).length > 0) {
      var urlParams = new URLSearchParams(custom);
      window.history.pushState(custom, 'TelePrompter', '/?' + urlParams);
    } else {
      window.history.pushState(null, 'TelePrompter', '/');
    }
  }

  /**
   * Document OnReady Event
   */
  $(function() {
    // Update DOM Selector Cache
    $article = $('article');
    $backgroundColor = $('#background-color');
    $body = $('body');
    $buttonDimControls = $('.button.dim-controls');
    $buttonFlipX = $('.button.flip-x');
    $buttonFlipY = $('.button.flip-y');
    $buttonPlay = $('.button.play');
    $buttonRemote = $('.button.remote');
    $buttonReset = $('.button.reset');
    $closeModal = $('.close-modal');
    $fontSize = $('.font_size');
    $header = $('header');
    $headerContent = $('header h1, header nav');
    $markerOverlay = $('.marker, .overlay');
    $remoteID = $('.remote-id');
    $remoteModal = $('.remote-modal');
    $remoteURL = $('.remote-url');
    $speed = $('.speed');
    $teleprompter = $('#teleprompter');
    $textColor = $('#text-color');
    $window = $(window);

    // Check if we've been here before and made changes
    if (storage.get('teleprompter_background_color')) {
      config.backgroundColor = storage.get('teleprompter_background_color');

      // Update UI with Custom Background Color
      $backgroundColor.val(config.backgroundColor);
      $article.css('background-color', config.backgroundColor);
      $body.css('background-color', config.backgroundColor);
      $teleprompter.css('background-color', config.backgroundColor);
    } else {
      cleanTeleprompter();
    }

    if (storage.get('teleprompter_dim_controls')) {
      config.dimControls = storage.get('teleprompter_dim_controls') === 'true';

      // Update Indicator
      if (config.dimControls) {
        $buttonDimControls.removeClass('icon-eye-open').addClass('icon-eye-close');
      } else {
        $buttonDimControls.removeClass('icon-eye-close').addClass('icon-eye-open');
      }
    }

    if (storage.get('teleprompter_flip_x')) {
      config.flipX = storage.get('teleprompter_flip_x') === 'true';

      // Update Indicator
      if (config.flipX) {
        $buttonFlipX.addClass('active');
      }
    }

    if (storage.get('teleprompter_flip_y')) {
      config.flipY = storage.get('teleprompter_flip_y') === 'true';

      // Update Indicator
      if (config.flipY) {
        $buttonFlipY.addClass('active');
      }
    }

    if (storage.get('teleprompter_font_size')) {
      config.fontSize = storage.get('teleprompter_font_size');
    }

    if (storage.get('teleprompter_speed')) {
      config.pageSpeed = storage.get('teleprompter_speed');
    }

    if (storage.get('teleprompter_text')) {
      $teleprompter.html(storage.get('teleprompter_text'));
    }

    if (storage.get('teleprompter_text_color')) {
      config.textColor = storage.get('teleprompter_text_color');
      $textColor.val(config.textColor);
      $teleprompter.css('color', config.textColor);
    }

    // Update Flip text if Present
    if (config.flipX && config.flipY) {
      $teleprompter.addClass('flip-xy');
    } else if (config.flipX) {
      $teleprompter.addClass('flip-x');
    } else if (config.flipY) {
      $teleprompter.addClass('flip-y');
    }

    // Listen for Key Presses
    $teleprompter.keyup(updateTeleprompter);
    $body.keydown(navigate);

    // Setup GUI
    $article.stop().animate({
      scrollTop: 0
    }, 100, 'linear', function() {
      $article.clearQueue();
    });
    $markerOverlay.fadeOut(0);
    $teleprompter.css({
      'padding-bottom': Math.ceil($window.height() - $header.height()) + 'px'
    });

    // Create Font Size Slider
    $fontSize.slider({
      min: 12,
      max: 100,
      value: config.fontSize,
      orientation: 'horizontal',
      range: 'min',
      animate: true,
      slide: function() {
        updateFontSize(true);
      },
      change: function() {
        updateFontSize(true);
      }
    });

    // Create Speed Slider
    $speed.slider({
      min: 0,
      max: 50,
      value: config.pageSpeed,
      orientation: 'horizontal',
      range: 'min',
      animate: true,
      slide: function() {
        updateSpeed(true);
      },
      change: function() {
        updateSpeed(true);
      }
    });

    // Run initial configuration on sliders
    updateFontSize(false);
    updateSpeed(false);

    // Handle UI Elements
    $backgroundColor.on('change', handleBackgroundColor);
    $buttonDimControls.on('click', handleDim);
    $buttonFlipX.on('click', handleFlipX);
    $buttonFlipY.on('click', handleFlipY);
    $buttonPlay.on('click', handlePlay);
    $buttonRemote.on('click', handleRemote);
    $buttonReset.on('click', handleReset);
    $closeModal.on('click', handleCloseModal);
    $textColor.on('change', handleTextColor);

    $('p:empty', $teleprompter).remove();

    $teleprompter.addClass('ready');

    // TODO: Pull URL Params on Page Load and Update UI & Local Storage
    // TODO: Add Version Update Modal to show Changes to Existing / New Users ( track with version number in Local Storage )
    // TODO: Update Favicon and Apple Icons for Teleprompter ( but leave Remotes as is )
    // TODO: Address Responsive Layout Issues
    // TODO: Listen for Manual Page Scroll and update Config
    // TODO: Remove Unused Code
    // TODO: Perform Accessibility Tests for UI, Keyboard Navigation & Screen Readers
    // TODO: Update Third Party Libraries ( if easy )
    // TODO: Add ability to run Website as an App in supported browsers
    // TODO: Optimize CSS & JS ( remove lingering console statements )
    // TODO: Make sure pasting from Word still works like it used to
    // TODO: Add Changelog to Repo
    // FIXED: Look into why refreshing the Teleprompter Disconnects the Remote ( that should not happen )

    // Connect to Remote if Provided
    var currentRemote = storage.get('remote-id');
    if (currentRemote && currentRemote.length === 6) {
      setTimeout(function(){
        remoteConnect(currentRemote);
      }, 1000);
    }
  });
})();
