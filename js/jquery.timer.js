/*
 * jQuery Timer - a jQuery Plugin, that counts time
 * http://humnom.net/timer/
 *
 * Copyright 2011, Yuri Sizov <yuris@humnom.net> - http://humnom.net
 * Released under the GPL License Version 2.
 *
 * Version: 1.1
 * Date: Thu Mar 07 2011 15:29:30 +0300
 */

(function($) {
	
	$.fn.timer = function (settings,callback) {
		// Checking existense
		if (this.data('timer')&&this.data('timer').exists)
			return false;
			
		// Default settings
		var defaults = {
			autostart	:	false,
			direction	:	'cw',
			format		:	'{h}:{m}:{s}', // также {w}, {d}
			startVal	:	0,
			stopVal		:	10,
			loop		:	false
		};

		this.data('timer',[]);
		var timer = this.data('timer');

		timer.options = $.extend(defaults,settings);
		
		timer.options.startVal = parseInt(timer.options.startVal);
		timer.options.stopVal = parseInt(timer.options.stopVal);
		if (timer.options.startVal < 0)	timer.options.startVal = 0;
		if (timer.options.stopVal < 0)	timer.options.stopVal = 0;
		
		// Additional variables
		timer.exists = true;
		timer.target = this;
		timer.interval = false;
		timer.currentVal = timer.options.startVal;
		timer.step = 1000;
		timer.callback = callback || function(){};
		
		// Debug variables
		timer.debug = {
			index		:	'#'+timer.target.attr('id')
		};
		
		// Start or resume timer
		this.startTimer = function() {
//			console.log('('+timer.debug.index+') '+'Timer started');
			if (!timer.interval)
			{
				if (timer.options.direction == 'cw')
					timer.interval = setInterval(timer.increase,timer.step);
				else if (timer.options.direction == 'ccw')
					timer.interval = setInterval(timer.decrease,timer.step);
			}
		}
		// Pause timer
		this.stopTimer = function() {
//			console.log('('+timer.debug.index+') '+'Timer stopped');
			if (timer.interval)
			{
				clearInterval(timer.interval);
				timer.interval = false;
			}
		}
		// Stop and reset timer to current settings
		this.resetTimer = function() {
//			console.log('('+timer.debug.index+') '+'Timer reset');
			if (timer.interval)
			{
				clearInterval(timer.interval);
				timer.interval = false;
			}
			timer.target.text(timer.formate(timer.options.startVal));
			timer.currentVal = timer.options.startVal;
		}
		// Destroy timer in jQuery object
		this.destroyTimer = function() {
//			console.log('('+timer.debug.index+') '+'Timer destroyed');
			if (timer.interval)
			{
				clearInterval(timer.interval);
				timer.interval = false;
			}
			this.removeData('timer');
		}
		// Set new timer settings 
		this.setTimerOptions = function(new_settings) {
			timer.options = $.extend(timer.options,new_settings);
		}
		// Rewind timer to the specific value without changing startVal
		this.rewindTimer = function(sec) {
			if (!sec) sec = 0;
			if (sec < timer.options.startVal) sec = timer.options.startVal;
			if (sec > timer.options.stopVal) sec = timer.options.stopVal;
			timer.currentVal = sec;
			timer.target.text(timer.formate(timer.currentVal));
		}
		
		// Apply time format
		timer.formate = function(sec) {
			var formatted_time = '';
			var format = timer.options.format;
			
			if (format.indexOf('{s}')>=0)
			{
				var s = Math.floor(parseInt(sec)); if (s < 10) s = '0'+s;
			}
			if (format.indexOf('{m}')>=0)
			{
				var s = Math.floor(parseInt(sec%60)); if (s < 10) s = '0'+s;
				var m = Math.floor(parseInt(sec/60)); if (m < 10) m = '0'+m;
			}
			if (format.indexOf('{h}')>=0)
			{
				var s = Math.floor(parseInt(sec%60)); if (s < 10) s = '0'+s;
				var m = Math.floor(parseInt((sec/60)%60)); if (m < 10) m = '0'+m;
				var h = Math.floor(parseInt((sec/60)/60)); if (h < 10) h = '0'+h;
			}
			if (format.indexOf('{d}')>=0)
			{
				var s = Math.floor(parseInt(sec%60)); if (s < 10) s = '0'+s;
				var m = Math.floor(parseInt((sec/60)%60)); if (m < 10) m = '0'+m;
				var h = Math.floor(parseInt((sec/60)/60)%24); if (h < 10) h = '0'+h;
				var d = Math.floor(parseInt(((sec/60)/60)/24));
			}
			if (format.indexOf('{w}')>=0)
			{
				var s = Math.floor(parseInt(sec%60)); if (s < 10) s = '0'+s;
				var m = Math.floor(parseInt((sec/60)%60)); if (m < 10) m = '0'+m;
				var h = Math.floor(parseInt((sec/60)/60)%24); if (h < 10) h = '0'+h;
				var d = Math.floor(parseInt(((sec/60)/60)/24)%7);
				var w = Math.floor(parseInt(((sec/60)/60)/24)/7);
			}
			
			if (w != undefined)	format = format.replace('{w}',w);
			if (d != undefined)	format = format.replace('{d}',d);
			if (h != undefined)	format = format.replace('{h}',h);
			if (m != undefined)	format = format.replace('{m}',m);
			if (s != undefined)	format = format.replace('{s}',s);
			
			formatted_time = format;
			return formatted_time;
		}
		
		// Count clockwise
		timer.increase = function() {
			if (timer.currentVal < timer.options.stopVal)
			{
				timer.currentVal++;
				timer.target.text(timer.formate(timer.currentVal));
				
				// Stopping interval and shooting callback exactly at last step
				if (timer.currentVal == timer.options.stopVal)
				{
					timer.onFinish();
				}
			} else {
				timer.onFinish();
			}
		}
		
		// Count counterclockwise
		timer.decrease = function() {
			if (timer.currentVal > timer.options.stopVal)
			{
				timer.currentVal--;
				timer.target.text(timer.formate(timer.currentVal));
				
				// Stopping interval and shooting callback exactly at last step
				if (timer.currentVal == timer.options.stopVal)
				{
					timer.onFinish();
				}
			} else {
				timer.onFinish();
			}
		}
		
		timer.onFinish = function() {
			clearInterval(timer.interval);
			timer.interval = false;
			eval(timer.callback());
			
			if (timer.options.loop)
			{
				timer.target.resetTimer();
				timer.target.startTimer();
			}
		}
		
		// Putting starting value at creation
		timer.target.text(timer.formate(timer.options.startVal));
			
		// Automatically start at creation
		if (timer.options.autostart)
		{
			this.startTimer();
		}
		
		return this;
		
	};
	
})(jQuery);