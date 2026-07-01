"use strict";

const SelfVariablePluginName = document.currentScript ? decodeURIComponent(document.currentScript.src.match(/^.*\/(.+)\.js$/)[1]) : "SelfVariable";
var globalActiveInterpreter;
var globalActiveEvent;
var SelfVariable;
(function (SelfVariable) {
    const PP = PluginManager.parameters(SelfVariablePluginName);
    const SelfVariablePrefix = PP.SelfVariablePrefix;
    const FloatVariablePrefix = PP.FloatVariablePrefix;
    const CommonVariablePrefix = PP.CommonVariablePrefix;
    const ErrorLanguage = PP.ErrorLanguage;
    
    if (typeof PluginManager.registerCommand !== "undefined") {
        function getMapId(interpreter, args) {
            const mapIdByVariable = parseInt(args.MapIdByVariable);
            let mapId = mapIdByVariable > 0 ? $gameVariables.value(mapIdByVariable) : parseInt(args.MapId);
            if (mapId === 0)
                return interpreter.mapId();
            return mapId;
        }
        function getEventId(interpreter, args) {
            const eventIdByVariable = parseInt(args.EventIdByVariable);
            let eventId = eventIdByVariable > 0 ? $gameVariables.value(eventIdByVariable) : parseInt(args.EventId);
            if (eventId === 0) {
                if (interpreter.eventId() === 0) {
                    throw ErrorManager.invalidThisEvent();
                }
                else {
                    return interpreter.eventId();
                }
            }
            return eventId;
        }
        PluginManager.registerCommand(SelfVariablePluginName, "GetSelfVariableValue", function (args) {
            const mapId = getMapId(this, args);
            const eventId = getEventId(this, args);
            const selfVariableId = parseInt(args.SelfVariableId);
            const destVariableId = parseInt(args.DestVariableId);
            const key = [mapId, eventId, selfVariableId];
            const value = $gameVariables.selfVariableValue(key);
            $gameVariables.setValue(destVariableId, value);
        });
        PluginManager.registerCommand(SelfVariablePluginName, "SetSelfVariableValue", function (args) {
            const mapId = getMapId(this, args);
            const eventId = getEventId(this, args);
            const selfVariableId = parseInt(args.SelfVariableId);
            let value = parseInt(args.Value);
            const srcVariableId = parseInt(args.SrcVariableId);
            const key = [mapId, eventId, selfVariableId];
            if (srcVariableId > 0) {
                value = $gameVariables.value(srcVariableId);
            }
            $gameVariables.setSelfVariableValue(key, value);
        });
        PluginManager.registerCommand(SelfVariablePluginName, "SetSelfVariableValueByEventTags", function (args) {
            const eventTags = JSON.parse(args.EventTags);
            const selfVariableId = parseInt(args.SelfVariableId);
            let value = parseInt(args.Value);
            const srcVariableId = parseInt(args.SrcVariableId);
            if (srcVariableId > 0) {
                value = $gameVariables.value(srcVariableId);
            }
            $gameVariables.setSelfVariableValueByEventTags(eventTags, selfVariableId, value);
        });
        PluginManager.registerCommand(SelfVariablePluginName, "ClearSelfVariables", function (args) {
            const mapId = getMapId(this, args);
            let eventId;
            if (args.EventSpecification !== "false") {
                eventId = getEventId(this, args);
            }
            let selfVariableId;
            if (args.SelfVariableId) {
                selfVariableId = parseInt(args.SelfVariableId);
                if (selfVariableId === 0)
                    selfVariableId = undefined;
            }
            $gameVariables.clearSelfVariables(mapId, eventId, selfVariableId);
        });
        PluginManager.registerCommand(SelfVariablePluginName, "GetExSelfSwitchValue", function (args) {
            const mapId = getMapId(this, args);
            const eventId = getEventId(this, args);
            const exSelfSwitchId = parseInt(args.ExSelfSwitchId);
            const destSwitchId = parseInt(args.DestSwitchId);
            const key = [mapId, eventId, exSelfSwitchId];
            const value = $gameSwitches.exSelfSwitchValue(key);
            $gameSwitches.setValue(destSwitchId, value);
        });
        
        PluginManager.registerCommand(SelfVariablePluginName, "SetExSelfVariableValue", function (args) {
            const mapId = getMapId(this, args);
            const eventId = getEventId(this, args);
            const exSelfSwitchId = parseInt(args.ExSelfSwitchId);
            let value = args.Value === "true";
            const srcSwitchId = parseInt(args.SrcSwitchId);
            const key = [mapId, eventId, exSelfSwitchId];
            if (srcSwitchId > 0) {
                value = $gameSwitches.value(srcSwitchId);
            }
            $gameSwitches.setExSelfSwitchValue(key, value);
        });
        PluginManager.registerCommand(SelfVariablePluginName, "SetExSelfSwitchValueByEventTags", function (args) {
            const eventTags = JSON.parse(args.EventTags);
            const exSelfSwitchId = parseInt(args.ExSelfSwitchId);
            let value = args.Value === "true";
            const srcSwitchId = parseInt(args.SrcSwitchId);
            if (srcSwitchId > 0) {
                value = $gameSwitches.value(srcSwitchId);
            }
            $gameSwitches.setExSelfSwitchValueByEventTags(eventTags, exSelfSwitchId, value);
        });
        PluginManager.registerCommand(SelfVariablePluginName, "ClearExSelfSwitches", function (args) {
            const mapId = getMapId(this, args);
            let eventId;
            if (args.EventSpecification !== "false") {
                eventId = getEventId(this, args);
            }
            let exSelfSwitchId;
            if (args.ExSelfSwitchId) {
                exSelfSwitchId = parseInt(args.ExSelfSwitchId);
                if (exSelfSwitchId === 0)
                    exSelfSwitchId = undefined;
            }
            $gameSwitches.clearExSelfSwitches(mapId, eventId, exSelfSwitchId);
        });
    }
    class ErrorManager {
        static invalidThisEvent() {
            let errorMessage;
            if (ErrorLanguage === "ja") {
                errorMessage = `このイベントではイベントID=0をプラグインコマンドとして使用することはできません。`;
            }
            else {
                errorMessage = `Event ID=0 cannot be used as a plugin command for this event.`;
            }
            return new Error(errorMessage);
        }
        static invalidSelfVariableAccess(variableId) {
            let errorMessage;
            if (ErrorLanguage === "ja") {
                errorMessage = `不正なタイミングでのセルフ変数(ID:${variableId})へのアクセスが発生しました。`;
            }
            else {
                errorMessage = `An access to the self variable(ID:${variableId}) occurred at an incorrect timing.`;
            }
            return new Error(errorMessage);
        }
        static invalidCommonVariableAccess(variableId) {
            let errorMessage;
            if (ErrorLanguage === "ja") {
                errorMessage = `不正なタイミングでのコモンインベント変数(ID:${variableId})へのアクセスが発生しました。`;
            }
            else {
                errorMessage = `An access to the common event variable(ID:${variableId}) occurred at an incorrect timing.`;
            }
            return new Error(errorMessage);
        }
    }
    class SelfVariableOrExSwitchUtils {
        static isDebugScene() {
            if (SceneManager._scene instanceof Scene_Debug)
                return true;
            return false;
        }
        static currentExSelfSwitchKey(id) {
            if (globalActiveEvent) {
                return globalActiveEvent.selfVariableOrExSwitchKey(id);
            }
            else if (globalActiveInterpreter) {
                return globalActiveInterpreter.selfVariableOrExSwitchKey(id);
            }
            throw ErrorManager.invalidSelfVariableAccess(id);
        }
        static checkPrefixs(name) {
            const results = [];
            let index = 0;
            let end = false;
            while (!end) {
                end = true;
                if (SelfVariablePrefix) {
                    if (this.checkPrefix(name, index, SelfVariablePrefix)) {
                        results.push("SelfVariable");
                        index += SelfVariablePrefix.length;
                        end = false;
                    }
                }
                if (FloatVariablePrefix) {
                    if (this.checkPrefix(name, index, FloatVariablePrefix)) {
                        results.push("FloatVariable");
                        index += FloatVariablePrefix.length;
                        end = false;
                    }
                }
                if (CommonVariablePrefix) {
                    if (this.checkPrefix(name, index, CommonVariablePrefix)) {
                        results.push("CommonVariable");
                        index += CommonVariablePrefix.length;
                        end = false;
                    }
                }
            }
            return results;
        }
        static checkPrefix(name, index, expectedPrefix) {
            const prefix = name.slice(index, index + expectedPrefix.length);
            return prefix === expectedPrefix;
        }
    }
    SelfVariable.SelfVariableOrExSwitchUtils = SelfVariableOrExSwitchUtils;
    
    const _Game_Variables_clear = Game_Variables.prototype.clear;
    Game_Variables.prototype.clear = function () {
        _Game_Variables_clear.call(this);
        this._selfVariablesData = {};
    };
    const _Game_Variables_value = Game_Variables.prototype.value;
    Game_Variables.prototype.value = function (variableId) {
        if (this.isSelfVariable(variableId)) {
            if (SelfVariableOrExSwitchUtils.isDebugScene())
                return 0;
            const key = SelfVariableOrExSwitchUtils.currentExSelfSwitchKey(variableId);
            return this.selfVariableValue(key);
        }
        else if (this.isCommonVariable(variableId)) {
            if (SelfVariableOrExSwitchUtils.isDebugScene())
                return 0;
            if (globalActiveInterpreter) {
                return globalActiveInterpreter.commonVariableValue(variableId);
            }
            else {
                throw ErrorManager.invalidCommonVariableAccess(variableId);
            }
        }
        return _Game_Variables_value.call(this, variableId);
    };
    Game_Variables.prototype.setValue = function (variableId, value) {
        if (this.isSelfVariable(variableId)) {
            if (SelfVariableOrExSwitchUtils.isDebugScene())
                return;
            const key = SelfVariableOrExSwitchUtils.currentExSelfSwitchKey(variableId);
            this.setSelfVariableValue(key, value);
        }
        else if (this.isCommonVariable(variableId)) {
            if (SelfVariableOrExSwitchUtils.isDebugScene())
                return;
            if (globalActiveInterpreter) {
                globalActiveInterpreter.setCommonVariableValue(variableId, value);
            }
            else {
                throw ErrorManager.invalidCommonVariableAccess(variableId);
            }
        }
        else {
            if (variableId > 0 && variableId < $dataSystem.variables.length) {
                if (!this.isFloatVariable(variableId) && (typeof value === "number")) {
                    value = Math.floor(value);
                }
                this._data[variableId] = value;
                this.onChange();
            }
        }
    };
    Game_Variables.prototype.isSelfVariable = function (variableId) {
        const name = $dataSystem.variables[variableId];
        if (!name)
            return false;
        const prefixs = SelfVariableOrExSwitchUtils.checkPrefixs(name);
        return prefixs.includes("SelfVariable");
    };
    Game_Variables.prototype.isCommonVariable = function (variableId) {
        const name = $dataSystem.variables[variableId];
        if (!name)
            return false;
        const prefixs = SelfVariableOrExSwitchUtils.checkPrefixs(name);
        return prefixs.includes("CommonVariable");
    };
    Game_Variables.prototype.isFloatVariable = function (variableId) {
        const name = $dataSystem.variables[variableId];
        if (!name)
            return false;
        const prefixs = SelfVariableOrExSwitchUtils.checkPrefixs(name);
        return prefixs.includes("FloatVariable");
    };
    Game_Variables.prototype.selfVariableValue = function (key) {
        return this._selfVariablesData[key] || 0;
    };
    Game_Variables.prototype.setSelfVariableValue = function (key, value) {
        const variableId = key[2];
        if (variableId > 0 && variableId < $dataSystem.variables.length) {
            if (!this.isFloatVariable(variableId) && (typeof value === "number")) {
                value = Math.floor(value);
            }
            this._selfVariablesData[key] = value;
            this.onChange();
        }
    };
    Game_Variables.prototype.setSelfVariableValueByEventTags = function (eventTags, variableId, value) {
        for (const event of $gameMap.events()) {
            for (const tag of eventTags) {
                if (event.eventTags().includes(tag)) {
                    event.setSelfVariableValue(variableId, value);
                    break;
                }
            }
        }
    };
    Game_Variables.prototype.clearSelfVariables = function (mapId, eventId = undefined, variableId = undefined) {
        for (const key in this._selfVariablesData) {
            const [keyMapId, keyEventId, keyVariableId] = key.split(",").map(s => parseInt(s));
            if (keyMapId === mapId
                && (eventId == null || keyEventId === eventId)
                && (variableId == null || keyVariableId === variableId)) {
                delete this._selfVariablesData[key];
            }
        }
    };
    
    const _Game_Switches_clear = Game_Switches.prototype.clear;
    Game_Switches.prototype.clear = function () {
        _Game_Switches_clear.call(this);
        this._exSelfSwitchesData = {};
    };
    const _Game_Switches_value = Game_Switches.prototype.value;
    Game_Switches.prototype.value = function (switchId) {
        if (this.isExSelfSwitch(switchId)) {
            if (SelfVariableOrExSwitchUtils.isDebugScene())
                return false;
            const key = SelfVariableOrExSwitchUtils.currentExSelfSwitchKey(switchId);
            return this.exSelfSwitchValue(key);
        }
        else if (this.isCommonSwitch(switchId)) {
            if (SelfVariableOrExSwitchUtils.isDebugScene())
                return false;
            if (globalActiveInterpreter) {
                return globalActiveInterpreter.commonSwitchValue(switchId);
            }
            else {
                throw ErrorManager.invalidCommonVariableAccess(switchId);
            }
        }
        return _Game_Switches_value.call(this, switchId);
    };
    const _Game_Switches_setValue = Game_Switches.prototype.setValue;
    Game_Switches.prototype.setValue = function (switchId, value) {
        if (this.isExSelfSwitch(switchId)) {
            if (SelfVariableOrExSwitchUtils.isDebugScene())
                return;
            const key = SelfVariableOrExSwitchUtils.currentExSelfSwitchKey(switchId);
            this.setExSelfSwitchValue(key, value);
            return;
        }
        else if (this.isCommonSwitch(switchId)) {
            if (SelfVariableOrExSwitchUtils.isDebugScene())
                return;
            if (globalActiveInterpreter) {
                globalActiveInterpreter.setCommonSwitchValue(switchId, value);
            }
            else {
                throw ErrorManager.invalidCommonVariableAccess(switchId);
            }
        }
        return _Game_Switches_setValue.call(this, switchId, value);
    };
    Game_Switches.prototype.isExSelfSwitch = function (switchId) {
        const name = $dataSystem.switches[switchId];
        if (!name)
            return false;
        const prefixs = SelfVariableOrExSwitchUtils.checkPrefixs(name);
        return prefixs.includes("SelfVariable");
    };
    Game_Switches.prototype.isCommonSwitch = function (switchId) {
        const name = $dataSystem.switches[switchId];
        if (!name)
            return false;
        const prefixs = SelfVariableOrExSwitchUtils.checkPrefixs(name);
        return prefixs.includes("CommonVariable");
    };
    Game_Switches.prototype.exSelfSwitchValue = function (key) {
        return !!this._exSelfSwitchesData[key];
    };
    Game_Switches.prototype.setExSelfSwitchValue = function (key, value) {
        const switchId = key[2];
        if (switchId > 0 && switchId < $dataSystem.switches.length) {
            this._exSelfSwitchesData[key] = value;
            this.onChange();
        }
    };
    Game_Switches.prototype.setExSelfSwitchValueByEventTags = function (eventTags, selfSwitchId, value) {
        for (const event of $gameMap.events()) {
            for (const tag of eventTags) {
                if (event.eventTags().includes(tag)) {
                    event.setExSelfSwitchValue(selfSwitchId, value);
                    break;
                }
            }
        }
    };
    Game_Switches.prototype.clearExSelfSwitches = function (mapId, eventId = undefined, switchId = undefined) {
        for (const key in this._exSelfSwitchesData) {
            const [keyMapId, keyEventId, keySwitchId] = key.split(",").map(s => parseInt(s));
            if (keyMapId === mapId
                && (eventId == null || keyEventId === eventId)
                && (switchId == null || keySwitchId === switchId)) {
                delete this._exSelfSwitchesData[key];
            }
        }
    };
    
    const _Game_Interpreter_clear = Game_Interpreter.prototype.clear;
    Game_Interpreter.prototype.clear = function () {
        _Game_Interpreter_clear.call(this);
        this._commonVariableData = {};
        this._commonSwitchData = {};
    };
    Game_Interpreter.prototype.mapId = function () {
        return this._mapId;
    };
    Game_Interpreter.prototype.eventId = function () {
        return this._eventId;
    };
    Game_Interpreter.prototype.selfVariableOrExSwitchKey = function (id) {
        return [this._mapId, this._eventId, id];
    };
    Game_Interpreter.prototype.commonVariableValue = function (variableId) {
        return this._commonVariableData[variableId] || 0;
    };
    Game_Interpreter.prototype.setCommonVariableValue = function (variableId, value) {
        if (variableId > 0 && variableId < $dataSystem.variables.length) {
            if (!$gameVariables.isFloatVariable(variableId) && (typeof value === "number")) {
                value = Math.floor(value);
            }
            this._commonVariableData[variableId] = value;
        }
    };
    Game_Interpreter.prototype.commonSwitchValue = function (switchId) {
        return !!this._commonSwitchData[switchId];
    };
    Game_Interpreter.prototype.setCommonSwitchValue = function (switchId, value) {
        if (switchId > 0 && switchId < $dataSystem.switches.length) {
            this._commonSwitchData[switchId] = value;
        }
    };
    const _Game_Interpreter_executeCommand = Game_Interpreter.prototype.executeCommand;
    Game_Interpreter.prototype.executeCommand = function () {
        globalActiveInterpreter = this;
        const result = _Game_Interpreter_executeCommand.call(this);
        globalActiveInterpreter = undefined;
        return result;
    };
    
    const _Game_Event_initialize = Game_Event.prototype.initialize;
    Game_Event.prototype.initialize = function (...args) {
        _Game_Event_initialize.call(this, ...args);
        this._eventTags = this.parseEventTags();
    };
    Game_Event.prototype.parseEventTags = function () {
        let eventTags = new Set();
        const note = this.getAnnotation(0);
        const reg = /\<et\s*\:\s*(.+)\>/sg;
        while (true) {
            const matchData = reg.exec(note);
            if (!matchData)
                break;
            eventTags.add(matchData[1]);
        }
        return [...eventTags];
    };
    Game_Event.prototype.eventTags = function () {
        return this._eventTags;
    };
    Game_Event.prototype.addEventTag = function (eventTag) {
        if (!this.hasEventTag(eventTag))
            this._eventTags.push(eventTag);
    };
    Game_Event.prototype.hasEventTag = function (eventTag) {
        return this._eventTags.includes(eventTag);
    };
    Game_Event.prototype.getAnnotationValues = function (page) {
        const note = this.getAnnotation(page);
        const data = { note };
        DataManager.extractMetadata(data);
        return data.meta;
    };
    Game_Event.prototype.getAnnotation = function (page) {
        const eventData = this.event();
        if (eventData) {
            const noteLines = [];
            const pageList = eventData.pages[page].list;
            for (let i = 0; i < pageList.length; i++) {
                if (pageList[i].code === 108 || pageList[i].code === 408) {
                    noteLines.push(pageList[i].parameters[0]);
                }
                else {
                    break;
                }
            }
            return noteLines.join("\n");
        }
        return "";
    };
    Game_Event.prototype.selfVariableValue = function (variableId) {
        const key = this.selfVariableOrExSwitchKey(variableId);
        return $gameVariables.selfVariableValue(key);
    };
    Game_Event.prototype.setSelfVariableValue = function (variableId, value) {
        const key = this.selfVariableOrExSwitchKey(variableId);
        $gameVariables.setSelfVariableValue(key, value);
    };
    Game_Event.prototype.exSelfSwitchValue = function (switchId) {
        const key = this.selfVariableOrExSwitchKey(switchId);
        return $gameSwitches.exSelfSwitchValue(key);
    };
    Game_Event.prototype.setExSelfSwitchValue = function (switchId, value) {
        const key = this.selfVariableOrExSwitchKey(switchId);
        $gameSwitches.setExSelfSwitchValue(key, value);
    };
    const _Game_Event_refresh = Game_Event.prototype.refresh;
    Game_Event.prototype.refresh = function () {
        globalActiveEvent = this;
        _Game_Event_refresh.call(this);
        globalActiveEvent = undefined;
    };
    
    const _Game_Event_processMoveCommand = Game_Event.prototype.processMoveCommand;
    Game_Event.prototype.processMoveCommand = function (command) {
        globalActiveEvent = this;
        _Game_Event_processMoveCommand.call(this, command);
        globalActiveEvent = undefined;
    };
    Game_Event.prototype.selfVariableOrExSwitchKey = function (id) {
        return [$gameMap.mapId(), this.eventId(), id];
    };
})(SelfVariable || (SelfVariable = {}));
