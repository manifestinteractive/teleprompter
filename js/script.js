var initPageSpeed = 35,
	initFontSize = 60,
	scrollDelay,
	textColor = '#ffffff',
	backgroundColor = '#141414',
	timer = $('.clock').timer({ stopVal: 10000 });

$(function() {

	// Check if we've been here before and made changes
	if($.cookie('teleprompter_font_size'))
	{
		initFontSize = $.cookie('teleprompter_font_size');
	}
	if($.cookie('teleprompter_speed'))
	{
		initPageSpeed = $.cookie('teleprompter_speed');
	}
	if($.cookie('teleprompter_text'))
	{
		$('#teleprompter').html($.cookie('teleprompter_text'));
	}
	if($.cookie('teleprompter_text_color'))
	{
		textColor = $.cookie('teleprompter_text_color');
		$('#text-color').val(textColor);
		$('#text-color-picker').css('background-color', textColor);
		$('#teleprompter').css('color', textColor);
	}
	if($.cookie('teleprompter_background_color'))
	{
		backgroundColor = $.cookie('teleprompter_background_color');
		$('#background-color').val(backgroundColor);
		$('#background-color-picker').css('background-color', textColor);
		$('#teleprompter').css('background-color', backgroundColor);
	}
	else
	{
		clean_teleprompter();
	}

	// Listen for Key Presses
	$('#teleprompter').keyup(update_teleprompter);
	$('body').keydown(navigate);

	// Setup GUI
	$('article').stop().animate({scrollTop: 0}, 100, 'linear', function(){ $('article').clearQueue(); });
	$('.marker, .overlay').fadeOut(0);
	$('article .teleprompter').css({
		'padding-bottom': Math.ceil($(window).height()-$('header').height()) + 'px'
	});

	// Create Font Size Slider
	$('.font_size').slider({
		min: 12,
		max: 100,
		value: initFontSize,
		orientation: "horizontal",
		range: "min",
		animate: true,
		slide: function(){ fontSize(true); },
		change: function(){ fontSize(true); }
	});

	// Create Speed Slider
	$('.speed').slider({
		min: 0,
		max: 50,
		value: initPageSpeed,
		orientation: "horizontal",
		range: "min",
		animate: true,
		slide: function(){ speed(true); },
		change: function(){ speed(true); }
	});
	
	$('#text-color').change(function(){
		var color = $(this).val();
		$('#teleprompter').css('color', color);
		$.cookie('teleprompter_text_color', color);
	});
	$('#background-color').change(function(){
		var color = $(this).val();
		$('#teleprompter').css('background-color', color);
		$.cookie('teleprompter_background_color', color);
	});

	// Run initial configuration on sliders
	fontSize(false);
	speed(false);

	// Listen for Play Button Click
	$('.button.play').click(function(){
		if($(this).hasClass('icon-play'))
		{
			start_teleprompter();
		}
		else
		{
			stop_teleprompter();
		}
	});
	// Listen for FlipX Button Click
	$('.button.flipx').click(function(){

    timer.resetTimer();

    if($('.teleprompter').hasClass('flipy'))
		{
			$('.teleprompter').removeClass('flipy').toggleClass('flipxy');
		}
		else
		{
			$('.teleprompter').toggleClass('flipx');
		}
	});
	// Listen for FlipY Button Click
	$('.button.flipy').click(function(){

    timer.resetTimer();

		if($('.teleprompter').hasClass('flipx'))
		{
			$('.teleprompter').removeClass('flipx').toggleClass('flipxy');
		}
		else
		{
			$('.teleprompter').toggleClass('flipy');
		}

		if ($('.teleprompter').hasClass('flipy')) {
      $('article').stop().animate({scrollTop: $(".teleprompter").height() + 100 }, 250, 'swing', function(){ $('article').clearQueue(); });
		} else {
      $('article').stop().animate({scrollTop: 0 }, 250, 'swing', function(){ $('article').clearQueue(); });
		}
	});
	// Listen for Reset Button Click
	$('.button.reset').click(function(){
		stop_teleprompter();
		timer.resetTimer();
		$('article').stop().animate({scrollTop: 0}, 100, 'linear', function(){ $('article').clearQueue(); });
	});
});

// Manage Font Size Change
function fontSize(save_cookie)
{
	initFontSize = $('.font_size').slider( "value" );

	$('article .teleprompter').css({
		'font-size': initFontSize + 'px',
		'line-height': Math.ceil(initFontSize * 1.5) + 'px',
		'padding-bottom': Math.ceil($(window).height()-$('header').height()) + 'px'
	});

	$('article .teleprompter p').css({
		'padding-bottom': Math.ceil(initFontSize * 0.25) + 'px',
		'margin-bottom': Math.ceil(initFontSize * 0.25) + 'px'
	});

	$('label.font_size_label span').text('(' + initFontSize + ')');

	if(save_cookie)
	{
		$.cookie('teleprompter_font_size', initFontSize);
	}
}

// Manage Speed Change
function speed(save_cookie)
{
	initPageSpeed = Math.floor(50 - $('.speed').slider('value'));
	$('label.speed_label span').text('(' + $('.speed').slider('value') + ')');

	if(save_cookie)
	{
		$.cookie('teleprompter_speed', $('.speed').slider('value'));
	}
}

