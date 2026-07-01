(function() {
    function stopPropagation(event) {
        event.stopPropagation();
    }

    
    (function(){
        var css = document.createElement('link');
        css.rel = "stylesheet";
        css.type = 'text/css';
        css.href = './css/111_InputForm.css';
        var b_top = document.getElementsByTagName('head')[0];
        b_top.appendChild(css);
    })();

    
    Input.form_mode = false;
    var _Input_onKeyDown = Input._onKeyDown;
    Input._onKeyDown = function(event) {
        if(Input.form_mode) return;
        _Input_onKeyDown.call(this , event);
    };
    var _Input_onKeyUp = Input._onKeyUp;
    Input._onKeyUp = function(event) {
        if(Input.form_mode) return;
        _Input_onKeyUp.call(this , event);
    };

    
    var _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if(this._waitMode == 'input_form') return true;
        return _Game_Interpreter_updateWaitMode.call(this);
    };

    HTMLElement.prototype.postionAdjust = function(screen_postion , target_postion, unitFontSize) {
        this.style.left = screen_postion[0] + target_postion[0] * Graphics._realScale + "px";
        this.style.top  = screen_postion[1] + target_postion[1] * Graphics._realScale + "px";
        this.style.fontSize = unitFontSize * Graphics._realScale + "px";
        this.style.maxWidth = 'calc(100% - ' + this.style.left + ')';
        this.style.maxHeight = 'calc(100% - ' + this.style.top + ')';
    };

    
    var argHash = function(text , arg_names) {
        var _args = new Array(arg_names.length);
        var ary = text.split(";");
        ary.forEach(function(str) {
            var s_ary = str.split("=");
            var prop = s_ary[0].toLowerCase();
            var value = s_ary[1];
            _args[arg_names.indexOf(prop)] = value;
        });
        return _args;
    }

    
    
    
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'InputForm') {
            var _ary = argHash(args[0] , ["x" , "y" , "v" , "max" , "if_s", "btn_x", "btn_y", "font_size", "placeholder"]);
            var target_x = +_ary[0];
            var target_y = +_ary[1];
            var variables_id = +_ary[2];
            var max_count = _ary[3] || null;
            var if_switch_id = Number(_ary[4]) || null;
            var button_x = +_ary[5] || 0;
            var button_y = _ary[6] === '' || isNaN(_ary[6]) ? 50 : +_ary[6];
            var unit_font_size = _ary[7] === '' || isNaN(_ary[7]) ? 24 : +_ary[7];
            var placeholder = _ary[8];
            this._inputForm(target_x, target_y, variables_id, max_count, if_switch_id, button_x, button_y, unit_font_size, placeholder);
        }
    };

    if (PluginManager.registerCommand) {
        PluginManager.registerCommand("InputForm", "show", function(args) {
            var { target_x, target_y, variables_id, max_count, if_switch_id, button_x, button_y, unit_font_size, placeholder } = args;
            this._inputForm(+target_x, +target_y, +variables_id, +max_count, +if_switch_id, +button_x, +button_y, +unit_font_size, placeholder);
        });
    }

    Game_Interpreter.prototype._inputForm = function(target_x, target_y, variables_id, max_count, if_switch_id, button_x, button_y, unit_font_size, placeholder) {
        var interpreter = this;
        var gui = {
            input : null,
            submit : null,
            is_pc : true,
            init : function() {
                this.is_pc = Utils.isNwjs();
                this.create();
                this.input.focus();
                this.screenAdjust();
            },
            create : function() {
                
                this.input = document.createElement('input');
                this.input.setAttribute('id', '_111_input');
                if(max_count) this.input.setAttribute('maxlength', max_count);
                this.input.setAttribute('style', 'z-index: 1100; position: absolute;');

                if (placeholder === '$') {
                    placeholder = $gameVariables.value(variables_id);
                }
                this.input.setAttribute('value', placeholder || '');
                document.body.appendChild(this.input);

                
                this.submit = document.createElement('input');
                this.submit.setAttribute('type', 'submit');
                this.submit.setAttribute('id', '_111_submit');
                this.submit.setAttribute('style', 'z-index: 1100; position: absolute;');
                this.submit.setAttribute('value', '決定');
                document.body.appendChild(this.submit);
            },
            success : function() {
                $gameVariables.setValue(variables_id , this.input.value);
                this.end();
            },
            cancel : function() {
                $gameVariables.setValue(variables_id , this.input.value);
                this.end();
            },
            start : function() {
                interpreter.setWaitMode('input_form');
                Input.clear();
                Input.form_mode = true;
            },
            end : function() {
                this.input.remove();
                this.submit.remove();
                window.removeEventListener("resize", resizeEvent, false);
                interpreter.setWaitMode('');
                Input.form_mode = false;
                clearInterval(_event);
            },
            screenAdjust : function() {
                var screen_x, screen_y;
                var _canvas = document.getElementById('UpperCanvas') || document.getElementById('gameCanvas');
                var rect = _canvas.getBoundingClientRect();
                screen_x = rect.left;
                screen_y = rect.top;
                this.input.postionAdjust([screen_x,screen_y], [target_x,target_y], unit_font_size);
                this.submit.postionAdjust([screen_x,screen_y], [target_x + button_x,target_y + button_y], unit_font_size);
            }
        };

        gui.init();

        gui.input.addEventListener("keydown", function(e) {
            if(e.keyCode === 13) {
                Input.clear();
                gui.success();
                e.stopPropagation();
            }
        });

        gui.input.addEventListener("mousedown", stopPropagation);
        gui.input.addEventListener("touchstart", stopPropagation);
        gui.submit.addEventListener("mousedown", stopPropagation);
        gui.submit.addEventListener("touchstart", stopPropagation);
        gui.submit.addEventListener("click", function() {
            gui.success();
            return false;
        });

        if (if_switch_id) {
            var _event = setInterval(function() {
                if($gameSwitches.value(if_switch_id)) {
                    gui.cancel();
                }
            }, 1);
        }

        var resizeEvent = gui.screenAdjust.bind(gui);
        window.addEventListener("resize", resizeEvent, false);

        gui.start();
    };
})();
