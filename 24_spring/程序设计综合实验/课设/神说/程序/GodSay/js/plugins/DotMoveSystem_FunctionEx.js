"use strict";
const DotMoveSystem_FunctionExPluginName = document.currentScript ? decodeURIComponent(document.currentScript.src.match(/^.*\/(.+)\.js$/)[1]) : "DotMoveSystem_FunctionEx";
var DotMoveSystem;
(function (DotMoveSystem) {
    var FunctionEx;
    (function (FunctionEx) {
        class PluginParamsParser {
            constructor(predictEnable = true) {
                this._predictEnable = predictEnable;
            }
            static parse(params, typeData = {}, predictEnable = true) {
                return new PluginParamsParser(predictEnable).parse(params, typeData);
            }
            parse(params, typeData = {}) {
                const result = {};
                for (const name in params) {
                    const expandedParam = this.expandParam(params[name]);
                    result[name] = this.convertParam(expandedParam, typeData[name]);
                }
                return result;
            }
            expandParam(strParam, loopCount = 0) {
                if (++loopCount > 255)
                    throw new Error("endless loop error");
                if (strParam.match(/^\s*\[.*\]\s*$/)) {
                    const aryParam = JSON.parse(strParam);
                    return aryParam.map((data) => this.expandParam(data), loopCount + 1);
                }
                else if (strParam.match(/^\s*\{.*\}\s*$/)) {
                    const result = {};
                    const objParam = JSON.parse(strParam);
                    for (const name in objParam) {
                        result[name] = this.expandParam(objParam[name], loopCount + 1);
                    }
                    return result;
                }
                return strParam;
            }
            convertParam(param, type, loopCount = 0) {
                if (++loopCount > 255)
                    throw new Error("endless loop error");
                if (typeof param === "string") {
                    return this.cast(param, type);
                }
                else if (typeof param === "object" && param instanceof Array) {
                    if (!((param == null) || (typeof param === "object" && param instanceof Array))) {
                        throw new Error(`Invalid array type: ${type}`);
                    }
                    return param.map((data, i) => {
                        const dataType = type == null ? undefined : type[i];
                        return this.convertParam(data, dataType, loopCount + 1);
                    });
                }
                else if (typeof param === "object") {
                    if (!((param == null) || (typeof param === "object"))) {
                        throw new Error(`Invalid object type: ${type}`);
                    }
                    const result = {};
                    for (const name in param) {
                        const dataType = type == null ? undefined : type[name];
                        result[name] = this.convertParam(param[name], dataType, loopCount + 1);
                    }
                    return result;
                }
                else {
                    throw new Error(`Invalid param: ${param}`);
                }
            }
            cast(param, type) {
                if (param == null || param === "")
                    return undefined;
                if (type == null)
                    type = "any";
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
        FunctionEx.PluginParamsParser = PluginParamsParser;
        const typeDefine = {
            PlayerInfo: {},
            FollowerInfo: {},
            HalfCollisionMassInfo: {},
            TriangleCollisionMassInfo: {},
        };
        const PP = PluginParamsParser.parse(PluginManager.parameters(DotMoveSystem_FunctionExPluginName), typeDefine);
        
        const LEFT_UP_TRIANGLE_ID = 13;
        const DOWN_LEFT_TRIANGLE_ID = 14;
        const RIGHT_DOWN_TRIANGLE_ID = 15;
        const UP_RIGHT_TRIANGLE_ID = 16;
        const START_TRIANGLE_ID = 13;
        const END_TRIANGLE_ID = 16;
        
        const _CharacterMover_initialize = DotMoveSystem.CharacterMover.prototype.initialize;
        DotMoveSystem.CharacterMover.prototype.initialize = function (character) {
            _CharacterMover_initialize.call(this, character);
            this._lastDirection = character.direction();
            this._changeDirectionCount = 0;
            this._direction8 = this._character.direction();
        };
        const _Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
        Game_CharacterBase.prototype.initMembers = function () {
            _Game_CharacterBase_initMembers.call(this);
            this._acceleration = 0;
            this._inertia = 1;
            this._accelerationPlus = 0;
            this._maxAcceleration = 0;
            this._enableWallSlide = true;
        };
        const _Game_Player_initMembers = Game_Player.prototype.initMembers;
        Game_Player.prototype.initMembers = function () {
            _Game_Player_initMembers.call(this);
            this._width = PP.PlayerInfo.Width;
            this._height = PP.PlayerInfo.Height;
            this._offsetX = PP.PlayerInfo.OffsetX;
            this._offsetY = PP.PlayerInfo.OffsetY;
            this._slideLengthX = PP.PlayerInfo.SlideLengthX;
            this._slideLengthY = PP.PlayerInfo.SlideLengthY;
            this._transferOffsetX = PP.PlayerInfo.TransferOffsetX == null ? 0 : PP.PlayerInfo.TransferOffsetX;
            this._transferOffsetY = PP.PlayerInfo.TransferOffsetX == null ? 0 : PP.PlayerInfo.TransferOffsetX;
            this._enableTransferOffset = true;
        };
        if (!Game_Follower.prototype.hasOwnProperty("initMembers")) {
            Game_Follower.prototype.initMembers = function () {
                Game_Character.prototype.initMembers.call(this);
            };
        }
        const _Game_Follower_initMembers = Game_Follower.prototype.initMembers;
        Game_Follower.prototype.initMembers = function () {
            _Game_Follower_initMembers.call(this);
            this._width = PP.FollowerInfo.Width;
            this._height = PP.FollowerInfo.Height;
            this._offsetX = PP.FollowerInfo.OffsetX;
            this._offsetY = PP.FollowerInfo.OffsetY;
            this._slideLengthX = PP.FollowerInfo.SlideLengthX;
            this._slideLengthY = PP.FollowerInfo.SlideLengthY;
            this._transferOffsetX = PP.FollowerInfo.TransferOffsetX == null ? 0 : PP.FollowerInfo.TransferOffsetX;
            this._transferOffsetY = PP.FollowerInfo.TransferOffsetX == null ? 0 : PP.FollowerInfo.TransferOffsetX;
        };
        
        const _CharacterMover_updateMove = DotMoveSystem.CharacterMover.prototype.updateMove;
        DotMoveSystem.CharacterMover.prototype.updateMove = function () {
            _CharacterMover_updateMove.call(this);
            
            
        };
        const _Game_CharacterBase_update = Game_CharacterBase.prototype.update;
        Game_CharacterBase.prototype.update = function () {
            if (this.isJumping() && this.isSmartJumping())
                this.updateSmartJump();
            if (this.isNeedUpdateAcceleration())
                this.updateAcceleration();
            this.updateCurrentDpf();
            _Game_CharacterBase_update.call(this);
        };
        
        Game_Player.prototype.setEnableTransferOffset = function (bool) {
            this._enableTransferOffset = bool;
        };
        const _Game_Player_reserveTransfer = Game_Player.prototype.reserveTransfer;
        Game_Player.prototype.reserveTransfer = function (mapId, x, y, d, fadeType) {
            _Game_Player_reserveTransfer.call(this, mapId, x, y, d, fadeType);
            this._newX = x + this._transferOffsetX;
            this._newY = y + this._transferOffsetY;
        };
        
        DotMoveSystem.CharacterMover.prototype.updateChangeDirection = function () {
            if (!this._reserveChangeDirection)
                return;
            const direction = this._lastDirection;
            if (direction !== this._character.direction()) {
                this._changeDirectionCount++;
                if (this._changeDirectionCount >= 3) {
                    this._reserveChangeDirection = false;
                    const deg = DotMoveSystem.Degree.fromDirection(direction);
                    const direction4 = deg.toDirection4(this._character.direction());
                    this.setDirection8(direction);
                    this.setDirection(direction4);
                    this._reserveSetDirection = undefined;
                }
            }
        };
        DotMoveSystem.CharacterMover.prototype.setDirection8 = function (direction8) {
            this._direction8 = direction8;
        };
        DotMoveSystem.CharacterMover.prototype.direction8 = function () {
            return this._direction8;
        };
        const _CharacterMover_dotMoveByDeg = DotMoveSystem.CharacterMover.prototype.dotMoveByDeg;
        DotMoveSystem.CharacterMover.prototype.dotMoveByDeg = function (deg, dpf = this._character.distancePerFrame(), opt = { changeDir: true }) {
            if (opt.changeDir) {
                this.changeDirectionWhenDotMove(deg.toDirection8());
            }
            _CharacterMover_dotMoveByDeg.call(this, deg, dpf);
        };
        const _CharacterMover_dotMoveByDirection = DotMoveSystem.CharacterMover.prototype.dotMoveByDirection;
        DotMoveSystem.CharacterMover.prototype.dotMoveByDirection = function (direction, dpf = this._character.distancePerFrame(), opt = {}) {
            const changeDir = opt.changeDir == null ? true : opt.changeDir;
            if (changeDir) {
                this.changeDirectionWhenDotMove(direction);
            }
            _CharacterMover_dotMoveByDirection.call(this, direction, dpf);
        };
        DotMoveSystem.CharacterMover.prototype.changeDirectionWhenDotMove = function (direction) {
            if (this._lastDirection !== direction) {
                this._lastDirection = direction;
                this._changeDirectionCount = 0;
                this._reserveChangeDirection = true;
                this.setDirection8(direction);
                const deg = DotMoveSystem.Degree.fromDirection(direction);
                const direction4 = deg.toDirection4(this._character.direction());
                this.setDirection(direction4);
            }
        };
        Game_CharacterBase.prototype.originDistancePerFrame = Game_CharacterBase.prototype.distancePerFrame;
        Game_CharacterBase.prototype.distancePerFrame = function () {
            if (this._dpf == null)
                return this.originDistancePerFrame();
            return this._currentDpf;
        };
        Game_CharacterBase.prototype.updateCurrentDpf = function () {
            const dpf = this.realDpf();
            if (this.isNeedUpdateAcceleration()) {
                const acc = 1 + this._acceleration / this._maxAcceleration * this._accelerationPlus;
                this._currentDpf = dpf * acc;
            }
            else {
                this._currentDpf = dpf;
            }
        };
        Game_CharacterBase.prototype.setDpf = function (dpf) {
            this._dpf = dpf;
        };
        Game_CharacterBase.prototype.setAcc = function (maxAcc, accPlus) {
            this._maxAcceleration = maxAcc;
            this._accelerationPlus = accPlus;
        };
        Game_CharacterBase.prototype.setInertia = function (inertia) {
            this._inertia = inertia;
        };
        Game_CharacterBase.prototype.isNeedUpdateAcceleration = function () {
            return this._dpf != null && this._maxAcceleration !== 0 && this._accelerationPlus !== 0;
        };
        Game_CharacterBase.prototype.updateAcceleration = function () {
            if ($gameMap.isEventRunning()) {
                this.cancelAcceleration();
            }
            else {
                if (this.isMoved()) {
                    if (this._acceleration < this._maxAcceleration) {
                        this._acceleration++;
                    }
                }
                else {
                    if (!this.isMoving() && this._acceleration > 0) {
                        this.inertiaMoveProcess();
                    }
                }
            }
        };
        Game_CharacterBase.prototype.inertiaMoveProcess = function () {
            this._acceleration -= this._inertia;
            if (this._acceleration < 0)
                this._acceleration = 0;
            
            
            this.mover().dotMoveByDirection(this.direction(), undefined, { changeDir: false });
        };
        Game_CharacterBase.prototype.cancelAcceleration = function () {
            this._acceleration = 0;
        };
        Game_CharacterBase.prototype.realDpf = function () {
            if (this._dpf == null)
                return 0;
            return this._dpf;
        };
        Game_Player.prototype.distancePerFrame = function () {
            if (this.isInVehicle())
                return this.originDistancePerFrame();
            return Game_CharacterBase.prototype.distancePerFrame.call(this);
        };
        Game_Player.prototype.isNeedUpdateAcceleration = function () {
            if (this.isInVehicle())
                return false;
            return Game_CharacterBase.prototype.isNeedUpdateAcceleration.call(this);
        };
        Game_Player.prototype.realDpf = function () {
            if (this._dpf == null)
                return 0;
            if (this.isDashing())
                return this._dpf * 2;
            return this._dpf;
        };
        Game_Player.prototype.inertiaMoveProcess = function () {
            Game_Character.prototype.inertiaMoveProcess.call(this);
            this.checkEventTriggerHere([1, 2]);
            $gameMap.setupStartingEvent();
        };
        Game_Follower.prototype.distancePerFrame = function () {
            if ($gamePlayer.isInVehicle())
                return this.originDistancePerFrame();
            return Game_CharacterBase.prototype.distancePerFrame.call(this);
        };
        Game_Follower.prototype.isNeedUpdateAcceleration = function () {
            if ($gamePlayer.isInVehicle())
                return false;
            return Game_CharacterBase.prototype.isNeedUpdateAcceleration.call(this);
        };
        Game_Follower.prototype.changeFollowerSpeed = function (precedingCharacterFar) {
            if ($gamePlayer.distancePerFrame()) {
                this.setDpf(this.calcFollowerDpf(precedingCharacterFar));
            }
            else {
                this.setDpf(undefined);
                this.setMoveSpeed(this.calcFollowerSpeed(precedingCharacterFar));
            }
        };
        Game_Follower.prototype.calcFollowerDpf = function (precedingCharacterFar) {
            if (precedingCharacterFar >= 2) {
                return $gamePlayer.distancePerFrame() * 2;
            }
            else if (precedingCharacterFar >= 1.5) {
                return $gamePlayer.distancePerFrame();
            }
            else if (precedingCharacterFar >= 1) {
                return $gamePlayer.distancePerFrame() / 2;
            }
            else {
                return 0;
            }
        };
        const _Scene_Map_callMenu = Scene_Map.prototype.callMenu;
        Scene_Map.prototype.callMenu = function () {
            _Scene_Map_callMenu.call(this);
            $gamePlayer.cancelAcceleration();
        };
        
        DotMoveSystem.CharacterDotMoveProcess.prototype.dotMoveByDeg = function (deg, dpf = this._character.distancePerFrame()) {
            this._dpf = dpf;
            const direction = deg.toDirection8();
            const distance = this.calcDistance(deg);
            let movedPoint = this.calcMovedPoint(direction, distance);
            const realPoint = this._character.positionPoint();
            const margin = this._character.distancePerFrame() / DotMoveSystem.DotMoveUtils.MOVED_MARGIN_UNIT;
            let moved = true;
            if (this.reachPoint(realPoint, movedPoint, margin))
                moved = false;
            if (moved && !this._character.isEnabledWallSlide()) {
                const targetPoint = realPoint.add(distance);
                if (!this.reachPoint(targetPoint, movedPoint, margin)) {
                    
                    if (Math.abs(targetPoint.x - movedPoint.x) <= margin) {
                        movedPoint.x = realPoint.x;
                    }
                    if (Math.abs(targetPoint.y - movedPoint.y) <= margin) {
                        movedPoint.y = realPoint.y;
                    }
                    if (this.reachPoint(realPoint, movedPoint, margin))
                        moved = false;
                }
            }
            movedPoint.x = $gameMap.roundX(movedPoint.x);
            movedPoint.y = $gameMap.roundY(movedPoint.y);
            this._character.setPositionPoint(movedPoint);
            return moved;
        };
        Game_CharacterBase.prototype.isEnabledWallSlide = function () {
            return this._enableWallSlide;
        };
        Game_CharacterBase.prototype.setEnableWallSlide = function (bool) {
            this._enableWallSlide = bool;
        };
        
        const _CharacterMover_continuousMoveProcess = DotMoveSystem.CharacterMover.prototype.continuousMoveProcess;
        DotMoveSystem.CharacterMover.prototype.continuousMoveProcess = function () {
            
            this.eventPushProcess();
            _CharacterMover_continuousMoveProcess.call(this);
        };
        const _CharacterMover_dotMoveByDeg_2 = DotMoveSystem.CharacterMover.prototype.dotMoveByDeg;
        DotMoveSystem.CharacterMover.prototype.dotMoveByDeg = function (deg, dpf = this._character.distancePerFrame()) {
            if (this._moverData.stopping)
                return;
            this.eventPushProcess();
            _CharacterMover_dotMoveByDeg_2.call(this, deg, dpf);
        };
        DotMoveSystem.CharacterMover.prototype.eventPushProcess = function () {
            if (!this._character.canPushEvent())
                return;
            const pos = this._character.positionPoint();
            const dpf = this._character.distancePerFrame();
            const margin = dpf / 2;
            const dir = this._character.direction();
            for (const result of this.checkHitCharactersStepDir(pos.x, pos.y, dir, Game_Event)) {
                const event = result.targetObject;
                if (event.isPushableEvent()) {
                    if (!(result.collisionLengthX() >= margin && result.collisionLengthY() >= margin))
                        continue;
                    event.mover().dotMoveByDirection(dir);
                }
            }
        };
        Game_CharacterBase.prototype.canPushEvent = function () {
            return false;
        };
        Game_Player.prototype.canPushEvent = function () {
            return true;
        };
        Game_Event.prototype.isPushableEvent = function () {
            if (this._pushableEvent == null)
                return false;
            return this._pushableEvent;
        };
        const _Game_Event_initialize = Game_Event.prototype.initialize;
        Game_Event.prototype.initialize = function (mapId, eventId) {
            _Game_Event_initialize.call(this, mapId, eventId);
            if (this.event().meta.PushableEvent) {
                this._pushableEvent = true;
            }
            else {
                const values = this.getAnnotationValues(0);
                if (values.PushableEvent) {
                    this._pushableEvent = true;
                }
            }
        };
        
        Game_CharacterBase.prototype.smartJump = function (xPlus, yPlus, baseJumpPeak = 10, through = false) {
            this._jumpXPlus = xPlus;
            this._jumpYPlus = yPlus;
            this._smartJumpLastThrough = this._through;
            
            if (!(this._through && !through)) {
                this._through = through;
            }
            if (Math.abs(xPlus) > Math.abs(yPlus)) {
                if (xPlus !== 0) {
                    this.setDirection(xPlus < 0 ? 4 : 6);
                }
            }
            else {
                if (yPlus !== 0) {
                    this.setDirection(yPlus < 0 ? 8 : 2);
                }
            }
            const distance = Math.round(Math.sqrt(xPlus ** 2 + yPlus ** 2));
            this._jumpPeak = baseJumpPeak + distance - this._moveSpeed;
            this._jumpCount = this._jumpPeak * 2;
            this.resetStopCount();
            this.straighten();
        };
        Game_CharacterBase.prototype.smartJumpByDeg = function (deg, far, baseJumpPeak = 10, through = false) {
            const dis = DotMoveSystem.DotMoveUtils.calcDistance(new DotMoveSystem.Degree(deg), far);
            this.smartJump(dis.x, dis.y, baseJumpPeak, through);
        };
        Game_CharacterBase.prototype.smartJumpAbs = function (x, y, baseJumpPeak = 10, through = false) {
            const xPlus = x - this._realX;
            const yPlus = y - this._realY;
            this.smartJump(xPlus, yPlus, baseJumpPeak, through);
        };
        Game_CharacterBase.prototype.isSmartJumping = function () {
            return this._jumpXPlus != null || this._jumpYPlus != null;
        };
        const _Game_CharacterBase_updateJump = Game_CharacterBase.prototype.updateJump;
        Game_CharacterBase.prototype.updateJump = function () {
            if (!this.isSmartJumping())
                _Game_CharacterBase_updateJump.call(this);
        };
        Game_CharacterBase.prototype.updateSmartJump = function () {
            this._jumpCount--;
            if (this._jumpXPlus !== 0 || this._jumpYPlus !== 0) {
                const x = this._realX + this._jumpXPlus / (this._jumpPeak * 2);
                const y = this._realY + this._jumpYPlus / (this._jumpPeak * 2);
                const dis = new DotMoveSystem.DotMovePoint(x - this._realX, y - this._realY);
                const zero = new DotMoveSystem.DotMovePoint();
                this.mover().dotMoveByDeg(zero.calcDeg(dis), zero.calcFar(dis));
            }
            if (this._jumpCount === 0) {
                this._jumpXPlus = undefined;
                this._jumpYPlus = undefined;
                this._through = this._smartJumpLastThrough;
                this.setPosition(this._realX, this._realY);
            }
        };
        Game_Player.prototype.smartJump = function (xPlus, yPlus, baseJumpPeak = 10, through = false) {
            Game_Character.prototype.smartJump.call(this, xPlus, yPlus, baseJumpPeak, through);
            for (const follower of this.followers().data()) {
                const targetX = this._realX + xPlus;
                const targetY = this._realY + yPlus;
                follower.smartJumpAbs(targetX, targetY, baseJumpPeak, through);
            }
        };
        Game_Player.prototype.smartJumpAbs = function (x, y, baseJumpPeak = 10, through = false) {
            Game_Character.prototype.smartJumpAbs.call(this, x, y, baseJumpPeak, through);
            for (const follower of this.followers().data()) {
                follower.smartJumpAbs(x, y, baseJumpPeak, through);
            }
        };
        Game_Player.prototype.updateSmartJump = function () {
            Game_Character.prototype.updateSmartJump.call(this);
            if (!this.isSmartJumping())
                this.setupCollideTriggerEventIds();
        };
        
        DotMoveSystem.CharacterCollisionChecker.prototype.getMassRects = function (x, y) {
            switch (this.getMassCollisionType(x, y)) {
                case 1:
                    return [new DotMoveSystem.DotMoveRectangle(x, y, 1, 0.5)];
                case 2:
                    return [new DotMoveSystem.DotMoveRectangle(x + 0.5, y, 0.5, 1)];
                case 3:
                    return [new DotMoveSystem.DotMoveRectangle(x, y + 0.5, 1, 0.5)];
                case 4:
                    return [new DotMoveSystem.DotMoveRectangle(x, y, 0.5, 1)];
                case 5:
                    return [new DotMoveSystem.DotMoveRectangle(x + 0.5, y, 0.5, 0.5)];
                case 6:
                    return [new DotMoveSystem.DotMoveRectangle(x + 0.5, y + 0.5, 0.5, 0.5)];
                case 7:
                    return [new DotMoveSystem.DotMoveRectangle(x, y + 0.5, 0.5, 0.5)];
                case 8:
                    return [new DotMoveSystem.DotMoveRectangle(x, y, 0.5, 0.5)];
                case 9:
                    return [new DotMoveSystem.DotMoveRectangle(x, y, 0.5, 1), new DotMoveSystem.DotMoveRectangle(x + 0.5, y + 0.5, 0.5, 0.5)];
                case 10:
                    return [new DotMoveSystem.DotMoveRectangle(x, y, 0.5, 1), new DotMoveSystem.DotMoveRectangle(x + 0.5, y, 0.5, 0.5)];
                case 11:
                    return [new DotMoveSystem.DotMoveRectangle(x + 0.5, y, 0.5, 1), new DotMoveSystem.DotMoveRectangle(x, y, 0.5, 0.5)];
                case 12:
                    return [new DotMoveSystem.DotMoveRectangle(x + 0.5, y, 0.5, 1), new DotMoveSystem.DotMoveRectangle(x, y + 0.5, 0.5, 0.5)];
            }
            return [new DotMoveSystem.DotMoveRectangle(x, y, 1, 1)];
        };
        DotMoveSystem.CharacterCollisionChecker.prototype.getMassCollisionType = function (x, y) {
            const regionId = $gameMap.regionId(x, y);
            const terrainTag = $gameMap.terrainTag(x, y);
            if (regionId > 0) {
                switch (regionId) {
                    case PP.HalfCollisionMassInfo.UpCollisionRegionId:
                        return 1;
                    case PP.HalfCollisionMassInfo.RightCollisionRegionId:
                        return 2;
                    case PP.HalfCollisionMassInfo.DownCollisionRegionId:
                        return 3;
                    case PP.HalfCollisionMassInfo.LeftCollisionRegionId:
                        return 4;
                    case PP.HalfCollisionMassInfo.UpRightCollisionRegionId:
                        return 5;
                    case PP.HalfCollisionMassInfo.RightDownCollisionRegionId:
                        return 6;
                    case PP.HalfCollisionMassInfo.DownLeftCollisionRegionId:
                        return 7;
                    case PP.HalfCollisionMassInfo.LeftUpCollisionRegionId:
                        return 8;
                    case PP.HalfCollisionMassInfo.UpRightOpenCollisionRegionId:
                        return 9;
                    case PP.HalfCollisionMassInfo.RightDownOpenCollisionRegionId:
                        return 10;
                    case PP.HalfCollisionMassInfo.DownLeftOpenCollisionRegionId:
                        return 11;
                    case PP.HalfCollisionMassInfo.LeftUpOpenCollisionRegionId:
                        return 12;
                    case PP.TriangleCollisionMassInfo.LeftUpTriangleRegionId:
                        return LEFT_UP_TRIANGLE_ID;
                    case PP.TriangleCollisionMassInfo.DownLeftTriangleRegionId:
                        return DOWN_LEFT_TRIANGLE_ID;
                    case PP.TriangleCollisionMassInfo.RightDownTriangleRegionId:
                        return RIGHT_DOWN_TRIANGLE_ID;
                    case PP.TriangleCollisionMassInfo.UpRightTriangleRegionId:
                        return UP_RIGHT_TRIANGLE_ID;
                }
            }
            if (terrainTag > 0) {
                switch (terrainTag) {
                    case PP.HalfCollisionMassInfo.UpCollisionTerrainTagId:
                        return 1;
                    case PP.HalfCollisionMassInfo.RightCollisionTerrainTagId:
                        return 2;
                    case PP.HalfCollisionMassInfo.DownCollisionTerrainTagId:
                        return 3;
                    case PP.HalfCollisionMassInfo.LeftCollisionTerrainTagId:
                        return 4;
                    case PP.HalfCollisionMassInfo.UpRightCollisionTerrainTagId:
                        return 5;
                    case PP.HalfCollisionMassInfo.RightDownCollisionTerrainTagId:
                        return 6;
                    case PP.HalfCollisionMassInfo.DownLeftCollisionTerrainTagId:
                        return 7;
                    case PP.HalfCollisionMassInfo.LeftUpCollisionTerrainTagId:
                        return 8;
                    case PP.HalfCollisionMassInfo.UpRightOpenCollisionTerrainTagId:
                        return 9;
                    case PP.HalfCollisionMassInfo.RightDownOpenCollisionTerrainTagId:
                        return 10;
                    case PP.HalfCollisionMassInfo.DownLeftOpenCollisionTerrainTagId:
                        return 11;
                    case PP.HalfCollisionMassInfo.LeftUpOpenCollisionTerrainTagId:
                        return 12;
                    case PP.TriangleCollisionMassInfo.LeftUpTriangleTerrainTagId:
                        return LEFT_UP_TRIANGLE_ID;
                    case PP.TriangleCollisionMassInfo.DownLeftTriangleTerrainTagId:
                        return DOWN_LEFT_TRIANGLE_ID;
                    case PP.TriangleCollisionMassInfo.RightDownTriangleTerrainTagId:
                        return RIGHT_DOWN_TRIANGLE_ID;
                    case PP.TriangleCollisionMassInfo.UpRightTriangleTerrainTagId:
                        return UP_RIGHT_TRIANGLE_ID;
                }
            }
            return 0;
        };
        const _CharacterCollisionChecker_isNoTargetMass = DotMoveSystem.CharacterCollisionChecker.prototype.isNoCheckMass;
        DotMoveSystem.CharacterCollisionChecker.prototype.isNoCheckMass = function (ix, iy, d, massRange) {
            if (this.getMassCollisionType(ix, iy) >= 1 && this.getMassCollisionType(ix, iy) <= END_TRIANGLE_ID) {
                return false;
            }
            return _CharacterCollisionChecker_isNoTargetMass.call(this, ix, iy, d, massRange);
        };
        DotMoveSystem.CharacterCollisionChecker.prototype.checkCollisionMass = function (subjectRect, d, ix, iy) {
            const results = [];
            if (!this.checkPassMass(ix, iy, d)) {
                const massRects = this.getMassRects(ix, iy);
                for (const massRect of massRects) {
                    const result = this.checkCollidedRect(d, subjectRect.clone(), massRect, new DotMoveSystem.MassInfo(ix, iy));
                    if (result)
                        results.push(result);
                }
            }
            return results;
        };
        DotMoveSystem.CharacterCollisionChecker.prototype.checkPassMass = function (ix, iy, d) {
            if (!$gameMap.isValid(ix, iy)) {
                return false;
            }
            if (this._character.isThrough() || this._character.isDebugThrough()) {
                return true;
            }
            if (this.getMassCollisionType(ix, iy) >= 1 && this.getMassCollisionType(ix, iy) <= END_TRIANGLE_ID) {
                return false;
            }
            const prevPoint = DotMoveSystem.DotMoveUtils.prevPointWithDirection(new DotMoveSystem.DotMovePoint(ix, iy), d);
            if (this.getMassCollisionType(prevPoint.x, prevPoint.y) >= 1 && this.getMassCollisionType(prevPoint.x, prevPoint.y) <= END_TRIANGLE_ID) {
                return true;
            }
            if (!this._character.isMapPassable(prevPoint.x, prevPoint.y, d)) {
                return false;
            }
            return true;
        };
        const _CharacterCollisionChecker_checkCollisionXCliff = DotMoveSystem.CharacterCollisionChecker.prototype.checkCollisionXCliff;
        DotMoveSystem.CharacterCollisionChecker.prototype.checkCollisionXCliff = function (subjectRect, x1, x2, iy, d) {
            if (this.getMassCollisionType(x1, iy) >= 1 && this.getMassCollisionType(x1, iy) <= END_TRIANGLE_ID && this.getMassCollisionType(x2, iy) >= 1 && this.getMassCollisionType(x2, iy) <= END_TRIANGLE_ID) {
                return [];
            }
            return _CharacterCollisionChecker_checkCollisionXCliff.call(this, subjectRect, x1, x2, iy, d);
        };
        const _CharacterCollisionChecker_checkCollisionYCliff = DotMoveSystem.CharacterCollisionChecker.prototype.checkCollisionYCliff;
        DotMoveSystem.CharacterCollisionChecker.prototype.checkCollisionYCliff = function (subjectRect, y1, y2, ix, d) {
            if (this.getMassCollisionType(ix, y1) >= 1 && this.getMassCollisionType(ix, y1) <= END_TRIANGLE_ID && this.getMassCollisionType(ix, y2) >= 1 && this.getMassCollisionType(ix, y2) <= END_TRIANGLE_ID) {
                return [];
            }
            return _CharacterCollisionChecker_checkCollisionYCliff.call(this, subjectRect, y1, y2, ix, d);
        };
        
        class TriangleMassInfo extends DotMoveSystem.MassInfo {
            get type() { return this._type; }
            set type(_type) { this._type = _type; }
            initialize(x, y) {
                super.initialize(x, y);
                this._type = 0;
            }
        }
        FunctionEx.TriangleMassInfo = TriangleMassInfo;
        DotMoveSystem.CharacterCollisionChecker.prototype.calcMassTriangle = function (id, characterRect, direction, ix, iy) {
            switch (id) {
                case LEFT_UP_TRIANGLE_ID:
                    if (direction === 8) {
                        const dx = characterRect.x - ix;
                        const h = 1 - dx;
                        return new DotMoveSystem.DotMoveRectangle(ix, iy, 1, h);
                    }
                    else if (direction === 4) {
                        const dy = characterRect.y - iy;
                        let w = 1 - dy;
                        return new DotMoveSystem.DotMoveRectangle(ix, iy, w, 1);
                    }
                    break;
                case DOWN_LEFT_TRIANGLE_ID:
                    if (direction === 2) {
                        const dx = characterRect.x - ix;
                        const h = 1 - dx;
                        return new DotMoveSystem.DotMoveRectangle(ix, iy + (1 - h), 1, h);
                    }
                    else if (direction === 4) {
                        const dy = characterRect.y2 - iy;
                        const w = dy;
                        return new DotMoveSystem.DotMoveRectangle(ix, iy, w, 1);
                    }
                    break;
                case RIGHT_DOWN_TRIANGLE_ID:
                    if (direction === 6) {
                        const dy = characterRect.y2 - iy;
                        const w = dy;
                        return new DotMoveSystem.DotMoveRectangle(ix + (1 - w), iy, w, 1);
                    }
                    else if (direction === 2) {
                        const dx = characterRect.x2 - ix;
                        const h = dx;
                        return new DotMoveSystem.DotMoveRectangle(ix, iy + (1 - h), 1, h);
                    }
                    break;
                case UP_RIGHT_TRIANGLE_ID:
                    if (direction === 8) {
                        const dx = characterRect.x2 - ix;
                        const h = dx;
                        return new DotMoveSystem.DotMoveRectangle(ix, iy, 1, h);
                    }
                    else if (direction === 6) {
                        const dy = characterRect.y - iy;
                        const w = 1 - dy;
                        return new DotMoveSystem.DotMoveRectangle(ix + (1 - w), iy, w, 1);
                    }
                    break;
            }
            throw new Error(`Calc triangle failed. (id=${id}, direction=${direction})`);
        };
        const _CharacterCollisionChecker_checkCollisionCliff = DotMoveSystem.CharacterCollisionChecker.prototype.checkCollisionCliff;
        DotMoveSystem.CharacterCollisionChecker.prototype.checkCollisionCliff = function (subjectRect, massRange, d) {
            for (let ix = massRange.x; ix < massRange.x2; ix++) {
                for (let iy = massRange.y; iy < massRange.y2; iy++) {
                    const ix2 = $gameMap.roundX(ix);
                    const iy2 = $gameMap.roundX(iy);
                    const id = $gameMap.regionId(ix2, iy2);
                    if (id >= START_TRIANGLE_ID && id <= END_TRIANGLE_ID)
                        return [];
                }
            }
            return _CharacterCollisionChecker_checkCollisionCliff.call(this, subjectRect, massRange, d);
        };
        const _CharacterCollisionChecker_checkCollisionMass = DotMoveSystem.CharacterCollisionChecker.prototype.checkCollisionMass;
        DotMoveSystem.CharacterCollisionChecker.prototype.checkCollisionMass = function (subjectRect, d, ix, iy) {
            const id = this.getMassCollisionType(ix, iy);
            if (this.checkPassMass(ix, iy, d))
                return [];
            
            const tmpThroughIfCollided = this._throughIfCollided;
            this._throughIfCollided = false;
            if (id === LEFT_UP_TRIANGLE_ID) {
                return this.checkCollisionMassLeftUp(subjectRect, d, ix, iy);
            }
            else if (id === DOWN_LEFT_TRIANGLE_ID) {
                return this.checkCollisionMassDownLeft(subjectRect, d, ix, iy);
            }
            else if (id === RIGHT_DOWN_TRIANGLE_ID) {
                return this.checkCollisionMassRightDown(subjectRect, d, ix, iy);
            }
            else if (id === UP_RIGHT_TRIANGLE_ID) {
                return this.checkCollisionMassUpRight(subjectRect, d, ix, iy);
            }
            this._throughIfCollided = tmpThroughIfCollided;
            return _CharacterCollisionChecker_checkCollisionMass.call(this, subjectRect, d, ix, iy);
        };
        DotMoveSystem.CharacterCollisionChecker.prototype.checkCollisionMassLeftUp = function (subjectRect, d, ix, iy) {
            const massRect = new DotMoveSystem.DotMoveRectangle(ix, iy, 1, 1);
            const pos = new DotMoveSystem.DotMovePoint(this._origX, this._origY);
            const triangleMassInfo = new TriangleMassInfo(ix, iy);
            const result = this.checkCollidedRect(d, subjectRect.clone(), massRect, triangleMassInfo);
            if (!result)
                return [];
            if (d === 8) {
                if (pos.x < ix) {
                    triangleMassInfo.type = LEFT_UP_TRIANGLE_ID;
                    return [result];
                }
                else {
                    const rect = this.calcMassTriangle(LEFT_UP_TRIANGLE_ID, subjectRect, d, ix, iy);
                    const result2 = this.checkCollidedRect(d, subjectRect.clone(), rect, triangleMassInfo);
                    if (!result2)
                        return [];
                    triangleMassInfo.type = LEFT_UP_TRIANGLE_ID;
                    return [result2];
                }
            }
            else if (d === 6) {
                if (pos.x < ix) {
                    return [result];
                }
                else {
                    return [];
                }
            }
            else if (d === 2) {
                if (pos.y < iy) {
                    return [result];
                }
                else {
                    return [];
                }
            }
            else if (d === 4) {
                if (pos.y < iy) {
                    triangleMassInfo.type = LEFT_UP_TRIANGLE_ID;
                    return [result];
                }
                else {
                    const rect = this.calcMassTriangle(LEFT_UP_TRIANGLE_ID, subjectRect, d, ix, iy);
                    const result2 = this.checkCollidedRect(d, subjectRect.clone(), rect, triangleMassInfo);
                    if (!result2)
                        return [];
                    triangleMassInfo.type = LEFT_UP_TRIANGLE_ID;
                    return [result2];
                }
            }
            return [];
        };
        DotMoveSystem.CharacterCollisionChecker.prototype.checkCollisionMassDownLeft = function (subjectRect, d, ix, iy) {
            const massRect = new DotMoveSystem.DotMoveRectangle(ix, iy, 1, 1);
            const pos = new DotMoveSystem.DotMovePoint(this._origX, this._origY);
            const triangleMassInfo = new TriangleMassInfo(ix, iy);
            const result = this.checkCollidedRect(d, subjectRect.clone(), massRect, triangleMassInfo);
            if (!result)
                return [];
            if (d === 8) {
                if (pos.y + this._character.height() < iy + 1) {
                    return [];
                }
                else {
                    return [result];
                }
            }
            else if (d === 6) {
                if (pos.x < ix) {
                    return [result];
                }
                else {
                    return [];
                }
            }
            else if (d === 2) {
                if (pos.x < ix) {
                    triangleMassInfo.type = DOWN_LEFT_TRIANGLE_ID;
                    return [result];
                }
                else {
                    const rect = this.calcMassTriangle(DOWN_LEFT_TRIANGLE_ID, subjectRect, d, ix, iy);
                    const result2 = this.checkCollidedRect(d, subjectRect.clone(), rect, triangleMassInfo);
                    if (!result2)
                        return [];
                    triangleMassInfo.type = DOWN_LEFT_TRIANGLE_ID;
                    return [result2];
                }
            }
            else if (d === 4) {
                if (pos.y + this._character.height() > iy + 1) {
                    triangleMassInfo.type = DOWN_LEFT_TRIANGLE_ID;
                    return [result];
                }
                else {
                    const rect = this.calcMassTriangle(DOWN_LEFT_TRIANGLE_ID, subjectRect, d, ix, iy);
                    const result2 = this.checkCollidedRect(d, subjectRect.clone(), rect, triangleMassInfo);
                    if (!result2)
                        return [];
                    triangleMassInfo.type = DOWN_LEFT_TRIANGLE_ID;
                    return [result2];
                }
            }
            return [];
        };
        DotMoveSystem.CharacterCollisionChecker.prototype.checkCollisionMassRightDown = function (subjectRect, d, ix, iy) {
            const massRect = new DotMoveSystem.DotMoveRectangle(ix, iy, 1, 1);
            const pos = new DotMoveSystem.DotMovePoint(this._origX, this._origY);
            const triangleMassInfo = new TriangleMassInfo(ix, iy);
            const result = this.checkCollidedRect(d, subjectRect.clone(), massRect, triangleMassInfo);
            if (!result)
                return [];
            if (d === 8) {
                if (pos.y + this._character.height() < iy + 1) {
                    return [];
                }
                else {
                    return [result];
                }
            }
            else if (d === 6) {
                if (pos.y + this._character.height() > iy + 1) {
                    triangleMassInfo.type = RIGHT_DOWN_TRIANGLE_ID;
                    return [result];
                }
                else {
                    const rect = this.calcMassTriangle(RIGHT_DOWN_TRIANGLE_ID, subjectRect, d, ix, iy);
                    const result2 = this.checkCollidedRect(d, subjectRect.clone(), rect, triangleMassInfo);
                    if (!result2)
                        return [];
                    triangleMassInfo.type = RIGHT_DOWN_TRIANGLE_ID;
                    return [result2];
                }
            }
            else if (d === 2) {
                if (pos.x + this._character.width() > ix + 1) {
                    triangleMassInfo.type = RIGHT_DOWN_TRIANGLE_ID;
                    return [result];
                }
                else {
                    const rect = this.calcMassTriangle(RIGHT_DOWN_TRIANGLE_ID, subjectRect, d, ix, iy);
                    const result2 = this.checkCollidedRect(d, subjectRect.clone(), rect, triangleMassInfo);
                    if (!result2)
                        return [];
                    triangleMassInfo.type = RIGHT_DOWN_TRIANGLE_ID;
                    return [result2];
                }
            }
            else if (d === 4) {
                if (pos.x + this._character.width() > ix + 1) {
                    return [result];
                }
                else {
                    return [];
                }
            }
            return [];
        };
        DotMoveSystem.CharacterCollisionChecker.prototype.checkCollisionMassUpRight = function (subjectRect, d, ix, iy) {
            const massRect = new DotMoveSystem.DotMoveRectangle(ix, iy, 1, 1);
            const pos = new DotMoveSystem.DotMovePoint(this._origX, this._origY);
            const triangleMassInfo = new TriangleMassInfo(ix, iy);
            const result = this.checkCollidedRect(d, subjectRect.clone(), massRect, triangleMassInfo);
            if (!result)
                return [];
            if (d === 8) {
                if (pos.x + this._character.width() >= ix + 1) {
                    triangleMassInfo.type = UP_RIGHT_TRIANGLE_ID;
                    return [result];
                }
                else {
                    const rect = this.calcMassTriangle(UP_RIGHT_TRIANGLE_ID, subjectRect, d, ix, iy);
                    const result2 = this.checkCollidedRect(d, subjectRect.clone(), rect, triangleMassInfo);
                    if (!result2)
                        return [];
                    triangleMassInfo.type = UP_RIGHT_TRIANGLE_ID;
                    return [result2];
                }
            }
            else if (d === 6) {
                if (pos.y < iy) {
                    triangleMassInfo.type = UP_RIGHT_TRIANGLE_ID;
                    return [result];
                }
                else {
                    const rect = this.calcMassTriangle(UP_RIGHT_TRIANGLE_ID, subjectRect, d, ix, iy);
                    const result2 = this.checkCollidedRect(d, subjectRect.clone(), rect, triangleMassInfo);
                    if (!result2)
                        return [];
                    triangleMassInfo.type = UP_RIGHT_TRIANGLE_ID;
                    return [result2];
                }
            }
            else if (d === 2) {
                if (pos.y > iy) {
                    return [];
                }
                else {
                    return [result];
                }
            }
            else if (d === 4) {
                if (pos.x + this._character.width() > ix + 1) {
                    return [result];
                }
                else {
                    return [];
                }
            }
            return [];
        };
        DotMoveSystem.CharacterDotMoveProcess.prototype.calcUp = function (dis) {
            const pos = this._character.positionPoint();
            const collisionResults = this.checkCollision(pos.x, pos.y + dis.y, 8);
            if (collisionResults.length >= 1) {
                if (this.checkCollisionResultIsAllTriangleMass(collisionResults, LEFT_UP_TRIANGLE_ID)) {
                    const dis2 = this.calcDistance(DotMoveSystem.Degree.UP_RIGHT);
                    return this.calcUpRight(dis2);
                }
                else if (this.checkCollisionResultIsAllTriangleMass(collisionResults, UP_RIGHT_TRIANGLE_ID)) {
                    const dis2 = this.calcDistance(DotMoveSystem.Degree.LEFT_UP);
                    return this.calcLeftUp(dis2);
                }
            }
            if (this.canSlide(collisionResults, 4)) {
                return this.calcSlideLeftWhenUp(pos, dis, collisionResults);
            }
            else if (this.canSlide(collisionResults, 6)) {
                return this.calcSlideRightWhenUp(pos, dis, collisionResults);
            }
            if (dis.x < 0) {
                return this.calcLeftUpWithoutSlide(dis);
            }
            else {
                return this.calcUpRightWithoutSlide(dis);
            }
        };
        DotMoveSystem.CharacterDotMoveProcess.prototype.calcRight = function (dis) {
            const pos = this._character.positionPoint();
            const collisionResults = this.checkCollision(pos.x + dis.x, pos.y, 6);
            if (collisionResults.length >= 1) {
                if (this.checkCollisionResultIsAllTriangleMass(collisionResults, UP_RIGHT_TRIANGLE_ID)) {
                    const dis2 = this.calcDistance(DotMoveSystem.Degree.RIGHT_DOWN);
                    return this.calcRightDown(dis2);
                }
                else if (this.checkCollisionResultIsAllTriangleMass(collisionResults, RIGHT_DOWN_TRIANGLE_ID)) {
                    const dis2 = this.calcDistance(DotMoveSystem.Degree.UP_RIGHT);
                    return this.calcUpRight(dis2);
                }
            }
            if (this.canSlide(collisionResults, 8)) {
                return this.calcSlideUpWhenRight(pos, dis, collisionResults);
            }
            else if (this.canSlide(collisionResults, 2)) {
                return this.calcSlideDownWhenRight(pos, dis, collisionResults);
            }
            if (dis.y < 0) {
                return this.calcUpRightWithoutSlide(dis);
            }
            else {
                return this.calcRightDownWithoutSlide(dis);
            }
        };
        DotMoveSystem.CharacterDotMoveProcess.prototype.calcDown = function (dis) {
            const pos = this._character.positionPoint();
            const collisionResults = this.checkCollision(pos.x, pos.y + dis.y, 2);
            if (collisionResults.length >= 1) {
                if (this.checkCollisionResultIsAllTriangleMass(collisionResults, DOWN_LEFT_TRIANGLE_ID)) {
                    const dis2 = this.calcDistance(DotMoveSystem.Degree.RIGHT_DOWN);
                    return this.calcRightDown(dis2);
                }
                else if (this.checkCollisionResultIsAllTriangleMass(collisionResults, RIGHT_DOWN_TRIANGLE_ID)) {
                    const dis2 = this.calcDistance(DotMoveSystem.Degree.DOWN_LEFT);
                    return this.calcDownLeft(dis2);
                }
            }
            if (this.canSlide(collisionResults, 4)) {
                return this.calcSlideLeftWhenDown(pos, dis, collisionResults);
            }
            else if (this.canSlide(collisionResults, 6)) {
                return this.calcSlideRightWhenDown(pos, dis, collisionResults);
            }
            if (dis.x < 0) {
                return this.calcDownLeftWithoutSlide(dis);
            }
            else {
                return this.calcRightDownWithoutSlide(dis);
            }
        };
        DotMoveSystem.CharacterDotMoveProcess.prototype.calcLeft = function (dis) {
            const pos = this._character.positionPoint();
            const collisionResults = this.checkCollision(pos.x + dis.x, pos.y, 4);
            if (collisionResults.length >= 1) {
                if (this.checkCollisionResultIsAllTriangleMass(collisionResults, LEFT_UP_TRIANGLE_ID)) {
                    const dis2 = this.calcDistance(DotMoveSystem.Degree.DOWN_LEFT);
                    return this.calcDownLeft(dis2);
                }
                else if (this.checkCollisionResultIsAllTriangleMass(collisionResults, DOWN_LEFT_TRIANGLE_ID)) {
                    const dis2 = this.calcDistance(DotMoveSystem.Degree.LEFT_UP);
                    return this.calcLeftUp(dis2);
                }
            }
            if (this.canSlide(collisionResults, 8)) {
                return this.calcSlideUpWhenLeft(pos, dis, collisionResults);
            }
            else if (this.canSlide(collisionResults, 2)) {
                return this.calcSlideDownWhenLeft(pos, dis, collisionResults);
            }
            if (dis.y < 0) {
                return this.calcLeftUpWithoutSlide(dis);
            }
            else {
                return this.calcDownLeftWithoutSlide(dis);
            }
        };
        DotMoveSystem.CharacterDotMoveProcess.prototype.checkCollisionResultIsAllTriangleMass = function (collisionResults, type) {
            return collisionResults.every(res => {
                return (res.targetObject instanceof TriangleMassInfo) && res.targetObject.type === type;
            });
        };
    })(FunctionEx = DotMoveSystem.FunctionEx || (DotMoveSystem.FunctionEx = {}));
})(DotMoveSystem || (DotMoveSystem = {}));
