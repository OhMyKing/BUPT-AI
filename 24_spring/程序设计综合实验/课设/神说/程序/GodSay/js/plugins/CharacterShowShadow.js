"use strict";
const SimpleShadowPluginName = document.currentScript ? decodeURIComponent(document.currentScript.src.match(/^.*\/(.+)\.js$/)[1]) : "SimpleShadow";
var SimpleShadow;
(function (SimpleShadow) {
    class PluginParamsParser {
        constructor(predictEnable = true) {
            this._predictEnable = predictEnable;
        }
        static parse(params, typeData, predictEnable = true) {
            return new PluginParamsParser(predictEnable).parse(params, typeData);
        }
        parse(params, typeData, loopCount = 0) {
            if (++loopCount > 255)
                throw new Error("endless loop error");
            const result = {};
            for (const name in typeData) {
                if (params[name] === "" || params[name] === undefined) {
                    result[name] = null;
                }
                else {
                    result[name] = this.convertParam(params[name], typeData[name], loopCount);
                }
            }
            if (!this._predictEnable)
                return result;
            if (typeof params === "object" && !(params instanceof Array)) {
                for (const name in params) {
                    if (result[name])
                        continue;
                    const param = params[name];
                    const type = this.predict(param);
                    result[name] = this.convertParam(param, type, loopCount);
                }
            }
            return result;
        }
        convertParam(param, type, loopCount) {
            if (typeof type === "string") {
                return this.cast(param, type);
            }
            else if (typeof type === "object" && type instanceof Array) {
                const aryParam = JSON.parse(param);
                if (type[0] === "string") {
                    return aryParam.map((strParam) => this.cast(strParam, type[0]));
                }
                else {
                    return aryParam.map((strParam) => this.parse(JSON.parse(strParam), type[0]), loopCount);
                }
            }
            else if (typeof type === "object") {
                return this.parse(JSON.parse(param), type, loopCount);
            }
            else {
                throw new Error(`${type} is not string or object`);
            }
        }
        cast(param, type) {
            switch (type) {
                case "any":
                    if (!this._predictEnable)
                        throw new Error("Predict mode is disable");
                    return this.cast(param, this.predict(param));
                case "string":
                    return param;
                case "number":
                    if (param.match(/^\-?\d+\.\d+$/))
                        return parseFloat(param);
                    return parseInt(param);
                case "boolean":
                    return param === "true";
                default:
                    throw new Error(`Unknow type: ${type}`);
            }
        }
        predict(param) {
            if (param.match(/^\-?\d+$/) || param.match(/^\-?\d+\.\d+$/)) {
                return "number";
            }
            else if (param === "true" || param === "false") {
                return "boolean";
            }
            else {
                return "string";
            }
        }
    }
    const typeDefine = {
        ShowShadowCharacterList: [{}]
    };
    const PP = PluginParamsParser.parse(PluginManager.parameters(SimpleShadowPluginName), typeDefine);
    function mixin(dest, src) {
        for (const name of Object.getOwnPropertyNames(src.prototype)) {
            if (name === "constructor")
                continue;
            const value = Object.getOwnPropertyDescriptor(src.prototype, name) || Object.create(null);
            Object.defineProperty(dest.prototype, name, value);
        }
    }
    class Game_CharacterBase_Mixin extends Game_CharacterBase {
        initMembers() {
            Game_CharacterBase_Mixin._initMembers.call(this);
            this._needShadowByShowShadowList = false;
        }
        setImage(characterName, characterIndex) {
            Game_CharacterBase_Mixin._setImage.call(this, characterName, characterIndex);
            this._needShadowByShowShadowList = this.checkIncludedShowShadowCharacterList();
        }
        isNeedShadow() {
            if (this._needShadowByApi != null)
                return this._needShadowByApi;
            return this._needShadowByShowShadowList;
        }
        showShadow() {
            this._needShadowByApi = true;
        }
        hideShadow() {
            this._needShadowByApi = false;
        }
        shadowScreenX() {
            return this.screenX();
        }
        shadowScreenY() {
            const th = $gameMap.tileHeight();
            return Math.floor(this.scrolledY() * th + th - this.shiftY() + PP.ShadowYOffset);
        }
        shadowScreenZ() {
            return this.screenZ() - 1;
        }
        checkIncludedShowShadowCharacterList() {
            for (const showShadowCharacter of PP.ShowShadowCharacterList) {
                if (showShadowCharacter.CharacterFileName === this._characterName &&
                    (showShadowCharacter.CharacterIndex < 0 || ImageManager.isBigCharacter(this._characterName) || showShadowCharacter.CharacterIndex === this._characterIndex)) {
                    return true;
                }
            }
            return false;
        }
    }
    Game_CharacterBase_Mixin._initMembers = Game_CharacterBase.prototype.initMembers;
    Game_CharacterBase_Mixin._setImage = Game_CharacterBase.prototype.setImage;
    mixin(Game_CharacterBase, Game_CharacterBase_Mixin);
    class Game_Event_Mixin extends Game_Event {
        refresh() {
            Game_Event_Mixin._refresh.call(this);
            const values = this.getAnnotationValues(0);
            if (this.event().meta.showShadow || values.showShadow) {
                this._needShadowByMeta = true;
            }
            else if (this.event().meta.hideShadow || values.hideShadow) {
                this._needShadowByMeta = false;
            }
        }
        isNeedShadow() {
            if (this._needShadowByApi != null)
                return this._needShadowByApi;
            if (this._needShadowByMeta != null)
                return this._needShadowByMeta;
            return this._needShadowByShowShadowList;
        }
        getAnnotationValues(page) {
            const note = this.getAnnotation(page);
            const data = { note };
            DataManager.extractMetadata(data);
            return data.meta;
        }
        getAnnotation(page) {
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
        }
    }
    Game_Event_Mixin._refresh = Game_Event.prototype.refresh;
    mixin(Game_Event, Game_Event_Mixin);
    class Sprite_Shadow extends Sprite {
        constructor(...args) {
            super(...args);
        }
        initialize(character) {
            super.initialize();
            this.hide();
            this.bitmap = ImageManager.loadBitmap("img/", PP.ShadowImageFileName);
            this.anchor.x = 0.5;
            this.anchor.y = 1;
            this._character = character;
            this.updatePosition();
        }
        update() {
            super.update();
            this.updatePosition();
            this.updateVisible();
        }
        character() {
            return this._character;
        }
        updatePosition() {
            this.x = this._character.shadowScreenX();
            this.y = this._character.shadowScreenY();
            this.z = this._character.shadowScreenZ();
        }
        updateVisible() {
            this.visible = this._character.isNeedShadow();
            const spriteset = SceneManager._scene._spriteset;
            const characterSprite = spriteset.findTargetSprite(this._character);
            if (characterSprite && characterSprite.visible) {
                if (this._character.isNeedShadow()) {
                    this.visible = true;
                }
                else {
                    this.visible = false;
                }
            }
            else {
                this.visible = false;
            }
        }
    }
    SimpleShadow.Sprite_Shadow = Sprite_Shadow;
    class Sprite_Character_Mixin extends Sprite_Character {
        character() {
            return this._character;
        }
    }
    mixin(Sprite_Character, Sprite_Character_Mixin);
    class Spriteset_Map_Mixin extends Spriteset_Map {
        initialize() {
            
            this._characterShadowSprites = [];
            Spriteset_Map_Mixin._initialize.call(this);
        }
        update() {
            Spriteset_Map_Mixin._update.call(this);
            this.updateCharacterShadows();
        }
        createLowerLayer() {
            Spriteset_Map_Mixin._createLowerLayer.call(this);
            this.updateCharacterShadows();
        }
        updateCharacterShadows() {
            const spriteCharacters = this._characterSprites.map(sprite => sprite.character());
            const shadowSpriteCharacter = this._characterShadowSprites.map(sprite => sprite.character());
            for (const characterSprite of this._characterSprites) {
                const character = characterSprite.character();
                if (!shadowSpriteCharacter.includes(character)) {
                    this.createShadowSprite(character);
                }
            }
            for (const shadowSprite of this._characterShadowSprites.concat()) {
                const character = shadowSprite.character();
                if (!spriteCharacters.includes(character)) {
                    this.removeShadowSprite(shadowSprite);
                }
            }
        }
        createShadowSprite(character) {
            const shadowSprite = new Sprite_Shadow(character);
            this._tilemap.addChild(shadowSprite);
            this._characterShadowSprites.push(shadowSprite);
        }
        removeShadowSprite(shadowSprite) {
            this._tilemap.removeChild(shadowSprite);
            this._characterShadowSprites = this._characterShadowSprites.filter(sprite => sprite !== shadowSprite);
        }
    }
    Spriteset_Map_Mixin._createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map_Mixin._initialize = Spriteset_Map.prototype.initialize;
    Spriteset_Map_Mixin._update = Spriteset_Map.prototype.update;
    mixin(Spriteset_Map, Spriteset_Map_Mixin);
})(SimpleShadow || (SimpleShadow = {}));
