(() => {
    const pluginName = "WebWindowPlugin";
    const parameters = PluginManager.parameters('WebWindowPlugin');
    let webWindow = null;

    
    
    
    
    
    
    
    
    
    
    
    

    window.WebWindow = function() {
        this.initialize.apply(this, arguments);
    };

    WebWindow.prototype.initialize = function(serverUrl, examData, mode, x, y, width, height, scrolling, center,switchId) {
        Graphics.stopGameLoop();
        this._serverUrl = serverUrl;
        this._examData = examData;
        this._mode = mode;
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        this._scrolling = scrolling;
        this._center = center;
        this._switchId = switchId;
        this.createIframe();
        this.setupMessageListener();
    };

    WebWindow.prototype.constructUrl = function() {
        var params = new URLSearchParams();
        this._examData.forEach(function(data) {
            params.append('exam_data', data);
        });
        params.append('mode', this._mode);
        const url = this._serverUrl + "?" + params.toString();
        console.log(url)
        return url;
    };

    WebWindow.prototype.createIframe = function() {
        this._iframe = document.createElement('iframe');
        this._iframe.src = this.constructUrl();
        this._iframe.style.position = 'absolute';
        this._iframe.style.width = this._width + 'px';
        this._iframe.style.height = this._height + 'px';
        this._iframe.style.zIndex = 1000;
        this._iframe.style.border = 'none';
        this._iframe.scrolling = this._scrolling ? 'yes' : 'no';

        if (this._center) {
            this._iframe.style.left = '50%';
            this._iframe.style.top = '50%';
            this._iframe.style.transform = 'translate(-50%, -50%)';
        } else {
            this._iframe.style.left = this._x + 'px';
            this._iframe.style.top = this._y + 'px';
        }

        document.body.appendChild(this._iframe);
    };

    WebWindow.prototype.setupMessageListener = function() {
        window.addEventListener('message', (event) => {
            if (event.data === true) { 
                Graphics.startGameLoop();
                this.close(true); 
                window.focus();
            }
        });
    };

    WebWindow.prototype.createIframe = function() {
        $gameSwitches.setValue(this._switchId, false);
        
        this._container = document.createElement('div');
        this._container.style.position = 'absolute';
        this._container.style.width = this._width + 'px';
        this._container.style.height = this._height + 'px';
        this._container.style.zIndex = 1000;

        if (this._center) {
            this._container.style.left = '50%';
            this._container.style.top = '50%';
            this._container.style.transform = 'translate(-50%, -50%)';
        } else {
            this._container.style.left = this._x + 'px';
            this._container.style.top = this._y + 'px';
        }

        
        this._iframe = document.createElement('iframe');
        this._iframe.src = this.constructUrl();
        this._iframe.style.width = '100%';
        this._iframe.style.height = '100%';
        this._iframe.style.border = 'none';
        this._iframe.scrolling = this._scrolling ? 'yes' : 'no';

        
        this._closeButton = document.createElement('button');
        this._closeButton.textContent = 'X';
        this._closeButton.style.position = 'absolute';
        this._closeButton.style.right = '10px';
        this._closeButton.style.top = '10px';
        this._closeButton.style.zIndex = 1001;
        this._closeButton.style.width = '30px';
        this._closeButton.style.height = '30px';
        this._closeButton.style.border = 'none';
        this._closeButton.style.background = 'gold';
        this._closeButton.style.color = 'white';
        this._closeButton.style.cursor = 'pointer';
        this._closeButton.style.borderRadius = '50%';
        this._closeButton.style.textAlign = 'center';
        this._closeButton.style.lineHeight = '30px';
        this._closeButton.style.fontWeight = 'bold';

        
        this._container.appendChild(this._iframe);
        this._container.appendChild(this._closeButton);

        
        this._closeButton.onclick = () => {
            this.close(false);
        };

        
        document.body.appendChild(this._container);
    };

    WebWindow.prototype.close = function(state=false) {
        $gameSwitches.setValue(this._switchId, state);
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        window.focus();
        Graphics.startGameLoop(); 
    };


    window.WebWindow = WebWindow;
})();
