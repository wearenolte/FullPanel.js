/*! fullpanel - v0.0.1 - 2015-01-14
* https://github.com/jeffreynolte/fullpaneljs
* Copyright (c) 2015 Jeffrey Nolte; Licensed MIT */
(function ($) {
    "use strict";

    $.fn.fullpanel = function (options) {

        options = $.extend({
            'menu': false, // id for menu to be used, must be used with anchors
            'anchors': [],
            'navigation': false,
            'css3': true,
            'scrollingSpeed': 700,
            'autoScrolling' : true,
            'easing': 'easeInQuart',
            'scrollBar': false,

            //ui
            'resize': true,
            'normalScrollElements': null,
            'touchSensitivity': 5,

            //selectors
            'sectionSelector': '.panel',

            //  events
            'afterLoad': null,
            'onLeave': null,
            'afterRender': null,
            'afterResize': null,
            'afterRebuild': null,
            'afterSlideLoad': null,
            'onSlideLeave': null

        }, options);

        $.extend($.easing, {
            easeInQuart: function (x, t, b, c, d) {
                return c * (t /= d) * t * t * t + b;
            }
        });

        var scrollDelay = 600;
        var slideMoving = false;
        // detect touch
        var isTouchDevice = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|BB10|Windows Phone|Tizen|Bada)/);
        var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints));

        var touchStartY = 0;
        var touchStartX = 0;
        var touchEndY = 0;
        var touchEndX = 0;

        // Defines the scrolling speed
		$.fn.fullpanel.setScrollingSpeed = function(value){
		   options.scrollingSpeed = value;
		};

        /**
         * Adds or remove the possiblity of scrolling through sections by using the mouse wheel/trackpad or touch gestures.
         * Optionally a second parameter can be used to specify the direction for which the action will be applied.
         *
         * @param directions string containing the direction or directions separated by comma.
         */
        $.fn.fullpanel.setAllowScrolling = function (value, directions){
            if(typeof directions !== 'undefined'){
                directions = directions.replace(' ', '').split(',');
                $.each(directions, function (index, direction){
                    setIsScrollable(value, direction);
                });
            }
            else if(value){
                $.fn.fullpanel.setMouseWheelScrolling(true);
                addTouchHandler();
            }else{
                $.fn.fullpanel.setMouseWheelScrolling(false);
                removeTouchHandler();
            }
        };

        /**
         * Adds or remove the possiblity of scrolling through sections by using the mouse wheel or the trackpad.
         */
        $.fn.fullpanel.setMouseWheelScrolling = function (value){
            if(value){
                addMouseWheelHandler();
            }else{
                removeMouseWheelHandler();
            }
        };

        // Move section forwards
        $.fn.fullpanel.moveSectionForward = function () {
            var $active = $('.fp-section.active');
            var next = $('.fp-section').eq($active.prev().index());

            if ($active.prev().length === 0) {
                return false;
            }

            goToPanel(next);

        };


        // Move section backwards
        $.fn.fullpanel.moveSectionBackward = function () {
            var $active = $('.fp-section.active');
            var next = $('.fp-section').eq($active.next().index());

            if ($active.next().length === 0) {
                return false;
            }

            goToPanel(next);

        };

        // Move to specific section via index or jQuery object associated to [data-anchor]
        $.fn.fullpanel.moveToSection = function (section) {
            var destination = '';

            if (isNaN(section)) {
                destination = $('[data-anchor="' + section + '"]');
            } else {
                section = $('.panel').length - section;
                destination = $('.fp-section').eq(section);
            }

            goToPanel(destination);

        };


        // Rebuilds panel, primarily used on resize
        $.fn.fullpanel.reBuild = function (resizing) {
            isResizing = true;

            setupDimensions();

            isResizing = false;

            if(typeof options.afterRebuild === 'function' && resizing){
                options.afterRebuild();
            }

        };


        // Initial Vars for creation of the fullPanel plugin
        // TODO: Add in mobile / responsive support
        var $container = $(this);
        var isMoving = false;
        var isResizing = false;
        var lastScrolledDestiny;
        var $nav;
        var $body = $('body');
        var wrapperSelector = 'fullpanel-wrapper';
        var $fpSection = $('.fp-section');
        var isScrollAllowed = { 'up':true, 'down':true, 'left':true, 'right':true };

        $.fn.fullpanel.setAllowScrolling(true);

        //add class to each panel / section
        $(options.sectionSelector).each(function () {
            $(this).addClass('fp-section');
        });

        //if we have panels set up in reverse order to eliminate use of zIndex
        if ($container.length) {
            $container.addClass(wrapperSelector);
            $container.append($container.children().get().reverse());
        } else {
            window.alert("Error, Fullpanel.js needs to be initialized with a selector");
        }


        // Setup our fullPanel Plugin around each element.
        $fpSection.each(function (index) {
            var $this = $(this);

            // If there is no active lets set it up.
            if (!index && $('.active', $fpSection).length === 0) {
                $this.addClass('active');
            }

            //add nav that correlates with other panels.
            if (typeof options.anchors[index] !== 'undefined') {
                $this.attr('data-anchor', options.anchors[index]);
            }

        }).promise().done(function () {

            if(typeof options.afterRender === 'function' ){
                options.afterRender();
            }

            var value = window.location.hash.replace("#", '').split('/');
            var destination = value[0];

            if (options.navigation) {
                addVerticalNavigation();
            }

            //If we have a url
            if (destination.length) {
                var section = $('[data-anchor="' + destination + '"]');

                setBodyClass(destination);
                goToPanel(section);

                if(typeof options.afterLoad === 'function'){
                    options.afterLoad(destination, (section.index('.fp-section') + 1));
                }

                section.addClass('active').siblings().removeClass('active');
            }

            // Sets dimensions for panels and parent container.
            setupDimensions();

            // Handle all mousewheel events.
            addMouseWheelHandler();

            //On load check for anchor and go goto panel associated with anchor.
            $(window).on('load', function () {
                goToAnchor();
            });
        });



        /* jshint latedef: true */
        function addVerticalNavigation() {
            $('body').append('<div id="fp-nav"><ul></ul></div>');

            $nav = $("#fp-nav");

            for (var i = 0; i < $('.fp-section').length; i++) {
                var link = "";
                if (options.anchors.length) {
                    link = options.anchors[i];
                }

                var li = '<li><a href="#' + link + '"><span></span></a></li>';
                $nav.find('ul').append(li);
            }
        }



        function scrollHandler(){
            if(!options.autoScrolling || options.scrollBar){
                var currentScroll = $(window).scrollTop();
                var visibleSectionIndex = 0;
                var initial = Math.abs(currentScroll - $('.fp-section').first().offset().top);

                //taking the section which is showing more content in the viewport
                $('.fp-section').each(function(index){
                    var current = Math.abs(currentScroll - $(this).offset().top);

                    if(current < initial){
                        visibleSectionIndex = index;
                        initial = current;
                    }
                });

                //geting the last one, the current one on the screen
                var currentSection = $('.fp-section').eq(visibleSectionIndex);
            }

            if(!options.autoScrolling){
                //executing only once the first time we reach the section
                if(!currentSection.hasClass('active')){
                    isScrolling = true;

                    var leavingSection = $('.fp-section.active').index('.fp-section') + 1;
                    var yMovement = getYmovement(currentSection);
                    var anchorLink  = currentSection.data('anchor');
                    var sectionIndex = currentSection.index('.fp-section') + 1;
                    var activeSlide = currentSection.find('.fp-slide.active');

                    if(activeSlide.length){
                        var slideAnchorLink = activeSlide.data('anchor');
                        var slideIndex = activeSlide.index();
                    }

                    currentSection.addClass('active').siblings().removeClass('active');

                    if(!isMoving){
                        $.isFunction( options.onLeave ) && options.onLeave.call( this, leavingSection, sectionIndex, yMovement);

                        $.isFunction( options.afterLoad ) && options.afterLoad.call( this, anchorLink, sectionIndex);
                    }

                    activateMenuAndNav(anchorLink, 0);

                    if(options.anchors.length && !isMoving){
                        //needed to enter in hashChange event when using the menu with anchor links
                        lastScrolledDestiny = anchorLink;

                        setState(slideIndex, slideAnchorLink, anchorLink, sectionIndex);
                    }

                    //small timeout in order to avoid entering in hashChange event when scrolling is not finished yet
                    clearTimeout(scrollId);
                    scrollId = setTimeout(function(){
                        isScrolling = false;
                    }, 100);
                }
            }

            //when scrolling...
            $(window).on('scroll', scrollHandler);

            if(options.scrollBar){
                //for the auto adjust of the viewport to fit a whole section
                clearTimeout(scrollId2);
                scrollId2 = setTimeout(function(){
                    if(!isMoving){
                        scrollPage(currentSection);
                    }
                }, 1000);
            }
        }


        /**
         * reverseIndex - Helper function to reverse index stacking.
         * @param {Number} length - length of parent container
         * @param {Number} index - index of current item
         * @returns {Number} - The reversed index
         */
        function reverseIndex(length, index) {
            return parseInt(length - index);
        }


        /**
         * goToPanel - Main function that is called from all methods to navigate to specific panel
         * @param {Object} element - jQuery object to navigateto.
         * @param {Function} callback - Function on complete
         */
        function goToPanel(element, callback) {

            var destination = element.position;

            if (options.menu) {
                activateMenuAndNav(element.attr('data-anchor'), reverseIndex(element.siblings().length, element.index));
            }

            if (typeof destination === "undefined") {
                return false;
            }

            var v = {
                element: element,
                callback: callback,
                destination: destination,
                anchorLink: element.data('anchor'),
                sectionIndex: element.index('.fp-section'),
                activeSection: $('.fp-section.active'),
                leavingSection: $('.fp-section.active').index('.fp-section') + 1,
                localIsResizing: isResizing
            };

            element.addClass('active');
            element.siblings().removeClass('active');

            isMoving = true;

            setURLHash(v.anchorLink, v.sectionIndex);

            if(typeof options.onLeave === 'function' && !v.localIsResizing){
                options.onLeave(v.leavingSection, (v.sectionIndex + 1));
            }

            performMovement(v);

            lastScrolledDestiny = v.anchorLink;

        }

        // Fade In / Out Panels
        function performMovement(v) {

            if (options.css3) {
                setTimeout(function () {
                    afterSectionLoads(v);
                }, options.scrollingSpeed);

            } else {

                $(v.element).fadeIn('slow').promise().done(function () {
                    afterSectionLoads(v);
                });

            }
        }

        /**
         * Detecting mousewheel scrolling
         * http://blogs.sitepointstatic.com/examples/tech/mouse-wheel/index.html
         * http://www.sitepoint.com/html5-javascript-mouse-wheel/
         */
        function addMouseWheelHandler() {
            if (document.addEventListener) {
                document.addEventListener("mousewheel", MouseWheelHandler, false); //IE9
                document.addEventListener("wheel", MouseWheelHandler, false); //Firefox
            } else {
                document.attachEvent("onmousewheel", MouseWheelHandler); //IE 6/7/8
            }
        }

        /**
         * Removes the auto scrolling action fired by the mouse wheel and trackpad.
         * After this function is called, the mousewheel and trackpad movements won't scroll through sections.
         */
        function removeMouseWheelHandler(){
            if (document.addEventListener) {
                document.removeEventListener('mousewheel', MouseWheelHandler, false); //IE9, Chrome, Safari, Oper
                document.removeEventListener('wheel', MouseWheelHandler, false); //Firefox
            } else {
                document.detachEvent("onmousewheel", MouseWheelHandler); //IE 6/7/8
            }
        }



        /* As we are changing the top property of the page on scrolling, we can not use the traditional way to detect it.
        * This way, the touchstart and the touch moves shows an small difference between them which is the
        * used one to determine the direction.
        */
        function touchMoveHandler(event) {
            var e = event.originalEvent;

            if (options.autoScrolling && !options.scrollBar) {
                //preventing the easing on iOS devices
                event.preventDefault();
            }

            var activeSection = $('.fp-section.active');

            if (!isMoving) { //if theres any #
                var touchEvents = getEventsPage(e);

                touchEndY = touchEvents['y'];
                touchEndX = touchEvents['x'];

                //vertical scrolling (only when autoScrolling is enabled)
                if (options.autoScrolling && !options.scrollBar) {

                    //is the movement greater than the minimum resistance to scroll?
                    if (Math.abs(touchStartY - touchEndY) > ($(window).height() / 100 * options.touchSensitivity)) {
                        if (touchStartY > touchEndY) {
                            scrolling('down');
                        } else if (touchEndY > touchStartY) {
                            scrolling('up');
                        }
                    }
                }
            }


        }

        function touchStartHandler(event){
            var e = event.originalEvent;

            var touchEvents = getEventsPage(e);
            touchStartY = touchEvents['y'];
            touchStartX = touchEvents['x'];

        }

        function MouseWheelHandler(e) {
            e = window.event || e;
            var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.deltaY || -e.detail)));

            if (!isMoving) {
                if (delta < 0) {
                    $.fn.fullpanel.moveSectionForward();
                } else {
                    $.fn.fullpanel.moveSectionBackward();
                }
            }
            return false;
        }

        // Adds the possibility to auto scroll through sections on touch devices.
        function addTouchHandler() {
            if (isTouchDevice || isTouch) {
                //Microsoft pointers
                var MSPointer = getMSPointer();
                $(document).off('touchstart ' + MSPointer.down).on('touchstart ' + MSPointer.down, touchStartHandler);
                $(document).off('touchmove ' + MSPointer.move).on('touchmove ' + MSPointer.move, touchMoveHandler);
            }
        }

        /**
         * Removes the auto scrolling for touch devices.
         */
        function removeTouchHandler(){
            if(isTouchDevice || isTouch){
                //Microsoft pointers
                MSPointer = getMSPointer();

                $(document).off('touchstart ' + MSPointer.down);
                $(document).off('touchmove ' + MSPointer.move);
            }
        }


        /*
         * Returns and object with Microsoft pointers
         */
        function getMSPointer() {
            var pointer;

            //IE >= 11 & rest of browsers
            if (window.PointerEvent) {
                pointer = {down: "pointerdown", move: "pointermove"};
            }

            //IE < 11
            else {
                pointer = {down: "MSPointerDown", move: "MSPointerMove"};
            }

            return pointer;
        }


        /**
         * Gets the pageX and pageY properties depending on the browser.
         * https://github.com/alvarotrigo/fullPage.js/issues/194#issuecomment-34069854
         */
        function getEventsPage(e){
            var events = [];

            events['y'] = (typeof e.pageY !== 'undefined' && (e.pageY || e.pageX) ? e.pageY : e.touches[0].pageY);
            events['x'] = (typeof e.pageX !== 'undefined' && (e.pageY || e.pageX) ? e.pageX : e.touches[0].pageX);

            return events;
        }


        // After section loads
        function afterSectionLoads(v) {
            //callback (afterLoad) if the site is not just resizing and readjusting the slides

            if(typeof options.afterLoad === 'function'&&  !v.localIsResizing){
                options.afterLoad(v.anchorLink, (v.sectionIndex + 1));
            }

            setTimeout(function () {
                isMoving = false;

                if(typeof v.callback === 'function'){
                    v.callback();
                }

            }, scrollDelay);
        }


        // Setup Panel and Container dimensions
        function setupDimensions() {
            $('.fp-section').each(function () {

                var $this = $(this);
                var windowHeight = window.innerHeight;
                var windowWidth = window.innerWidth;

                $this.css('height', windowHeight + 'px');
                $this.css('width', windowWidth + 'px');

                //if this is the last one lets set the container dimensions
                if ($this.next().length < 0) {
                    $this.parent.css('height', windowHeight + 'px');
                    $this.parent.css('height', windowWidth + 'px');
                }
            });
        }


        // Go to specific anchor
        function goToAnchor() {
            var value = window.location.hash.replace('#', '').split('/');
            var section = value[0];

            if (section) {
                $.fn.fullpanel.moveToSection(section);
            }
        }

        // Handle hashchange and route to panel
        function hashChangeHandler() {
            var value = window.location.hash.replace('#', '').split('/');
            var section = value[0];

            if (section.length) {
                $.fn.fullpanel.moveToSection(section);
            }
        }
        $(window).on('hashchange', hashChangeHandler);

        // Goto panel from click on side menu
        $(document).on('click touchstart', '#fp-nav a', function (e) {
            e.preventDefault();
            var $this = $(this);
            var index = $this.parent().index();
            var reversedIndex = reverseIndex($this.parent().siblings().length, index);

            goToPanel($('.fp-section').eq(reversedIndex));
        });

        if(options.normalScrollElements){
            $(document).on('mouseenter', options.normalScrollElements, function () {
                $.fn.fullpage.setMouseWheelScrolling(false);
            });

            $(document).on('mouseleave', options.normalScrollElements, function(){
                $.fn.fullpage.setMouseWheelScrolling(true);
            });
        }

        // Handle resize
        var resizeId;
        function resizeHandler() {
            clearTimeout(resizeId);
            resizeId = setTimeout(function () {
                $.fn.fullpanel.reBuild(true);
            }, 500);
        }
        $(window).resize(resizeHandler);


        // Setup Vertical Nav Dots
        function activateNavDots(name, sectionIndex) {
            var $nav = $("#fp-nav");

            if (options.navigation) {
                $nav.find('a.active').removeClass('active');

                if (name) {
                    $nav.find('a[href="#' + name + '"]').addClass('active');
                } else {
                    $nav.find('li').eq(sectionIndex).find('a').addClass('active');
                }
            }
        }


        // Setup the active main menu elements if present
        function activateMenuElement(name) {
            if (options.menu) {
                $(options.menu).find('.active').removeClass('active');
                $(options.menu).find('[data-menuanchor="' + name + '"]').addClass('active');
            }
        }

        // Bring the menus together.
        function activateMenuAndNav(anchor, index) {
            activateMenuElement(anchor);
            activateNavDots(anchor, index);
        }

        /**
         * Return a boolean depending on whether the scrollable element is at the end or at the start of the scrolling
         * depending on the given type.
         */
        function isScrolled(type, scrollable){
            if(type === 'top'){
                return !scrollable.scrollTop();
            }else if(type === 'bottom'){
                return scrollable.scrollTop() + 1 + scrollable.innerHeight() >= scrollable[0].scrollHeight;
            }
        }



        // Set the url hash and body class.
        function setURLHash(anchorLink, sectionIndex) {
            location.hash = anchorLink;
            if (options.anchors.length) {
                setBodyClass(location.hash);
            } else {
                setBodyClass(String(sectionIndex));
            }
        }

        function setIsScrollable(value, direction){
            switch (direction){
                case 'up': isScrollAllowed.up = value; break;
                case 'down': isScrollAllowed.down = value; break;
                case 'left': isScrollAllowed.left = value; break;
                case 'right': isScrollAllowed.right = value; break;
                case 'all': $.fn.fullpage.setAllowScrolling(value);
            }
        }

        /**
         * Determines whether the active section or slide is scrollable through and scrolling bar
         */
        function isScrollable(activeSection){
            var scrollable;
            //if there are landscape slides, we check if the scrolling bar is in the current one or not
            if(activeSection.find('.fp-slides').length){
                scrollable = activeSection.find('.fp-section.active').find('.fp-scrollable');
            }else{
                scrollable = activeSection.find('.fp-section');
            }

            return scrollable;
        }

        /**
         * Determines the way of scrolling up or down:
         * by 'automatically' scrolling a section or by using the default and normal scrolling.
         */
        function scrolling(type){

            if (!isScrollAllowed[type]){
                return;
            }

            if(type === 'up'){
                $.fn.fullpanel.moveSectionBackward()
            } else {
                $.fn.fullpanel.moveSectionForward();
            }

        }

        // Sets body class based on current panel
        function setBodyClass(text) {

            //changing slash for dash to make it a valid CSS style
            text = text.replace('/', '-').replace('#', '');

            //removing previous anchor classes
            $body[0].className = $body[0].className.replace(/\b\s?fp-viewing-[^\s]+\b/g, '');

            //adding the current anchor
            $body.addClass("fp-viewing-" + text);
        }


    }; //End of Fullpanel


}(jQuery));