// Manage Scrolling Teleprompter
function pageScroll()
{
	if ($('.teleprompter').hasClass('flipy')) {
    $('article').animate({scrollTop: "-=1px" }, 0, 'linear', function(){ $('article').clearQueue(); });

    clearTimeout(scrollDelay);
    scrollDelay = setTimeout(pageScroll, initPageSpeed);

    // We're at the bottom of the document, stop
    if($("article").scrollTop() === 0)
    {
      stop_teleprompter();
      setTimeout(function(){
        $('article').stop().animate({scrollTop: $(".teleprompter").height() + 100 }, 500, 'swing', function(){ $('article').clearQueue(); });
      }, 500);
    }
	} else {
    $('article').animate({scrollTop: "+=1px" }, 0, 'linear', function(){ $('article').clearQueue(); });

    clearTimeout(scrollDelay);
    scrollDelay = setTimeout(pageScroll, initPageSpeed);

    // We're at the bottom of the document, stop
    if($("article").scrollTop() >= ( ( $("article")[0].scrollHeight - $(window).height() ) - 100 ))
    {
      stop_teleprompter();
      setTimeout(function(){
        $('article').stop().animate({scrollTop: 0}, 500, 'swing', function(){ $('article').clearQueue(); });
      }, 500);
    }
	}
}

// Listen for Key Presses on Body
function navigate(evt)
{
	var space = 32,
		escape = 27,
		left = 37,
		up = 38,
		right = 39,
		down = 40,
		speed = $('.speed').slider('value'),
		font_size = $('.font_size').slider('value');

	// Exit if we're inside an input field
	if (typeof evt.target.id == 'undefined' || evt.target.id == 'teleprompter')
	{
		return;
	}
	else if (typeof evt.target.id == 'undefined' || evt.target.id != 'gui')
	{
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	}

	// Reset GUI
	if(evt.keyCode == escape)
	{
		$('.button.reset').trigger('click');
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	}
	// Start Stop Scrolling
	else if(evt.keyCode == space)
	{
		$('.button.play').trigger('click');
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	}
	// Decrease Speed with Left Arrow
	else if(evt.keyCode == left)
	{
		$('.speed').slider('value', speed-1);
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	}
	// Decrease Font Size with Down Arrow
	else if(evt.keyCode == down)
	{
		$('.font_size').slider('value', font_size-1);
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	}
	// Increase Font Size with Up Arrow
	else if(evt.keyCode == up)
	{
		$('.font_size').slider('value', font_size+1);
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	}
	// Increase Speed with Right Arrow
	else if(evt.keyCode == right)
	{
		$('.speed').slider('value', speed+1);
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	}
}

// Start Teleprompter
function start_teleprompter()
{
	$('#teleprompter').attr('contenteditable', false);
	$('body').addClass('playing');
	$('.button.play').removeClass('icon-play').addClass('icon-pause');
	$('header h1, header nav').fadeTo('slow', 0.15);
	$('.marker, .overlay').fadeIn('slow');

	window.timer.startTimer();

	pageScroll();
}

// Stop Teleprompter
function stop_teleprompter()
{
	clearTimeout(scrollDelay);
	$('#teleprompter').attr('contenteditable', true);
	$('header h1, header nav').fadeTo('slow', 1);
	$('.button.play').removeClass('icon-pause').addClass('icon-play');
	$('.marker, .overlay').fadeOut('slow');
	$('body').removeClass('playing');

	window.timer.stopTimer();
}

// Update Teleprompter
function update_teleprompter()
{
	if(evt.keyCode == 27) { // escape
		$('#teleprompter').blur();
	} else {
		$.cookie('teleprompter_text', $('#teleprompter').html());
	}
}

// Clean Teleprompter
function clean_teleprompter()
{
	var text = $('#teleprompter').html();
		text = text.replace(/<br>+/g,'@@').replace(/@@@@/g,'</p><p>');
		text = text.replace(/@@/g, '<br>');
		text = text.replace(/([a-z])\. ([A-Z])/g, '$1.&nbsp;&nbsp; $2');
		text = text.replace(/<p><\/p>/g, '');

	if(text.substr(0,3) !== '<p>')
	{
		text = '<p>' + text + '</p>';
	}

	$('#teleprompter').html(text);
}

/*
 * jQuery UI Touch Punch 0.2.2
 *
 * Copyright 2011, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
(function(b){b.support.touch="ontouchend" in document;if(!b.support.touch){return;}var c=b.ui.mouse.prototype,e=c._mouseInit,a;function d(g,h){if(g.originalEvent.touches.length>1){return;}g.preventDefault();var i=g.originalEvent.changedTouches[0],f=document.createEvent("MouseEvents");f.initMouseEvent(h,true,true,window,1,i.screenX,i.screenY,i.clientX,i.clientY,false,false,false,false,0,null);g.target.dispatchEvent(f);}c._touchStart=function(g){var f=this;if(a||!f._mouseCapture(g.originalEvent.changedTouches[0])){return;}a=true;f._touchMoved=false;d(g,"mouseover");d(g,"mousemove");d(g,"mousedown");};c._touchMove=function(f){if(!a){return;}this._touchMoved=true;d(f,"mousemove");};c._touchEnd=function(f){if(!a){return;}d(f,"mouseup");d(f,"mouseout");if(!this._touchMoved){d(f,"click");}a=false;};c._mouseInit=function(){var f=this;f.element.bind("touchstart",b.proxy(f,"_touchStart")).bind("touchmove",b.proxy(f,"_touchMove")).bind("touchend",b.proxy(f,"_touchEnd"));e.call(f);};})(jQuery);
